import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Button } from "@vercel/examples-ui";

import apiFetch from "@/utils/api";
import { InfoFilledIcon } from "@/components/icons";
import { formatByteSize, formatDate } from "@/utils";

// 简单的兼容 Edge Runtime 的 Spinner 组件
function SimpleSpinner() {
  return (
    <div className="flex justify-center items-center p-2">
      <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
    </div>
  );
}

// 简单的兼容 Edge Runtime 的 Tooltip 组件
function SimpleTooltip({
  children,
  content,
  className = ""
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className={`invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full right-full mr-2 p-2 bg-gray-800 bg-opacity-60 text-white text-xs rounded-md shadow-lg z-50 ${className}`}>
        {content}
      </div>
    </div>
  );
}

async function StatsCard() {
  const t = await getTranslations();

  const { data } = await apiFetch("/api/stats", {
    next: { revalidate: 60 },
  });

  return (
    <div className="text-xs text-foreground-600">
      <h4 className="font-bold">{t("Stats.title")}</h4>
      <ul>
        <li>{t("Stats.size", { size: formatByteSize(data.size) })}</li>
        <li>
          {t("Stats.total_count", {
            total_count: data.total_count.toLocaleString(),
          })}
        </li>
        <li>
          {t("Stats.updated_at", {
            updated_at: formatDate(
              data.updated_at,
              t("COMMON.DATE_FORMAT_SHORT"),
            ),
          })}
        </li>
      </ul>
    </div>
  );
}

export function Stats() {
  return (
    <SimpleTooltip
      className="min-w-[200px]"
      content={
        <Suspense fallback={<SimpleSpinner />}>
          <StatsCard />
        </Suspense>
      }
    >
      <InfoFilledIcon className="cursor-pointer text-gray-500" size={15} />
    </SimpleTooltip>
  );
}