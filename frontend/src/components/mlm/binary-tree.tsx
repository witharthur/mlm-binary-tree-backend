"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { cn, formatPV, shortId, toNumber } from "@/lib/utils";
import type { TreeNode } from "@/types/api";

interface RenderNode {
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
  parent?: { x: number; y: number };
}

function flattenTree(root: TreeNode, compact: boolean) {
  const nodes: RenderNode[] = [];
  const width = compact ? 760 : 1180;
  const yGap = compact ? 104 : 140;
  const startSpread = compact ? 190 : 330;

  function walk(node: TreeNode | null | undefined, depth: number, x: number, parent?: { x: number; y: number }, spread = startSpread) {
    if (!node) return;
    const y = 64 + depth * yGap;
    nodes.push({ node, x, y, depth, parent });

    if (depth > (compact ? 2 : 5)) return;

    walk(node.left_child, depth + 1, x - spread, { x, y }, spread / 2);
    walk(node.right_child, depth + 1, x + spread, { x, y }, spread / 2);
  }

  walk(root, 0, width / 2);

  return {
    nodes,
    width,
    height: Math.max(260, 120 + Math.max(...nodes.map((item) => item.y), 0))
  };
}

export function BinaryTree({
  data,
  currentUserId,
  compact = false
}: {
  data: TreeNode;
  currentUserId?: string;
  compact?: boolean;
}) {
  const [zoom, setZoom] = useState(compact ? 0.86 : 1);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const tree = useMemo(() => flattenTree(data, compact), [compact, data]);

  const zoomIn = () => setZoom((value) => Math.min(value + 0.12, 1.7));
  const zoomOut = () => setZoom((value) => Math.max(value - 0.12, 0.62));
  const reset = () => setZoom(compact ? 0.86 : 1);

  return (
    <div className="space-y-4">
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Active volume
            <span className="ml-3 inline-flex h-2.5 w-2.5 rounded-full bg-zinc-500" />
            Inactive
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="icon" onClick={zoomOut} aria-label="Zoom out">
              <Minus className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="icon" onClick={reset} aria-label="Reset zoom">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="icon" onClick={zoomIn} aria-label="Zoom in">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "thin-scrollbar overflow-auto rounded-lg border border-white/10 bg-ink-950/44",
          compact ? "h-[280px]" : "h-[680px]"
        )}
      >
        <svg
          width={tree.width * zoom}
          height={tree.height * zoom}
          viewBox={`0 0 ${tree.width} ${tree.height}`}
          className="min-w-full"
          role="img"
          aria-label="Binary MLM tree visualization"
        >
          <g>
            {tree.nodes.map((item) =>
              item.parent ? (
                <line
                  key={`${item.node.id}-line`}
                  x1={item.parent.x}
                  y1={item.parent.y + 32}
                  x2={item.x}
                  y2={item.y - 32}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="2"
                />
              ) : null
            )}
            {tree.nodes.map((item) => {
              const active =
                item.node.is_active ?? toNumber(item.node.left_pv) + toNumber(item.node.right_pv) > 0;
              const isCurrent = item.node.id === currentUserId;

              return (
                <g
                  key={item.node.id}
                  transform={`translate(${item.x - 78} ${item.y - 36})`}
                  className="cursor-pointer"
                  onClick={() => setSelected(item.node)}
                >
                  <rect
                    width="156"
                    height="72"
                    rx="8"
                    fill={active ? "rgba(16,217,154,0.16)" : "rgba(255,255,255,0.08)"}
                    stroke={isCurrent ? "#a6ff00" : active ? "rgba(54,242,178,0.45)" : "rgba(255,255,255,0.16)"}
                    strokeWidth={isCurrent ? 3 : 1.5}
                  />
                  <text
                    x="78"
                    y="25"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="700"
                  >
                    {item.node.username}
                  </text>
                  <text x="78" y="46" textAnchor="middle" fill="#a1a1aa" fontSize="11">
                    L {formatPV(item.node.left_pv)} / R {formatPV(item.node.right_pv)}
                  </text>
                  {item.node.placement_side ? (
                    <text x="78" y="62" textAnchor="middle" fill="#c7ff4a" fontSize="10" fontWeight="700">
                      {item.node.placement_side} branch
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected?.username ?? "User details"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={selected.is_active === false ? "gray" : "green"}>
                {selected.is_active === false ? "Inactive" : "Active volume"}
              </Badge>
              <Badge tone="acid">Package #{selected.package_id ?? "none"}</Badge>
              <Badge tone="blue">{selected.placement_side ?? "Root"} position</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Left PV</p>
                <p className="mt-2 text-2xl font-black text-white">{formatPV(selected.left_pv)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Right PV</p>
                <p className="mt-2 text-2xl font-black text-white">{formatPV(selected.right_pv)}</p>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400">
              User ID: <span className="font-mono text-zinc-200">{shortId(selected.id)}</span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
