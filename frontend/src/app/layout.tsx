import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BioBinary MLM Platform",
  description: "Modern binary MLM dashboard for supplements, cosmetics, wallets, and bonuses."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
