"use client";

import { useEffect, useState } from "react";
import { Tooltip, Spinner } from "@nextui-org/react";
import { useTranslations } from "next-intl";

import apiFetch from "@/utils/api";
import { InfoFilledIcon } from "@/components/icons";
import { formatByteSize, formatDate } from "@/utils";

// 定义Stats数据类型
interface StatsData {
  size: number;
  total_count: number;
  updated_at: string | number; // 可以是字符串或数字
}

function StatsCard() {
  const t = useTranslations();
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiFetch("/api/stats");
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  if (!data) {
    return <div className="text-xs text-foreground-600">{t("Stats.error")}</div>;
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
              typeof data.updated_at === 'string'
                ? parseInt(data.updated_at, 10)
                : data.updated_at, // 根据类型进行适当转换
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
    <Tooltip
      classNames={{
        content: "bg-opacity-60",
      }}
      closeDelay={0}
      content={<StatsCard />}
      delay={0}
      radius="sm"
    >
      <InfoFilledIcon className="cursor-pointer text-gray-500" size={15} />
    </Tooltip>
  );
}
