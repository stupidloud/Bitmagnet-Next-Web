"use client";

import { Suspense, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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

function StatsCard() {
  const t = useTranslations();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      // 组件装载后立即加载数据，不需要额外的条件检查
      if (isLoading) return; // 只防止重复加载

      try {
        setIsLoading(true);
        const response = await apiFetch("/api/stats", {
          next: { revalidate: 60 },
        });

        if (isMounted) {
          setData(response.data);
          setIsLoading(false);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch stats:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
          setIsLoading(false);
        }
      }
    };

    // 组件装载后立即加载数据
    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []); // 空依赖数组确保只在组件装载时执行一次

  if (isLoading) {
    return <SimpleSpinner />;
  }

  if (error) {
    return <div className="text-xs text-red-500">{t("Stats.error")}</div>;
  }

  if (!data) {
    return null;
  }

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
  // 直接在组件装载后加载统计信息
  return (
    <SimpleTooltip
      className="min-w-[200px]"
      content={<StatsCard />}
    >
      <div>
        <InfoFilledIcon className="cursor-pointer text-gray-500" size={15} />
      </div>
    </SimpleTooltip>
  );
}
