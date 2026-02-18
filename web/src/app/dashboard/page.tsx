"use client";

import { motion } from "framer-motion";

import { DashboardOverview } from "@/components/pages/dashboard-overview";

export default function DashboardPage() {
  return (
    <motion.div
      className="flex h-full flex-col gap-4"
      initial={false}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Decision Intelligence Overview
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          See how your meetings translate into decisions, risk and execution health —
          across the last 30 days.
        </p>
      </div>

      <DashboardOverview />
    </motion.div>
  );
}

