"use client";

import { Copy, Landmark, PlusCircle, ReceiptText, RefreshCcw, ShieldAlert, WalletCards } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { AnimatedCounter } from "@/components/dashboard/animated-counter";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useDepositMutation, useTransactions, useWallet } from "@/lib/queries";
import { formatCurrency, makeIdempotencyKey, normalizeStatus, shortId, toNumber } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

export default function WalletPage() {
  const walletQuery = useWallet();
  const transactionQuery = useTransactions();
  const depositMutation = useDepositMutation();
  const addToast = useUIStore((state) => state.addToast);
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => makeIdempotencyKey("deposit"));

  const total = useMemo(
    () =>
      toNumber(walletQuery.data?.main_balance) +
      toNumber(walletQuery.data?.deposit_balance),
    [walletQuery.data]
  );

  const submitDeposit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await depositMutation.mutateAsync({
        amount,
        idempotency_key: idempotencyKey
      });
      addToast({
        title: "Deposit submitted",
        description: "Balance is optimistically updated while the API confirms.",
        variant: "success"
      });
      setAmount("");
      setIdempotencyKey(makeIdempotencyKey("deposit"));
    } catch (error) {
      addToast({
        title: "Deposit failed",
        description: error instanceof Error ? error.message : "Try again with a new key.",
        variant: "error"
      });
    }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(idempotencyKey);
    addToast({
      title: "Idempotency key copied",
      description: "Use this key to safely retry the same deposit request.",
      variant: "info"
    });
  };

  return (
    <>
      <PageHeader
        title="Wallet"
        description="Dual balance controls, deposit submission, and a full financial activity ledger."
      />

      <section className="grid gap-4 md:grid-cols-3">
        {walletQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36" />
          ))
        ) : (
          <>
            <Card>
              <p className="text-sm text-zinc-400">Total balance</p>
              <p className="mt-3 text-3xl font-black text-white">
                <AnimatedCounter value={total} />
              </p>
              <p className="mt-2 text-sm text-emerald-300">Main + deposit balances</p>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-acid-500 p-3 text-ink-950">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Main balance</p>
                  <p className="text-2xl font-black text-white">
                    {formatCurrency(walletQuery.data?.main_balance)}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-400 p-3 text-ink-950">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Deposit balance</p>
                  <p className="text-2xl font-black text-white">
                    {formatCurrency(walletQuery.data?.deposit_balance)}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Deposit funds">Idempotent wallet top-up</CardHeader>
          <form className="space-y-4" onSubmit={submitDeposit}>
            <Field label="Amount">
              <Input
                required
                min="1"
                step="0.01"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="250.00"
              />
            </Field>
            <Field label="Idempotency key" hint="Required for safe retry and double-submit protection.">
              <div className="flex gap-2">
                <Input readOnly value={idempotencyKey} className="font-mono text-xs" />
                <Button type="button" variant="secondary" size="icon" onClick={copyKey} aria-label="Copy key">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Regenerate key"
                  onClick={() => setIdempotencyKey(makeIdempotencyKey("deposit"))}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </Field>
            <div className="rounded-lg border border-yellow-300/20 bg-yellow-400/10 p-3 text-sm text-yellow-100">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4" />
                Safety note
              </div>
              Reuse the same key only when retrying the same deposit. Generate a new key for
              a new payment.
            </div>
            <Button
              type="submit"
              className="w-full"
              isLoading={depositMutation.isPending}
              disabled={!amount || depositMutation.isPending}
            >
              <PlusCircle className="h-4 w-4" />
              Submit deposit
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Transaction history">Clear status and key visibility</CardHeader>
          {transactionQuery.isLoading ? (
            <TableSkeleton rows={7} />
          ) : transactionQuery.data?.length ? (
            <div className="thin-scrollbar overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="py-3">Type</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Balance</th>
                    <th className="py-3">Description</th>
                    <th className="py-3">Key</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {transactionQuery.data.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-semibold text-white">{normalizeStatus(item.type)}</td>
                      <td className="py-3 text-zinc-300">{formatCurrency(item.amount)}</td>
                      <td className="py-3">
                        <Badge tone="blue">{item.balance_type}</Badge>
                      </td>
                      <td className="py-3 text-zinc-400">{item.description ?? "Ledger entry"}</td>
                      <td className="py-3 font-mono text-xs text-zinc-500">{shortId(item.idempotency_key)}</td>
                      <td className="py-3 text-zinc-400">{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={ReceiptText}
              title="No transactions yet"
              description="Top-ups, purchases, bonuses, and withdrawals will be listed here."
            />
          )}
        </Card>
      </section>
    </>
  );
}
