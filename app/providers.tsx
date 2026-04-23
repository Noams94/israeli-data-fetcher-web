"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useUi } from "@/lib/store";
import { isRtl } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  const lang = useUi((s) => s.lang);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("dir", isRtl(lang) ? "rtl" : "ltr");
    root.setAttribute("lang", lang);
  }, [lang]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
