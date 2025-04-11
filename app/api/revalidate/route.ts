import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // 验证安全令牌
    if (token !== process.env.REVALIDATION_TOKEN) {
      return NextResponse.json(
        { 
          message: 'Invalid token', 
          revalidated: false 
        }, 
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { tag, path } = body;
    
    if (tag) {
      // 重新验证特定标签的缓存
      revalidateTag(tag);
      return NextResponse.json({
        message: `Tag "${tag}" revalidated successfully`,
        revalidated: true,
        now: Date.now()
      });
    } else if (path) {
      // 重新验证特定路径的缓存
      revalidatePath(path);
      return NextResponse.json({
        message: `Path "${path}" revalidated successfully`,
        revalidated: true,
        now: Date.now()
      });
    } else {
      return NextResponse.json(
        { 
          message: 'Either tag or path is required', 
          revalidated: false 
        }, 
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { 
        message: error.message || 'Error revalidating', 
        revalidated: false 
      }, 
      { status: 500 }
    );
  }
}
