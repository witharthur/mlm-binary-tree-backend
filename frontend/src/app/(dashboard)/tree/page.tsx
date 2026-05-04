"use client";

import { Network, Route, Users } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { BinaryTree } from "@/components/mlm/binary-tree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe, useTree } from "@/lib/queries";
import { formatPV } from "@/lib/utils";

export default function TreePage() {
  const [depth, setDepth] = useState(5);
  const meQuery = useMe();
  const treeQuery = useTree(depth);

  return (
    <>
      <PageHeader
        title="MLM Binary Tree"
        description="Zoomable SVG network visualization with left/right placement, PV values, active volume color, and node detail modal."
        action={
          <div className="flex flex-wrap gap-2">
            {[3, 5, 7].map((value) => (
              <Button
                key={value}
                type="button"
                variant={value === depth ? "primary" : "secondary"}
                onClick={() => setDepth(value)}
              >
                Depth {value}
              </Button>
            ))}
          </div>
        }
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-acid-500 p-3 text-ink-950">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Active position</p>
              <p className="text-xl font-black text-white">{meQuery.data?.username ?? "Current user"}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint-500 p-3 text-ink-950">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Volume split</p>
              <p className="text-xl font-black text-white">
                {formatPV(meQuery.data?.left_pv)} L / {formatPV(meQuery.data?.right_pv)} R
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rosegold-500 p-3 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Node legend</p>
              <div className="mt-1 flex gap-2">
                <Badge tone="green">active</Badge>
                <Badge tone="gray">inactive</Badge>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader title="Interactive tree">Select a node to inspect branch volume</CardHeader>
        {treeQuery.isLoading ? (
          <Skeleton className="h-[680px]" />
        ) : treeQuery.data ? (
          <BinaryTree data={treeQuery.data} currentUserId={meQuery.data?.id} />
        ) : (
          <EmptyState
            icon={Network}
            title="Tree unavailable"
            description="The API has not returned a binary tree for this user yet."
          />
        )}
      </Card>
    </>
  );
}
