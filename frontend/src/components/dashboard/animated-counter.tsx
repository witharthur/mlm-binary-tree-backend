"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

export function AnimatedCounter({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const formatted = useTransform(motionValue, (latest) => formatCurrency(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: "easeOut"
    });
    return controls.stop;
  }, [motionValue, value]);

  return <motion.span>{formatted}</motion.span>;
}
