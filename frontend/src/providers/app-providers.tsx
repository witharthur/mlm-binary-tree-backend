"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { ToastViewport } from "@/components/ui/toast";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 45_000
          },
          mutations: {
            retry: 0
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastViewport />
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
