import Link from "next/link";

export default async function EdgeExamplePage() {
  // 完全移除翻译逻辑，使页面可以静态生成
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-4/5 md:w-3/5 h-full mx-auto pb-24 md:pb-20">
      <h1 className="text-3xl font-bold mb-4">Edge Runtime Example</h1>

      <p className="text-center mb-6">
        This page is running on Edge Runtime, which provides faster performance and global distribution.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Edge Runtime Benefits</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Faster cold starts</li>
            <li>Global distribution</li>
            <li>Lower latency</li>
            <li>Automatic scaling</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Current Time</h2>
          <p>{new Date().toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">
            This time is generated at request time on the edge.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
