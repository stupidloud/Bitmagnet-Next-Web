import { Metadata } from "next";
import { HomeLogo } from "@/components/HomeLogo";
import { SearchInput } from "@/components/SearchInput";
import { ToggleTheme, SwitchLanguage } from "@/components/FloatTool";
import { Stats } from "@/components/Stats";
import { headers } from "next/headers";

// 标记为Edge Runtime
export const runtime = 'edge';

// 生成元数据并设置缓存控制头
export async function generateMetadata(): Promise<Metadata> {
  // 设置缓存控制头
  headers().set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  return {
    // 可以在这里设置其他元数据
  };
}

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 w-4/5 md:w-3/5 h-full mx-auto pb-24 md:pb-20">
      <HomeLogo />
      <SearchInput />
      <div className="fixed bottom-4 right-4 invisible md:visible">
        <Stats />
      </div>
      <div className="fixed top-4 right-4 flex gap-1">
        <SwitchLanguage noBg />
        <ToggleTheme noBg />
      </div>
    </section>
  );
}
