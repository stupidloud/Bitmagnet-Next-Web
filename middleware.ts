import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 中间件默认就在Edge Runtime中运行，不需要显式声明

export function middleware(request: NextRequest) {
  // 为指定路径设置缓存头
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/edge-example') {
    // 使用next方法，允许请求继续到目标路由
    const response = NextResponse.next();

    // 设置强缓存控制头，确保Vercel CDN缓存页面
    // max-age：浏览器缓存时间
    // s-maxage：CDN缓存时间
    // stale-while-revalidate：允许使用过期缓存的时间，同时在后台刷新
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=7200');
    
    // 添加其他有助于缓存的头
    response.headers.set('CDN-Cache-Control', 's-maxage=3600'); // 专门针对Vercel CDN
    response.headers.set('Vercel-CDN-Cache-Control', 'max-age=3600'); // Vercel Edge Network特定头
    
    // 对于首页，添加Vary头，确保为不同语言缓存不同版本
    if (request.nextUrl.pathname === '/') {
      response.headers.set('Vary', 'Cookie, Accept-Language');
    }
    
    // 设置自定义头以验证中间件是否生效
    response.headers.set('X-Middleware-Cache', 'true');

    return response;
  }

  // 对于其他路径，不做任何修改
  return NextResponse.next();
}

// 配置中间件处理的路径
export const config = {
  matcher: ['/', '/edge-example'],
};
