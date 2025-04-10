import Link from "next/link";

import { FloatTool } from "@/components/FloatTool";
import { SearchInput } from "@/components/SearchInput";
import { MagnetIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export const runtime = "edge";

export default function DetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col justify-center gap-4 px-3 py-3 md:py-8">
      <div className="flex items-center mb-4">
        <Link href="/" className="inline-block">
          <span
            className="mb-[-2px] mr-2 md:mr-4 leading-none text-[50px] md:text-[60px] inline-block"
            title={siteConfig.name}
          >
            <MagnetIcon />
          </span>
        </Link>
        <SearchInput />
      </div>
      {children}
      <FloatTool />
    </section>
  );
}
