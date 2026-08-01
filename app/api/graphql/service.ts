import { query } from "@/lib/pgdb";
import { jiebaCut } from "@/lib/jieba";
import { SEARCH_KEYWORD_SPLIT_REGEX } from "@/config/constant";

type Torrent = {
  info_hash: Buffer; // The hash info of the torrent
  name: string; // The name of the torrent
  size: string; // The size of the torrent
  files_count: number; // The count of files in the torrent
  files: TorrentFile[]; // The list of files in the torrent
  created_at: number; // The timestamp when the torrent was created
  updated_at: number; // The timestamp when the torrent was last updated
};

type TorrentFile = {
  index: number; // The index of the file in the torrent
  path: string; // The path of the file in the torrent
  size: string; // The size of the file in the torrent
  extension: string; // The extension of the file
};

const REGEX_PADDING_FILE = /^(_____padding_file_|\.pad\/\d+&)/; // Regular expression to identify padding files

export function formatTorrent(row: Torrent) {
  const hash = row.info_hash.toString("hex"); // Convert info_hash from Buffer to hex string

  const generateSingleFiles = (row: Torrent) => {
    return [
      {
        index: 0,
        path: row.name,
        size: Number(row.size),
        extension: row.name.split(".").pop() || "",
      },
    ];
  };

  return {
    hash: hash,
    name: row.name,
    size: Number(row.size),
    magnet_uri: `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(row.name)}&xl=${row.size}`, // Create magnet URI
    single_file: row.files_count <= 1,
    files_count: row.files_count || 1,
    files: (row.files_count > 0 ? row.files : generateSingleFiles(row))
      .map((file) => ({
        index: file.index,
        path: file.path,
        size: Number(file.size),
        extension: file.extension,
      }))
      .sort((a, b) => {
        // Sorting priority: padding_file lowest -> extension empty next -> ascending index
        const aPadding = REGEX_PADDING_FILE.test(a.path) ? 1 : 0;
        const bPadding = REGEX_PADDING_FILE.test(b.path) ? 1 : 0;

        if (aPadding !== bPadding) {
          return aPadding - bPadding; // padding_file has the lowest priority
        }

        const aNoExtension = !a.extension ? 1 : 0;
        const bNoExtension = !b.extension ? 1 : 0;

        if (aNoExtension !== bNoExtension) {
          return aNoExtension - bNoExtension; // Files with no extension have lower priority
        }

        return a.index - b.index; // Within the same priority, sort by index in ascending order
      }),
    created_at: Math.floor(row.created_at / 1000), // Convert timestamps to seconds
    updated_at: Math.floor(row.updated_at / 1000), // Convert timestamps to seconds
  };
}

// Utility functions for query building
const buildOrderBy = (sortType: string, alias = "torrents") => {
  const orderByMap: Record<string, string> = {
    size: `${alias}.size DESC`,
    count: `COALESCE(${alias}.files_count, 0) DESC`,
    date: `${alias}.created_at ASC`,
  };

  return orderByMap[sortType] || `${alias}.created_at DESC`;
};

const buildTimeFilter = (filterTime: keyof typeof timeFilterMap) => {
  const timeFilterMap = {
    "gt-1day": "AND torrents.created_at > now() - interval '1 day'",
    "gt-7day": "AND torrents.created_at > now() - interval '1 week'",
    "gt-31day": "AND torrents.created_at > now() - interval '1 month'",
    "gt-365day": "AND torrents.created_at > now() - interval '1 year'",
  };

  return timeFilterMap[filterTime] || "";
};

const buildSizeFilter = (filterSize: keyof typeof sizeFilterMap) => {
  const sizeFilterMap = {
    lt100mb: "AND torrents.size < 100 * 1024 * 1024::bigint",
    "gt100mb-lt500mb":
      "AND torrents.size BETWEEN 100 * 1024 * 1024::bigint AND 500 * 1024 * 1024::bigint",
    "gt500mb-lt1gb":
      "AND torrents.size BETWEEN 500 * 1024 * 1024::bigint AND 1024 * 1024 * 1024::bigint",
    "gt1gb-lt5gb":
      "AND torrents.size BETWEEN 1 * 1024 * 1024 * 1024::bigint AND 5 * 1024 * 1024 * 1024::bigint",
    gt5gb: "AND torrents.size > 5 * 1024 * 1024 * 1024::bigint",
  };

  return sizeFilterMap[filterSize] || "";
};

