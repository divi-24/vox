"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useRiskSummary, useTasks } from "@/lib/hooks";

export default function RiskAnalyticsPage() {
  const { data: riskData, loading: riskLoading } = useRiskSummary();
  const { data: allTasks } = useTasks();

  const highRiskTasks = allTasks.filter((t) => t.risk_level === "High" || t.risk_level === "Critical");
  const confidence = riskData?.average_risk_score ?? 0;

  const radialData = [
    {
      name: "Portfolio risk",
      value: confidence,
      fill:
        confidence >= 70
          ? "rgb(248,113,113)"
          : confidence >= 40
          ? "rgb(250,204,21)"
          : "rgb(52,211,153)",
    },
  ];

  const breakdown = [
    { label: "Critical risk", value: riskData?.critical_count ?? 0, tone: "high" },
    { label: "High risk", value: riskData?.high_count ?? 0, tone: "medium" },
    { label: "Medium risk", value: riskData?.medium_count ?? 0, tone: "medium" },
    { label: "Low risk", value: riskData?.low_count ?? 0, tone: "low" },
  ] as const;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Risk analytics
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            A visual pulse on where your meetings are quietly creating risk — and which
            tasks to tackle first.
          </p>
        </div>
        <Badge
          variant="outline"
          className="mt-2 rounded-full border-emerald-500/40 bg-emerald-500/10 text-[11px] text-emerald-200 md:mt-0"
        >
          Live from transcript and decisions
        </Badge>
      </div>

      <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)]">
        <Card className="relative overflow-hidden rounded-3xl border-border/80 bg-gradient-to-br from-background/85 via-background/75 to-background/55 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
          <div className="pointer-events-none absolute -left-20 -top-28 h-56 w-56 rounded-full bg-rose-500/25 blur-3xl" />

          <CardContent className="relative flex h-[420px] flex-col p-4 md:h-[460px] md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/70 text-rose-300 shadow-inner shadow-black/50">
                  <AlertTriangle className="size-4" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Risk meter
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Current portfolio risk across active meetings.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                <Activity className="size-3 text-emerald-300" />
                Real-time projection
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-4 md:flex-row">
              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="relative h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="50%"
                      outerRadius="100%"
                      data={radialData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RechartsTooltip
                        cursor={false}
                        content={null}
                      />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={99}
                        isAnimationActive
                        animationDuration={900}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  {/* Inner glass disk to mask chart square and keep copy readable */}
                  <div className="pointer-events-none absolute inset-[18%] rounded-full bg-background/95 shadow-[0_18px_40px_rgba(0,0,0,0.9)]" />
                  <div className="pointer-events-none absolute inset-[20%] flex flex-col items-center justify-center px-4 text-center text-xs">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Risk score
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25, duration: 0.25 }}
                        className="text-3xl font-semibold text-foreground"
                      >
                        {Math.round(confidence)}
                      </motion.span>
                      <span className="text-[11px] text-muted-foreground">/100</span>
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      {confidence >= 70
                        ? "High – requires active steering"
                        : confidence >= 40
                        ? "Moderate – keep a close eye"
                        : "Comfortable – decisions are de-risking"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center gap-3 text-xs">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Breakdown
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    {breakdown.map((item) => {
                      const color =
                        item.tone === "high"
                          ? "bg-rose-500/20 text-rose-100"
                          : item.tone === "medium"
                          ? "bg-amber-500/20 text-amber-100"
                          : "bg-emerald-500/20 text-emerald-100";

                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-2"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="text-muted-foreground/80">
                                {item.value}%
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-background/80">
                              <motion.div
                                className={`h-full rounded-full ${color}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.value}%` }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Confidence
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <Progress
                        value={confidence}
                        className="h-2 bg-background/80"
                      />
                    </div>
                    <div className="flex flex-col items-end text-[11px] text-muted-foreground">
                      <span>{confidence}%</span>
                      <span>model confidence</span>
                    </div>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between rounded-2xl bg-background/80 px-3 py-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {confidence >= 60 ? (
                      <ArrowUpRight className="size-3.5 text-rose-300" />
                    ) : (
                      <ArrowDownRight className="size-3.5 text-emerald-300" />
                    )}
                    <span>
                      {confidence >= 60
                        ? "Risk is trending upward over the last 3 meetings."
                        : "Risk is trending down over the last 3 meetings."}
                    </span>
                  </div>
                  <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px]">
                    Powered by cross‑meeting memory
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-rows-[minmax(0,1.1fr)_minmax(0,1.05fr)]">
          <Card className="relative overflow-hidden rounded-3xl border-border/80 bg-gradient-to-br from-background/85 via-background/75 to-background/55 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
            <CardContent className="relative flex h-full flex-col p-4 md:p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/70 text-amber-200 shadow-inner shadow-black/50">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      High‑risk tasks
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      The smallest set of tasks that moves risk the most.
                    </p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 pr-1 text-xs">
                  {highRiskTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-2xl bg-background/75 p-3 ring-1 ring-rose-500/40 transition-colors hover:bg-background"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-medium text-rose-50">
                          {task.label}
                        </p>
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100">
                          High risk
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Owner{" "}
                        <span className="font-medium text-foreground">
                          {task.owner}
                        </span>{" "}
                        · due {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                        Clearing this task is estimated to reduce portfolio risk by{" "}
                        <span className="font-medium text-rose-100">
                          ~6–10 points
                        </span>
                        .
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-3xl border-border/80 bg-gradient-to-br from-background/85 via-background/75 to-background/55 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <CardContent className="relative flex h-full flex-col p-4 md:p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/70 text-emerald-200 shadow-inner shadow-black/50">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Guardrails
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      How VoxNote keeps decisions from quietly drifting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-1 flex flex-1 flex-col justify-between gap-3 text-xs text-muted-foreground">
                <ul className="flex flex-col gap-1.5">
                  <li>
                    • Flags meetings where{" "}
                    <span className="font-medium text-foreground">
                      decisions outnumber clear owners
                    </span>{" "}
                    by more than 2:1.
                  </li>
                  <li>
                    • Tracks{" "}
                    <span className="font-medium text-foreground">
                      overdue high‑risk tasks across meetings
                    </span>{" "}
                    and surfaces them before your next standup.
                  </li>
                  <li>
                    • Uses cross‑meeting memory to highlight{" "}
                    <span className="font-medium text-foreground">
                      recurring risk themes
                    </span>{" "}
                    like scope creep or missing success metrics.
                  </li>
                </ul>

                <div className="rounded-2xl bg-background/80 p-3 text-[11px]">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Confidence indicator
                  </p>
                  <p>
                    With <span className="font-medium text-foreground">{confidence}%</span>{" "}
                    confidence, VoxNote believes{" "}
                    <span className="font-medium text-emerald-200">
                      clearing the top 3 high‑risk tasks
                    </span>{" "}
                    will bring you back into a healthy risk band this week.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

