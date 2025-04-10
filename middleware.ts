import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 标记为Edge Runtime
export const runtime = 'edge';

export function middleware(request: NextRequest) {
  // 只为根路径设置头
  if (request.nextUrl.pathname === '/') {
    const response = NextResponse.next();
    
    // 设置缓存控制头
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    // 可以在这里设置其他响应头
    response.headers.set('X-Middleware-Cache', 'true');
    
    return response;
  }
  
  // 对于其他路径，不做任何修改
  return NextResponse.next();
}

// 配置中间件只处理根路径
export const config = {
  matcher: '/',
};
