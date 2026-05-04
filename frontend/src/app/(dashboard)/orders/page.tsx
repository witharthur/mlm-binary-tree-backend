"use client";

import { Clock3, PackageCheck, ReceiptText, Truck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useOrders, usePackages } from "@/lib/queries";
import { formatCurrency, normalizeStatus, shortId } from "@/lib/utils";

const steps = ["PENDING", "COMPLETED"];

function OrderTimeline({ status }: { status: string }) {
  const currentIndex = steps.includes(status) ? steps.indexOf(status) : 0;

  return (
    <div className="flex min-w-44 items-center gap-2">
      {steps.map((step, index) => (
        <div key={step} className="flex flex-1 items-center gap-2">
          <span
            className={
              index <= currentIndex
                ? "h-2.5 w-2.5 rounded-full bg-acid-400"
                : "h-2.5 w-2.5 rounded-full bg-white/15"
            }
          />
          {index < steps.length - 1 ? (
            <span
              className={
                index < currentIndex
                  ? "h-px flex-1 bg-acid-400/70"
                  : "h-px flex-1 bg-white/15"
              }
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const ordersQuery = useOrders();
  const packagesQuery = usePackages();

  const packageName = (id: number) =>
    packagesQuery.data?.find((item) => item.id === id)?.name ?? `Package #${id}`;

  return (
    <>
      <PageHeader
        title="Orders"
        description="Package order history with status tracking and idempotency keys for each financial operation."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-acid-500 p-3 text-ink-950">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Completed orders</p>
              <p className="text-2xl font-black text-white">
                {ordersQuery.data?.filter((item) => item.status === "COMPLETED").length ?? 0}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-400 p-3 text-ink-950">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Pending</p>
              <p className="text-2xl font-black text-white">
                {ordersQuery.data?.filter((item) => item.status === "PENDING").length ?? 0}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-400 p-3 text-ink-950">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Fulfillment</p>
              <p className="text-2xl font-black text-white">Tracked</p>
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader title="Order history">All package purchases and upgrades</CardHeader>
        {ordersQuery.isLoading ? (
          <TableSkeleton rows={7} />
        ) : ordersQuery.data?.length ? (
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="py-3">Order</th>
                  <th className="py-3">Package</th>
                  <th className="py-3">Amount</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Tracking</th>
                  <th className="py-3">Idempotency</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {ordersQuery.data.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-mono text-xs text-zinc-400">{shortId(item.id)}</td>
                    <td className="py-3 font-semibold text-white">{packageName(item.package_id)}</td>
                    <td className="py-3 text-zinc-300">{formatCurrency(item.amount)}</td>
                    <td className="py-3">
                      <Badge tone={statusTone(item.status)}>{normalizeStatus(item.status)}</Badge>
                    </td>
                    <td className="py-3">
                      <OrderTimeline status={item.status} />
                    </td>
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
            title="No orders"
            description="Package purchases and upgrades will be visible here."
          />
        )}
      </Card>
    </>
  );
}
