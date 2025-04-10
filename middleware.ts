import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 只为根路径设置头
  if (request.nextUrl.pathname === '/') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
