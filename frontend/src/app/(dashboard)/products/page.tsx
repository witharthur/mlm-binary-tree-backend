"use client";

import { ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PackageCard } from "@/components/products/package-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe, usePackages, usePurchasePackageMutation } from "@/lib/queries";
import { makeIdempotencyKey } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import type { Package } from "@/types/api";

export default function ProductsPage() {
  const packagesQuery = usePackages();
  const meQuery = useMe();
  const purchaseMutation = usePurchasePackageMutation();
  const addToast = useUIStore((state) => state.addToast);

  const purchase = async (item: Package) => {
    try {
      await purchaseMutation.mutateAsync({
        package_id: item.id,
        idempotency_key: makeIdempotencyKey(`package_${item.id}`)
      });
      addToast({
        title: `${item.name} order created`,
        description: "The package purchase has been submitted with a unique idempotency key.",
        variant: "success"
      });
    } catch (error) {
      addToast({
        title: "Package purchase failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error"
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Products & Packages"
        description="MLM packages presented as premium БАД and cosmetics bundles with PV value, wallet safety, and upgrade flow."
      />

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-acid-500 text-ink-950 shadow-glow">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Premium commerce catalog</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Each purchase creates an order, assigns PV, and feeds referral plus binary
                volume in the backend processing flow.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-400/15 p-3 text-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Purchase safety</p>
              <p className="text-lg font-black text-white">Idempotent orders</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            Repeated clicks are disabled while the request is running, and every order gets a
            unique key.
          </p>
        </Card>
      </section>

      {packagesQuery.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[480px]" />
          ))}
        </div>
      ) : packagesQuery.data?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {packagesQuery.data.map((item) => (
            <PackageCard
              key={item.id}
              item={item}
              activePackageId={meQuery.data?.package_id}
              onPurchase={purchase}
              loading={purchaseMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No packages available"
          description="Active packages from the API will show here."
        />
      )}
    </>
  );
}
