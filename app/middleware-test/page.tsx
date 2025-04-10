import Link from "next/link";

export default function MiddlewareTestPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-4/5 md:w-3/5 h-full mx-auto pb-24 md:pb-20">
      <h1 className="text-3xl font-bold mb-4">中间件测试页面</h1>
      
      <p className="text-center mb-6">
        这个页面用于测试中间件是否正常工作。中间件应该只为首页设置缓存控制头，而不会为这个页面设置。
      </p>
      
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-2">如何验证</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            打开浏览器开发者工具的网络面板
          </li>
          <li>
            访问首页 (<code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">/</code>)
          </li>
          <li>
            检查响应头中是否包含 <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Cache-Control: public, s-maxage=60, stale-while-revalidate=120</code>
          </li>
          <li>
            访问这个页面 (<code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">/middleware-test</code>)
          </li>
          <li>
            检查响应头中是否不包含上述缓存控制头
          </li>
        </ol>
      </div>
      
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 w-full max-w-md mt-4">
        <h2 className="text-xl font-semibold mb-2">中间件配置</h2>
        <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto text-sm">
{`// middleware.ts
export const config = {
  matcher: '/',
};`}
        </pre>
        <p className="mt-2 text-sm text-gray-500">
          这个配置确保中间件只处理根路径 (/)
        </p>
      </div>
      
      <div className="mt-8">
        <Link 
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
