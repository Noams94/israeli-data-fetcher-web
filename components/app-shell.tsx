"use client";

import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-4 md:px-8">
          {children}
          <Footer />
        </div>
      </main>
    </div>
  );
}
