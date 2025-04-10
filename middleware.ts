import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 中间件默认就在Edge Runtime中运行，不需要显式声明

export async function middleware(request: NextRequest) {
  // 只为根路径设置头
  if (request.nextUrl.pathname === '/') {
    // 获取请求URL
    const url = request.nextUrl.clone();

    try {
      // 使用fetch获取资源
      const response = await fetch(url);

      // 获取响应体
      const body = await response.text();

      // 创建新的响应对象
      const newResponse = new NextResponse(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      // 设置缓存控制头
      newResponse.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

      // 设置自定义头以验证中间件是否生效
      newResponse.headers.set('X-Middleware-Cache', 'true');

      return newResponse;
    } catch (error) {
      console.error('Middleware fetch error:', error);
      // 如果出错，返回原始请求
      return NextResponse.next();
    }
  }

  // 对于其他路径，不做任何修改
  return NextResponse.next();
}

// 配置中间件只处理根路径
export const config = {
  matcher: '/',
};
