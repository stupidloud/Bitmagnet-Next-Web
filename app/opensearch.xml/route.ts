import { NextRequest } from "next/server";

import { siteConfig } from "@/config/site";

// OpenSearch 描述文档, 浏览器据此把本站加为搜索引擎, 可直接在地址栏搜索
// 规范: https://github.com/dewitt/opensearch/blob/master/opensearch-1-1-draft-6.md

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

// 同一份代码同时跑在多个域名下, 模板 URL 必须跟着当前请求的 origin 走。
// Cloudflare 会把原始 Host 透传过来, 但保留 x-forwarded-* 作为兜底
function resolveOrigin(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!host) {
    return new URL(request.url).origin;
  }

  const proto =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");

  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const origin = escapeXml(resolveOrigin(request));

  // {searchTerms} 是 OpenSearch 的占位符, 由浏览器替换成用户输入, 不要当模板字符串处理
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>${escapeXml(siteConfig.shortName)}</ShortName>
  <LongName>${escapeXml(siteConfig.name)}</LongName>
  <Description>${escapeXml(siteConfig.description)}</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image height="16" type="image/x-icon" width="16">${origin}/favicon.ico</Image>
  <Url method="get" template="${origin}/search?keyword={searchTerms}" type="text/html"/>
  <Url rel="self" template="${origin}/opensearch.xml" type="application/opensearchdescription+xml"/>
  <moz:SearchForm>${origin}</moz:SearchForm>
</OpenSearchDescription>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/opensearchdescription+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
