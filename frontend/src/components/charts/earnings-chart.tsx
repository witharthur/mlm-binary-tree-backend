"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { mockEarnings } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { BonusLog, EarningsPoint } from "@/types/api";

function buildPoints(bonuses?: BonusLog[]): EarningsPoint[] {
  if (!bonuses?.length) return mockEarnings;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const points = days.map((name) => ({ name, referral: 0, binary: 0 }));

  bonuses.forEach((bonus) => {
    const index = new Date(bonus.created_at).getDay();
    const adjustedIndex = index === 0 ? 6 : index - 1;
    if (bonus.type === "REFERRAL") {
      points[adjustedIndex].referral += Number(bonus.amount);
    } else {
      points[adjustedIndex].binary += Number(bonus.amount);
    }
  });

  return points;
}

export function EarningsChart({ bonuses }: { bonuses?: BonusLog[] }) {
  const data = buildPoints(bonuses);

  return (
    <Card className="min-h-[360px]">
      <CardHeader title="Earnings chart">Referral and binary bonus flow this week</CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="binary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a6ff00" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#a6ff00" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="referral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff8f70" stopOpacity={0.42} />
                <stop offset="95%" stopColor="#ff8f70" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(11,16,32,0.94)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff"
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Area
              type="monotone"
              dataKey="binary"
              stroke="#a6ff00"
              strokeWidth={2.5}
              fill="url(#binary)"
            />
            <Area
              type="monotone"
              dataKey="referral"
              stroke="#ff8f70"
              strokeWidth={2.5}
              fill="url(#referral)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
