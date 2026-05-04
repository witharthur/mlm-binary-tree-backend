"use client";

import { Filter, Gift, Network, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useBonuses } from "@/lib/queries";
import { cn, formatCurrency, normalizeStatus, shortId, toNumber } from "@/lib/utils";

export default function BonusesPage() {
  const bonusesQuery = useBonuses();
  const [type, setType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return (bonusesQuery.data ?? []).filter((item) => {
      const created = new Date(item.created_at).getTime();
      const matchesType = type === "ALL" || item.type === type;
      const matchesFrom = from ? created >= new Date(from).getTime() : true;
      const matchesTo = to ? created <= new Date(`${to}T23:59:59`).getTime() : true;
      return matchesType && matchesFrom && matchesTo;
    });
  }, [bonusesQuery.data, from, to, type]);

  const referralTotal = filtered
    .filter((item) => item.type === "REFERRAL")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const binaryTotal = filtered
    .filter((item) => item.type === "BINARY")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  return (
    <>
      <PageHeader
        title="Bonuses"
        description="Referral and binary bonus history with type and date filters for transparent commission review."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rosegold-500 p-3 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Referral bonus</p>
              <p className="text-2xl font-black text-white">{formatCurrency(referralTotal)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-acid-500 p-3 text-ink-950">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Binary bonus</p>
              <p className="text-2xl font-black text-white">{formatCurrency(binaryTotal)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-400 p-3 text-ink-950">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Filtered events</p>
              <p className="text-2xl font-black text-white">{filtered.length}</p>
            </div>
          </div>
        </Card>
      </section>

      <Card className="mb-6">
        <CardHeader title="Filters">Narrow bonus logs by date or type</CardHeader>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Type">
            <select
              className={cn(
                "h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none focus:border-acid-400/70 focus:ring-2 focus:ring-acid-400/20"
              )}
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option className="bg-ink-900" value="ALL">All bonuses</option>
              <option className="bg-ink-900" value="REFERRAL">Referral</option>
              <option className="bg-ink-900" value="BINARY">Binary</option>
            </select>
          </Field>
          <Field label="From">
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
          <div className="flex items-end">
            <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-400">
              <Filter className="h-4 w-4 text-acid-400" />
              Client-side filtered
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Bonus history">Commission log from the API</CardHeader>
        {bonusesQuery.isLoading ? (
          <TableSkeleton rows={7} />
        ) : filtered.length ? (
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="py-3">Type</th>
                  <th className="py-3">Amount</th>
                  <th className="py-3">Source user</th>
                  <th className="py-3">Idempotency</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <Badge tone={item.type === "BINARY" ? "green" : "acid"}>
                        {normalizeStatus(item.type)}
                      </Badge>
                    </td>
                    <td className="py-3 font-semibold text-white">{formatCurrency(item.amount)}</td>
                    <td className="py-3 font-mono text-xs text-zinc-400">{shortId(item.source_user_id)}</td>
                    <td className="py-3 font-mono text-xs text-zinc-500">{shortId(item.idempotency_key)}</td>
                    <td className="py-3 text-zinc-400">{new Date(item.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Gift}
            title="No matching bonuses"
            description="Adjust filters or wait for referral and binary events."
          />
        )}
      </Card>
    </>
  );
}
