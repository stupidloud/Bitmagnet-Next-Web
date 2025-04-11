import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 如果在函数内部使用了 `await`，则可以将此函数标记为 `async`
export function middleware(request: NextRequest) {
  // 克隆请求头并设置一个新的头 `x-version`
  // const requestHeaders = new Headers(request.headers)
  // requestHeaders.set('x-version', '13')

  // 你也可以在 NextResponse.rewrite 中设置请求头
  const response = NextResponse.next({
    request: {
      // 新的请求头
      // headers: requestHeaders,
    },
  });

  // 为非 API 路由设置缓存控制头
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.delete("Cache-Control");
    response.headers.set("Cache-Control", "public, s-maxage=1000, stale-while-revalidate=500");
  }

  // 设置一个新的响应头 `x-hello-from-middleware2`
  // response.headers.set('x-hello-from-middleware2', 'hello')
  return response;
}

// 更多信息请参见下面的“匹配路径”
export const config = {
  /*
   * 匹配所有请求路径，但以下列开头的除外：
   * - api (API 路由)
   * - _next/static (静态文件)
   * - _next/image (图像优化文件)
   * - favicon.ico (网站图标文件)
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
