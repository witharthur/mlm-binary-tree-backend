"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function Modal({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel w-full max-w-lg rounded-lg p-5"
            initial={{ y: 18, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.97 }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <Button
                aria-label="Close modal"
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
