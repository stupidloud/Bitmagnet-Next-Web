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
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      if (isLoading || data) return;

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
        console.error("Failed to fetch stats:", err);
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

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
  const [isHovered, setIsHovered] = useState(false);
  const [isStatsLoaded, setIsStatsLoaded] = useState(false);

  // 只有当用户悬停时才加载统计信息
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isStatsLoaded) {
      setIsStatsLoaded(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <SimpleTooltip
      className="min-w-[200px]"
      content={
        isStatsLoaded ? (
          <StatsCard />
        ) : (
          <div className="text-xs text-foreground-600">
            <SimpleSpinner />
          </div>
        )
      }
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <InfoFilledIcon className="cursor-pointer text-gray-500" size={15} />
      </div>
    </SimpleTooltip>
  );
}