const QUOTED_KEYWORD_REGEX = /"([^"]+)"/g;
const SLASH_REGEX = /^\/(.+)\/$/;

// 处理被斜杠包围的关键词的原始处理逻辑
const extractKeywords = (
  keyword: string,
): { keyword: string; required: boolean }[] => {
  let keywords = [];
  let match;

  // Extract exact keywords using quotation marks
  while ((match = QUOTED_KEYWORD_REGEX.exec(keyword)) !== null) {
    keywords.push({ keyword: match[1], required: true });
  }

  const remainingKeywords = keyword.replace(QUOTED_KEYWORD_REGEX, "");

  // Extract remaining keywords using regex tokenizer
  keywords.push(
    ...remainingKeywords
      .trim()
      .split(SEARCH_KEYWORD_SPLIT_REGEX)
      .map((k) => ({ keyword: k, required: false })),
  );

  // Use jieba to words segment if input is a full sentence
  if (keywords.length === 1 && keyword.length >= 4) {
    keywords.push(...jiebaCut(keyword));
  }

  // Remove duplicates and filter out keywords shorter than 2 characters to avoid slow SQL queries
  keywords = Array.from(
    new Map(keywords.map((k) => [k.keyword, k])).values(),
  ).filter(({ keyword }) => keyword.trim().length >= 2);

  // Ensure at least 1/3 keyword is required when there is no required keyword
  if (keywords.length && !keywords.some(({ required }) => required)) {
    [...keywords]
      .sort((a, b) => b.keyword.length - a.keyword.length)
      .slice(0, Math.ceil(keywords.length / 3))
      .forEach((k) => (k.required = true));
  }

  const fullKeyword = keyword.replace(/"/g, "");

  // Ensure full keyword is the first item
  if (!keywords.some((k) => k.keyword === fullKeyword)) {
    keywords.unshift({ keyword: fullKeyword, required: false });
  }

  return keywords;
};

// 新增：简单的空格分割处理，所有关键词都是必须匹配的
const simpleKeywordSplit = (
  keyword: string,
): { keyword: string; required: boolean }[] => {
  // 按空格分割关键词
  const splitKeywords = keyword
    .trim()
    .split(/\s+/)
    .filter((k) => k.length >= 2);

  // 如果没有分割出关键词，返回原始关键词
  if (splitKeywords.length === 0 && keyword.trim().length >= 2) {
    return [{ keyword: keyword.trim(), required: true }];
  }

  // 所有分割后的关键词都设置为必须匹配
  return splitKeywords.map((k) => ({ keyword: k, required: true }));
};

type SearchKeyword = {
  keyword: string;
  required: boolean;
};

type SearchKeywordGroup = {
  keywords: string[];
  required: boolean;
};

function parseSearchKeywords(keyword: string): SearchKeyword[] {
  const slashMatch = SLASH_REGEX.exec(keyword);

  if (slashMatch) {
    // 如果被斜杠包围，使用原始处理逻辑
    return extractKeywords(slashMatch[1]);
  }

  // 否则使用简单空格分割，所有关键词都是必须匹配的
  return simpleKeywordSplit(keyword);
}

const HYphenatedCodeRegex = /^(\d*[A-Za-z]{2,})-(\d{2,})$/;
const COMPACT_CODE_REGEX = /^(\d*[A-Za-z]{2,})(\d{2,})$/;

function getKeywordVariants(keyword: string) {
  const hyphenatedMatch = HYphenatedCodeRegex.exec(keyword);

  if (hyphenatedMatch) {
    return [keyword, `${hyphenatedMatch[1]}${hyphenatedMatch[2]}`];
  }

  const compactMatch = COMPACT_CODE_REGEX.exec(keyword);

  if (compactMatch) {
    return [keyword, `${compactMatch[1]}-${compactMatch[2]}`];
  }

  return [keyword];
}

function buildKeywordGroups(keywords: SearchKeyword[]): SearchKeywordGroup[] {
  return keywords.map(({ keyword, required }) => ({
    keywords: Array.from(new Set(getKeywordVariants(keyword))),
    required,
  }));
}

type KeywordConditionGroup = {
  required: boolean;
  variants: string[]; // 同一个关键词的各个变体, 每个变体绑定一个占位符
};

// 把关键词组编译成 SQL 条件片段, params 的顺序即占位符 $1..$n 的顺序
function buildKeywordConditions(
  keywordGroups: SearchKeywordGroup[],
  fieldName: string,
) {
  const params: string[] = [];
  const groups: KeywordConditionGroup[] = keywordGroups.map(
    ({ keywords, required }) => ({
      required,
      variants: keywords.map((keyword) => {
        params.push(`%${keyword}%`);

        return `${fieldName} ILIKE $${params.length}`;
      }),
    }),
  );

  return { groups, params };
}

// 把条件组拼成一条 WHERE 子句; expand 可将某个组替换成它的单个变体
function combineKeywordGroups(
  groups: KeywordConditionGroup[],
  expand?: { group: KeywordConditionGroup; condition: string },
) {
  const conditionOf = (group: KeywordConditionGroup) => {
    if (expand && group === expand.group) {
      return expand.condition;
    }

    return group.variants.length === 1
      ? group.variants[0]
      : `(${group.variants.join(" OR ")})`;
  };

  const conditions = groups.filter(({ required }) => required).map(conditionOf);
  const optionalConditions = groups
    .filter(({ required }) => !required)
    .map(conditionOf);

  if (optionalConditions.length > 0) {
    conditions.push(`(${[...optionalConditions, "TRUE"].join(" OR ")})`);
  }

  return conditions.length > 0 ? conditions.join(" AND ") : "TRUE";
}

function buildKeywordFilter(
  keywordGroups: SearchKeywordGroup[],
  fieldName: string,
) {
  const { groups, params } = buildKeywordConditions(keywordGroups, fieldName);

  return { keywordFilter: combineKeywordGroups(groups), params };
}

// 挑出变体最多的必需组, 用于 UNION 展开
function pickExpandableGroup(groups: KeywordConditionGroup[]) {
  return groups
    .filter(({ required, variants }) => required && variants.length > 1)
    .sort((a, b) => b.variants.length - a.variants.length)[0];
}

// 变体展开产生的 OR (如 '%ssis850%' OR '%ssis-850%') 会让 pg_trgm 的选择性估算翻倍,
// 进而让规划器误以为沿 torrents_created_at_desc_idx 倒序扫一小段就能凑够 LIMIT 行,
// 实际要扫上千万行 (实测 30s)。拆成 UNION 后每个分支只有一个 pattern, 各自走 GIN 索引。
function buildKeywordBranches(
  keywordGroups: SearchKeywordGroup[],
  fieldName: string,
) {
  const { groups, params } = buildKeywordConditions(keywordGroups, fieldName);
  const expandable = pickExpandableGroup(groups);

  if (!expandable) {
    return { branches: [combineKeywordGroups(groups)], params };
  }

  return {
    branches: expandable.variants.map((condition) =>
      combineKeywordGroups(groups, { group: expandable, condition }),
    ),
    params,
  };
}

function buildSearchSql({
  keywordGroups,
  sortType,
  timeFilter,
  sizeFilter,
  limitParamIndex,
  offsetParamIndex,
}: {
  keywordGroups: SearchKeywordGroup[];
  sortType: string;
  timeFilter: string;
  sizeFilter: string;
  limitParamIndex: number;
  offsetParamIndex: number;
}) {
  const { branches } = buildKeywordBranches(keywordGroups, "torrents.name");

  const buildBranch = (keywordFilter: string) => `  SELECT
    torrents.info_hash,    -- 种子哈希
    torrents.name,         -- 种子名称
    torrents.size,         -- 种子大小
    torrents.created_at,   -- 创建时间戳
    torrents.updated_at,   -- 更新时间戳
    torrents.files_count   -- 种子文件数
  FROM
    torrents
  WHERE
    (${keywordFilter})   -- 关键词过滤条件
    ${timeFilter}   -- 时间范围过滤条件
    ${sizeFilter}   -- 大小范围过滤条件`;

  const paginate = (alias?: string) => `  ORDER BY ${buildOrderBy(sortType, alias)} -- 排序方式
  LIMIT $${limitParamIndex}    -- 返回数量
  OFFSET $${offsetParamIndex}   -- 分页偏移`;

  // 单分支时保持原有形状, 让 LIMIT 直接下推到表扫描
  // 多分支时先 UNION 去重 (同一条记录可能同时命中多个变体), 再排序分页
  const filteredCte =
    branches.length === 1
      ? `filtered AS (
${buildBranch(branches[0])}
${paginate()}
)`
      : `matched AS (
${branches.map(buildBranch).join("\n  UNION\n")}
),
filtered AS (
  SELECT * FROM matched
${paginate("matched")}
)`;

  return `
-- 先查到符合过滤条件的数据
WITH ${filteredCte}
-- 从过滤后的数据中查询文件信息
SELECT
  filtered.info_hash,    -- 种子哈希
  filtered.name,         -- 种子名称
  filtered.size,         -- 种子大小
  filtered.created_at,   -- 创建时间戳
  filtered.updated_at,   -- 更新时间戳
  filtered.files_count,  -- 种子文件数
  -- 检查 files_count, 是否有文件数量
  CASE
    WHEN filtered.files_count IS NOT NULL THEN (
      -- 如果有数量, 根据 info_hash 查询文件信息到 'files' 列, 聚合成JSON
      SELECT json_agg(json_build_object(
        'index', torrent_files.index,         -- 文件在种子中的索引
        'path', torrent_files.path,           -- 文件在种子中的路径
        'size', torrent_files.size,           -- 文件大小
        'extension', torrent_files.extension  -- 文件扩展名
      ))
      FROM torrent_files
      WHERE torrent_files.info_hash = filtered.info_hash   -- 根据 info_hash 匹配文件
    )
    ELSE NULL   -- 如果 files_count 为空, 则设置为NULL
  END AS files  -- 结果别名设为 'files'
FROM
  filtered;   -- 从过滤后的数据中查询
`;
}

function buildCountSql({
  keywordGroups,
  timeFilter,
  sizeFilter,
}: {
  keywordGroups: SearchKeywordGroup[];
  timeFilter: string;
  sizeFilter: string;
}) {
  const { keywordFilter } = buildKeywordFilter(
    keywordGroups,
    "torrents.name",
  );

  return `
SELECT COUNT(*) AS total
FROM (
  SELECT 1
  FROM torrents
  WHERE
    (${keywordFilter})
    ${timeFilter}
    ${sizeFilter}
) AS limited_total;
        `;
}

export async function search(_: any, { queryInput }: any) {
  try {
    console.info("-".repeat(50));
    console.info("search params", queryInput);

    // trim keyword
    queryInput.keyword = queryInput.keyword.trim();

    const no_result = {
      keywords: [queryInput.keyword],
      torrents: [],
      total_count: 0,
      has_more: false,
    };

    // Return an empty result if no keywords are provided
    if (queryInput.keyword.length < 2) {
      return no_result;
    }

    const REGEX_HASH = /^[a-fA-F0-9]{40}$/; // 允许大写和小写字母

    if (REGEX_HASH.test(queryInput.keyword)) {
      const torrent = await torrentByHash(_, { hash: queryInput.keyword });

      if (torrent) {
        return {
          keywords: [queryInput.keyword],
          torrents: [torrent],
          total_count: 1,
          has_more: false,
        };
      }

      return no_result;
    }

    // Build SQL conditions and parameters
    const timeFilter = buildTimeFilter(queryInput.filterTime);
    const sizeFilter = buildSizeFilter(queryInput.filterSize);

    const keywords = parseSearchKeywords(queryInput.keyword);
    const keywordGroups = buildKeywordGroups(keywords);
    const keywordsPlain = keywordGroups.flatMap(({ keywords }) => keywords);

    const { params: keywordParams } = buildKeywordConditions(
      keywordGroups,
      "torrents.name",
    );
    const sql = buildSearchSql({
      keywordGroups,
      sortType: queryInput.sortType,
      timeFilter,
      sizeFilter,
      limitParamIndex: keywordParams.length + 1,
      offsetParamIndex: keywordParams.length + 2,
    });
    const params = [
      ...keywordParams,
      queryInput.limit + 1,
      queryInput.offset,
    ];

    console.debug("SQL:", sql, params);
    console.debug(
      "keywords:",
      keywordGroups.map((item, i) => ({ _: `group${i + 1}`, ...item })),
    );

    const queryStartTime = performance.now();
    const { rows: torrentsResp } = await query(sql, params);
    const queryEndTime = performance.now();

    console.info(
      `search SQL查询耗时: ${(queryEndTime - queryStartTime).toFixed(2)}ms`,
    );
    const has_more = torrentsResp.length > queryInput.limit;
    const pageRows = has_more
      ? torrentsResp.slice(0, queryInput.limit)
      : torrentsResp;

    const torrents = pageRows.map(formatTorrent);

    return { keywords: keywordsPlain, torrents, total_count: null, has_more };
  } catch (error) {
    console.error("Error in search resolver:", error);
    throw new Error("Failed to execute search query");
  }
}

export async function searchTotalCount(_: any, { queryInput }: any) {
  try {
    queryInput.keyword = queryInput.keyword.trim();

    if (queryInput.keyword.length < 2) {
      return { total_count: 0 };
    }

    const REGEX_HASH = /^[a-fA-F0-9]{40}$/;

    if (REGEX_HASH.test(queryInput.keyword)) {
      const torrent = await torrentByHash(_, { hash: queryInput.keyword });

      return { total_count: torrent ? 1 : 0 };
    }

    const timeFilter = buildTimeFilter(queryInput.filterTime);
    const sizeFilter = buildSizeFilter(queryInput.filterSize);
    const keywordGroups = buildKeywordGroups(
      parseSearchKeywords(queryInput.keyword),
    );
    const { params: keywordParams } = buildKeywordFilter(
      keywordGroups,
      "torrents.name",
    );
    const countSql = buildCountSql({
      keywordGroups,
      timeFilter,
      sizeFilter,
    });
    const { rows } = await query(countSql, keywordParams);

    return { total_count: Number(rows[0].total) };
  } catch (error) {
    console.error("Error in searchTotalCount resolver:", error);
    throw new Error("Failed to execute search count query");
  }
}

export async function torrentByHash(_: any, { hash }: { hash: string }) {
  try {
    // SQL query to fetch torrent data and files information by hash
    const sql = `
SELECT
  t.info_hash,
  t.name,
  t.size,
  t.created_at,
  t.updated_at,
  t.files_count,
  json_agg(json_build_object(
    'index', f.index,
    'path', f.path,
    'size', f.size,
    'extension', f.extension
  )) AS files
FROM torrents t
LEFT JOIN torrent_files f ON t.info_hash = f.info_hash
WHERE t.info_hash = decode($1, 'hex')
GROUP BY t.info_hash, t.name, t.size, t.created_at, t.updated_at, t.files_count;
    `;

    // 将哈希值转换为小写，因为PostgreSQL的decode函数可能对大小写敏感
    const params = [hash.toLowerCase()];

    // 记录SQL查询
    console.debug("SQL:", sql, params);

    const { rows } = await query(sql, params);
    const torrent = rows[0];

    if (!torrent) {
      return null;
    }

    return formatTorrent(torrent);
  } catch (error) {
    console.error("Error in torrentByHash resolver:", error);
    throw new Error("Failed to fetch torrent by hash");
  }
}

export async function statsInfo() {
  try {
    const sql = `
WITH db_size AS (
  SELECT pg_database_size('bitmagnet') AS size
),
torrent_count AS (
  SELECT COUNT(*) AS total_count FROM torrents
),
latest_torrent AS (
  SELECT *
    FROM torrents
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT
  db_size.size,
  latest_torrent.created_at as updated_at,
  torrent_count.total_count,
  encode(latest_torrent.info_hash, 'hex') AS latest_torrent_hash,
  json_build_object(
    'hash', encode(latest_torrent.info_hash, 'hex'),
    'name', latest_torrent.name,
    'size', latest_torrent.size,
    'created_at', latest_torrent.created_at,
    'updated_at', latest_torrent.updated_at
  ) AS latest_torrent
FROM
  db_size,
  torrent_count,
  latest_torrent;
    `;

    // 记录SQL查询
    console.debug("SQL:", sql, []);

    // 记录查询开始时间
    const queryStartTime = performance.now();

    const { rows } = await query(sql, []);

    // 计算并打印查询耗时
    const queryEndTime = performance.now();

    console.info(
      `statsInfo查询耗时: ${(queryEndTime - queryStartTime).toFixed(2)}ms`,
    );
    const data = rows[0];

    if (!data) {
      return null;
    }

    return {
      ...data,
      size: Number(data.size),
      total_count: Number(data.total_count),
      updated_at: Math.floor(new Date(data.updated_at).getTime() / 1000),
      latest_torrent: {
        ...data.latest_torrent,
        size: Number(data.latest_torrent.size),
        created_at: Math.floor(
          new Date(data.latest_torrent.created_at).getTime() / 1000,
        ),
        updated_at: Math.floor(
          new Date(data.latest_torrent.updated_at).getTime() / 1000,
        ),
      },
    };
  } catch (error) {
    console.error("Error in statsInfo resolver:", error);
    throw new Error("Failed to fetch torrents count");
  }
}
