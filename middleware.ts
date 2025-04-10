import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 中间件默认就在Edge Runtime中运行，不需要显式声明

export function middleware(request: NextRequest) {
  // 只为根路径设置头
  if (request.nextUrl.pathname === '/') {
    // 使用next方法而不是rewrite，以避免可能的缓存问题
    const response = NextResponse.next();

    // 设置与页面级revalidate(600秒)一致的缓存控制头
    response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=1800');

    // 设置自定义头以验证中间件是否生效
    response.headers.set('X-Middleware-Cache', 'true');

    return response;
  }

  // 对于其他路径，不做任何修改
  return NextResponse.next();
}

// 配置中间件处理的路径
export const config = {
  matcher: ['/'],
};
