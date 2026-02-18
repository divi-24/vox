"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { Sidebar } from "./sidebar";
import { AppFooter } from "./footer";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background/95 to-background/80 text-foreground">
      <Sidebar />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none pointer-fine:block absolute inset-x-24 -top-40 -z-10 hidden h-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-y-32 right-0 -z-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <header className="flex items-center justify-between border-b border-border/60 bg-background/60 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              VoxNote 2.0
            </span>
            <p className="text-sm text-muted-foreground">
              Decision intelligence for fast-moving teams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm shadow-black/30 sm:flex">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                Keyboard
              </span>
              <div className="flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px]">
                <kbd className="rounded border border-border/70 bg-background/80 px-1.5 py-0.5 font-mono text-[9px]">
                  G
                </kbd>
                <span className="text-[10px] text-muted-foreground/80">
                  then
                </span>
                <kbd className="rounded border border-border/70 bg-background/80 px-1.5 py-0.5 font-mono text-[9px]">
                  D
                </kbd>
                <span className="text-[10px]">to open Dashboard</span>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 shadow-sm shadow-emerald-500/30 md:flex">
              <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Decision engine
              <span className="text-[10px] text-emerald-200/70">Live</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden px-3 py-4 md:px-6 md:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.995 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <AppFooter />
      </div>
    </div>
  );
}

