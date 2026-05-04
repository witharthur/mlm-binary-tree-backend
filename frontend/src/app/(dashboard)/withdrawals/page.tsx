"use client";

import { AlertTriangle, CheckCircle2, Clock3, CreditCard, FileJson, ShieldAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useCreateWithdrawalMutation, useWallet, useWithdrawals } from "@/lib/queries";
import { formatCurrency, normalizeStatus, shortId, toNumber } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const defaultPaymentDetails = JSON.stringify(
  {
    method: "USDT TRC20",
    wallet: "T..."
  },
  null,
  2
);

export default function WithdrawalsPage() {
  const walletQuery = useWallet();
  const withdrawalsQuery = useWithdrawals();
  const createWithdrawal = useCreateWithdrawalMutation();
  const addToast = useUIStore((state) => state.addToast);
  const [amount, setAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(defaultPaymentDetails);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(paymentDetails) as Record<string, unknown>;
    } catch {
      addToast({
        title: "Invalid payment details",
        description: "Payment details must be valid JSON.",
        variant: "error"
      });
      return;
    }

    if (toNumber(amount) > toNumber(walletQuery.data?.main_balance)) {
      addToast({
        title: "Insufficient main balance",
        description: "Withdrawals are created from available main balance.",
        variant: "warning"
      });
      return;
    }

    try {
      await createWithdrawal.mutateAsync({
        amount,
        payment_details: parsed
      });
      addToast({
        title: "Withdrawal requested",
        description: "Admin approval status will update in the history table.",
        variant: "success"
      });
      setAmount("");
    } catch (error) {
      addToast({
        title: "Withdrawal failed",
        description: error instanceof Error ? error.message : "Please review details and try again.",
        variant: "error"
      });
    }
  };

  const pending = withdrawalsQuery.data?.filter((item) => item.status === "PENDING").length ?? 0;
  const approved = withdrawalsQuery.data?.filter((item) => item.status === "APPROVED").length ?? 0;
  const completed = withdrawalsQuery.data?.filter((item) => item.status === "COMPLETED").length ?? 0;

  return (
    <>
      <PageHeader
        title="Withdrawals"
        description="Create payout requests with structured payment details and track admin approval through every status."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-400 p-3 text-ink-950">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Pending approval</p>
              <p className="text-2xl font-black text-white">{pending}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-400 p-3 text-ink-950">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Approved</p>
              <p className="text-2xl font-black text-white">{approved}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-acid-500 p-3 text-ink-950">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Completed</p>
              <p className="text-2xl font-black text-white">{completed}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader title="Create request">Amount and payment details JSON</CardHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div className="rounded-lg border border-yellow-300/20 bg-yellow-400/10 p-3 text-sm text-yellow-100">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4" />
                Withdrawal warning
              </div>
              Confirm wallet or banking details before submission. Admins can approve,
              reject, or complete the request after review.
            </div>

            <Field label="Amount" hint={`Available main balance: ${formatCurrency(walletQuery.data?.main_balance)}`}>
              <Input
                required
                min="1"
                step="0.01"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="500.00"
              />
            </Field>

            <Field label="Payment details JSON">
              <Textarea
                value={paymentDetails}
                onChange={(event) => setPaymentDetails(event.target.value)}
                spellCheck={false}
                className="font-mono text-xs"
              />
            </Field>

            <Button
              type="submit"
              className="w-full"
              isLoading={createWithdrawal.isPending}
              disabled={!amount || createWithdrawal.isPending}
            >
              <FileJson className="h-4 w-4" />
              Request withdrawal
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Withdrawal history">Admin approval status UI</CardHeader>
          {withdrawalsQuery.isLoading ? (
            <TableSkeleton rows={7} />
          ) : withdrawalsQuery.data?.length ? (
            <div className="thin-scrollbar overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="py-3">Request</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Payment details</th>
                    <th className="py-3">Admin note</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {withdrawalsQuery.data.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-mono text-xs text-zinc-400">{shortId(item.id)}</td>
                      <td className="py-3 font-semibold text-white">{formatCurrency(item.amount)}</td>
                      <td className="py-3">
                        <Badge tone={statusTone(item.status)}>{normalizeStatus(item.status)}</Badge>
                      </td>
                      <td className="py-3">
                        <code className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-zinc-300">
                          {JSON.stringify(item.payment_details ?? {})}
                        </code>
                      </td>
                      <td className="py-3 text-zinc-400">{item.admin_note ?? "Awaiting review"}</td>
                      <td className="py-3 text-zinc-400">{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No withdrawals"
              description="Create a request to begin admin review."
            />
          )}
        </Card>
      </section>
    </>
  );
}
