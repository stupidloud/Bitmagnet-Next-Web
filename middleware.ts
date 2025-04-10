import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 中间件默认就在Edge Runtime中运行，不需要显式声明

export function middleware(request: NextRequest) {
  // 只为根路径设置头
  if (request.nextUrl.pathname === '/') {
    // 使用rewrite方法重写URL，保持原始路径
    const response = NextResponse.rewrite(request.nextUrl);

    // 设置缓存控制头
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    // 设置自定义头以验证中间件是否生效
    response.headers.set('X-Middleware-Cache', 'true');

    return response;
  }
  else if (request.nextUrl.pathname === '/middleware-test') {
    // 对于/middleware-test路径，不设置任何头
    return 'hello cached world';
  }

  // 对于其他路径，不做任何修改
  return NextResponse.next();
}

// 配置中间件只处理根路径
export const config = {
  matcher: '/',
};
