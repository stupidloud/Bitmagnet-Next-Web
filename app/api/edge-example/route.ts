import { NextResponse } from 'next/server';

// 由于项目中的一些依赖与 Edge Runtime 不兼容，移除 Edge Runtime 标记

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'World';

  return NextResponse.json(
    {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
