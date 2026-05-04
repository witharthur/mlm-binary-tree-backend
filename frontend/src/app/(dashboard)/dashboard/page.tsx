"use client";

import { Copy, Gift, Network, ReceiptText, TrendingUp, Users, WalletCards } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatedCounter } from "@/components/dashboard/animated-counter";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EarningsChart } from "@/components/charts/earnings-chart";
import { PageHeader } from "@/components/layout/page-header";
import { BinaryTree } from "@/components/mlm/binary-tree";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  useBonuses,
  useMe,
  usePackages,
  useTransactions,
  useTree,
  useWallet
} from "@/lib/queries";
import { mockLeaderboard } from "@/lib/mock-data";
import { formatCurrency, formatPV, getOrigin, normalizeStatus, shortId, toNumber } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import type { TreeNode } from "@/types/api";

function countTree(node?: TreeNode | null): number {
  if (!node) return 0;
  return 1 + countTree(node.left_child) + countTree(node.right_child);
}

function ReferralHub({ userId }: { userId?: string }) {
  const addToast = useUIStore((state) => state.addToast);
  const leftLink = `${getOrigin()}/ref/${userId ?? "demo-user"}/L`;
  const rightLink = `${getOrigin()}/ref/${userId ?? "demo-user"}/R`;

  const copy = async (link: string, side: string) => {
    await navigator.clipboard.writeText(link);
    addToast({
      title: `${side} branch link copied`,
      description: "The referral URL is ready to share.",
      variant: "success"
    });
  };

  return (
    <Card>
      <CardHeader title="Referral generator">Create branch-specific registration links</CardHeader>
      <div className="grid gap-4 sm:grid-cols-[128px_1fr]">
        <div className="flex items-center justify-center rounded-lg bg-white p-3">
          <QRCodeSVG value={leftLink} size={104} />
        </div>
        <div className="space-y-3">
          {[
            ["Left branch", leftLink],
            ["Right branch", rightLink]
          ].map(([label, value]) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-500">{label}</p>
                <p className="truncate font-mono text-xs text-zinc-300">{value}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={`Copy ${label}`}
                onClick={() => copy(value, label)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const meQuery = useMe();
  const walletQuery = useWallet();
  const packageQuery = usePackages();
  const transactionQuery = useTransactions();
  const bonusQuery = useBonuses();
  const treeQuery = useTree(3);

  const user = meQuery.data;
  const wallet = walletQuery.data;
  const packages = packageQuery.data ?? [];
  const activePackage = packages.find((item) => item.id === user?.package_id);
  const totalBalance =
    toNumber(wallet?.main_balance) + toNumber(wallet?.deposit_balance);
  const teamSize = countTree(treeQuery.data);
  const recentTransactions = transactionQuery.data?.slice(0, 5) ?? [];
  const recentBonuses = bonusQuery.data?.slice(0, 4) ?? [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A live command center for balance, PV strength, package status, bonuses, and binary tree momentum."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {walletQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36" />
          ))
        ) : (
          <>
            <MetricCard
              title="Total balance"
              value={<AnimatedCounter value={totalBalance} />}
              trend="+12.8% this week"
              icon={WalletCards}
            />
            <MetricCard
              title="Active package"
              value={activePackage?.name ?? "None"}
              trend={activePackage ? `${formatPV(activePackage.pv_value)} PV power` : "Choose a pack"}
              icon={TrendingUp}
              tone="mint"
            />
            <MetricCard
              title="Referral team"
              value={teamSize || "Demo"}
              trend={`${formatPV(user?.left_pv)} L / ${formatPV(user?.right_pv)} R PV`}
              icon={Users}
              tone="cyan"
            />
            <MetricCard
              title="Recent bonuses"
              value={formatCurrency(recentBonuses.reduce((sum, item) => sum + toNumber(item.amount), 0))}
              trend="Referral + binary"
              icon={Gift}
              tone="rose"
            />
          </>
        )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <EarningsChart bonuses={bonusQuery.data} />
        <Card>
          <CardHeader title="Binary preview">Click a node on the full tree page for details</CardHeader>
          {treeQuery.isLoading ? (
            <Skeleton className="h-[280px]" />
          ) : treeQuery.data ? (
            <BinaryTree data={treeQuery.data} currentUserId={user?.id} compact />
          ) : (
            <EmptyState
              icon={Network}
              title="No tree volume yet"
              description="Your binary structure appears here after referrals register."
            />
          )}
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader title="Recent transactions">Wallet activity and idempotency keys</CardHeader>
          {transactionQuery.isLoading ? (
            <TableSkeleton rows={5} />
          ) : recentTransactions.length ? (
            <div className="thin-scrollbar overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="py-3">Type</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Balance</th>
                    <th className="py-3">Key</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {recentTransactions.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-semibold text-white">{normalizeStatus(item.type)}</td>
                      <td className="py-3 text-zinc-300">{formatCurrency(item.amount)}</td>
                      <td className="py-3">
                        <Badge tone="blue">{item.balance_type}</Badge>
                      </td>
                      <td className="py-3 font-mono text-xs text-zinc-500">{shortId(item.idempotency_key)}</td>
                      <td className="py-3 text-zinc-400">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={ReceiptText}
              title="No transactions"
              description="Deposits, package purchases, bonuses, and withdrawals will appear here."
            />
          )}
        </Card>

        <div className="grid gap-6">
          <ReferralHub userId={user?.id} />
          <Card>
            <CardHeader title="Leaderboard">Top earners across the network</CardHeader>
            <div className="space-y-3">
              {mockLeaderboard.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.08] text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.username}</p>
                    <p className="text-xs text-zinc-500">{item.package} package</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{formatCurrency(item.earnings)}</p>
                    <Badge tone={statusTone("APPROVED")}>+{item.growth}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader title="Recent bonuses">Referral and binary bonus events</CardHeader>
          {bonusQuery.isLoading ? (
            <TableSkeleton rows={4} />
          ) : recentBonuses.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {recentBonuses.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <Badge tone={item.type === "BINARY" ? "green" : "acid"}>{item.type}</Badge>
                  <p className="mt-3 text-2xl font-black text-white">{formatCurrency(item.amount)}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Gift}
              title="No bonuses yet"
              description="Referral and binary bonuses will appear after package purchases."
            />
          )}
        </Card>
      </section>
    </>
  );
}
