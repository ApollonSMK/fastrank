
"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { getRankingHistory } from "@/lib/data-service"
import { RankHistory } from "@/lib/data-types"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  rank: {
    label: "Rank",
    color: "hsl(var(--primary))",
  },
}

export default function RankingHistoryChart() {
  const [rankingHistory, setRankingHistory] = React.useState<RankHistory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        const historyData = await getRankingHistory();
        setRankingHistory(historyData);
        setIsLoading(false);
    }
    fetchData();
  }, [])

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full" />
  }

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <ResponsiveContainer>
        <LineChart data={rankingHistory} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            reversed={true}
            domain={['dataMin - 2', 'dataMax + 2']}
            tickFormatter={(value) => `#${value}`}
          />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" labelKey="rank" />}
          />
          <Line
            dataKey="rank"
            type="monotone"
            stroke="var(--color-rank)"
            strokeWidth={3}
            dot={{ r: 5, fill: "var(--color-rank)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
