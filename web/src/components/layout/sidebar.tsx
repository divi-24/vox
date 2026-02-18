"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Mic,
  Share2,
  ShieldAlert,
  History,
  Settings2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, hotkey: "D" },
  { label: "Live Meeting", href: "/live", icon: Mic, hotkey: "L" },
  { label: "Decision Graph", href: "/graph", icon: Share2, hotkey: "G" },
  { label: "Risk Analytics", href: "/risk", icon: ShieldAlert, hotkey: "R" },
  { label: "History", href: "/history", icon: History, hotkey: "H" },
  { label: "Settings", href: "/settings", icon: Settings2, hotkey: "S" },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="group hidden min-h-screen border-r border-border/60 bg-sidebar/90 shadow-[0_0_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:flex"
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-background/60"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-primary/80 to-purple-500 text-background shadow-lg shadow-primary/40">
              <Sparkles className="size-4" />
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10 mix-blend-overlay" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight">
                  VoxNote
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Decision OS
                </span>
              </div>
            )}
          </Link>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="rounded-xl"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: collapsed ? 180 : 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <span className="inline-block text-[10px] text-muted-foreground">
                    {collapsed ? "»" : "«"}
                  </span>
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        <ScrollArea className="flex-1">
          <nav className="mt-3 flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Tooltip key={item.href} delayDuration={collapsed ? 0 : 600}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={[
                        "group/nav relative flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium outline-none transition-all",
                        "hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground",
                        isActive
                          ? "bg-sidebar-primary/15 text-sidebar-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
                          : "text-sidebar-foreground/80",
                      ].join(" ")}
                    >
                      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-background/40 text-muted-foreground shadow-inner shadow-black/30 transition-all group-hover/nav:bg-background/80 group-hover/nav:text-foreground">
                        <Icon className="size-4" />
                        {isActive && (
                          <motion.span
                            layoutId="nav-pill"
                            className="pointer-events-none absolute inset-0 rounded-xl border border-primary/30"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </span>
                      {!collapsed && (
                        <div className="flex flex-1 items-center justify-between gap-2">
                          <span>{item.label}</span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <kbd className="rounded border border-border/70 bg-background/70 px-1.5 py-0.5 font-mono text-[9px]">
                              G
                            </kbd>
                            <span>{item.hotkey}</span>
                          </span>
                        </div>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      <div className="flex items-center gap-2">
                        <span>{item.label}</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <kbd className="rounded border border-border/70 bg-background/70 px-1.5 py-0.5 font-mono text-[9px]">
                            G
                          </kbd>
                          <span>{item.hotkey}</span>
                        </span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-border/60 px-3 py-3">
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary/15 via-purple-500/10 to-emerald-500/10 px-3 py-2 text-xs text-muted-foreground shadow-inner shadow-black/40">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary/80">
                Seed-ready
              </span>
              {!collapsed && (
                <span className="text-[11px] text-muted-foreground">
                  Simulated intelligence. Real decisions.
                </span>
              )}
            </div>
            <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
              v2.0
            </span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

