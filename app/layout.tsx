import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "מחפש נתונים ישראלי · Israeli Data Fetcher",
  description:
    "כלי חיפוש והורדת נתונים ממשלתיים פתוחים מ-data.gov.il — ממשק עברי, ייצוא CSV/Excel/JSON.",
  metadataBase: new URL("https://tools.noamkeshet.com"),
  openGraph: {
    title: "מחפש נתונים ישראלי",
    description: "חיפוש נתונים ממשלתיים פתוחים — data.gov.il",
    type: "website",
    locale: "he_IL",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#212121",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-text">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
