import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@nextui-org/react";

import { SearchInput } from "@/components/SearchInput";
import SearchResultsList from "@/components/SearchResultsList";
import { MagnetIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { search } from "@/app/api/graphql/service";
import {
  DEFAULT_SORT_TYPE,
  SEARCH_PAGE_SIZE,
  DEFAULT_FILTER_TIME,
  DEFAULT_FILTER_SIZE,
} from "@/config/constant";

type SearchParams = {
  keyword: string;
  p?: number;
  ps?: number;
  sortType?: string;
  filterTime?: string;
  filterSize?: string;
};

type SearchRequestType = {
  keyword: string;
  limit?: number;
  offset?: number;
  sortType?: string;
  filterTime?: string;
  filterSize?: string;
};

// Fetch data from the API based on search parameters
async function fetchData({
  keyword,
  limit = SEARCH_PAGE_SIZE,
  offset = 0,
  sortType,
  filterTime,
  filterSize,
}: SearchRequestType): Promise<any> {
  try {
    const data = await search(null, {
      queryInput: {
        keyword,
        limit,
        offset,
        sortType,
        filterTime,
        filterSize,
      },
    });

    return { data };
  } catch (error: any) {
    console.error(error);

    throw error;
  }
}

// Generate metadata for the search page
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ keyword: string }>;
}): Promise<Metadata> {
  const { keyword } = await searchParams;
  const t = await getTranslations();

  return {
    title: t("Metadata.search.title", { keyword }),
  };
}

// Get search options from the search parameters
function getSearchOption(searchParams: SearchParams) {
  return {
    keyword: searchParams.keyword,
    p: Number(searchParams.p) || 1,
    ps: searchParams.ps || SEARCH_PAGE_SIZE,
    sortType: searchParams.sortType || DEFAULT_SORT_TYPE,
    filterTime: searchParams.filterTime || DEFAULT_FILTER_TIME,
    filterSize: searchParams.filterSize || DEFAULT_FILTER_SIZE,
  };
}

// Component to render the search page
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchOption = getSearchOption(await searchParams);

  const start_time = Date.now();
  const { data } = await fetchData({
    keyword: searchOption.keyword,
    limit: searchOption.ps, // Number of items per page
    offset: (searchOption.p - 1) * searchOption.ps, // Offset calculated based on the page number
    sortType: searchOption.sortType,
    filterTime: searchOption.filterTime,
    filterSize: searchOption.filterSize,
  });
  const cost_time = Date.now() - start_time;

  return (
    <div className="w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
      <div className="flex items-center mb-7">
        <Link
          className="mb-[-2px] mr-2 md:mr-4 leading-none text-[50px] md:text-[60px]"
          href="/"
          title={siteConfig.name}
        >
          <MagnetIcon />
        </Link>
        <SearchInput defaultValue={searchOption.keyword} />
      </div>
      <SearchResultsList
        cost_time={cost_time}
        keywords={data.keywords}
        resultList={data.torrents}
        has_more={data.has_more}
        searchOption={searchOption}
        total_count={data.total_count}
      />
    </div>
  );
}
