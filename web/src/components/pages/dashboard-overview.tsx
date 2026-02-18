"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  AlertTriangle,
  Activity,
  Clock8,
  CalendarClock,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiskSummary, useOverdueTasks, useMeetings, useTasks } from "@/lib/hooks";

type DashboardStats = {
  totalMeetings: number;
  activeTasks: number;
  overdueTasks: number;
  averageRisk: number;
  decisionDensityChange: number;
  sentimentTrend: "up" | "down";
};

const DECISION_DENSITY_SERIES = [
  { label: "Mon", value: 2.4 },
  { label: "Tue", value: 3.1 },
  { label: "Wed", value: 2.8 },
  { label: "Thu", value: 3.7 },
  { label: "Fri", value: 4.2 },
  { label: "Sat", value: 2.1 },
  { label: "Sun", value: 1.9 },
];

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      delay: 0.04 * index,
      ease: [0.22, 0.61, 0.36, 1],
    },
  }),
};

export function DashboardOverview() {
  const { data: riskData, loading: riskLoading } = useRiskSummary();
  const { data: overdueTasks, loading: overdueLoading } = useOverdueTasks();
  const { data: meetings, loading: meetingsLoading } = useMeetings();
  const { data: allTasks, loading: tasksLoading } = useTasks();

  const isLoading = riskLoading || overdueLoading || meetingsLoading || tasksLoading;

  const stats: DashboardStats = {
    totalMeetings: meetings.length,
    activeTasks: allTasks.filter((t) => t.status === "in_progress").length,
    overdueTasks: overdueTasks.length,
    averageRisk: riskData?.average_risk_score ?? 0,
    decisionDensityChange: 18,
    sentimentTrend: "up",
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <motion.section
        className="grid gap-3 md:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.03,
            },
          },
        }}
      >
        <StatCard
          index={0}
          label="Total meetings"
          value={stats.totalMeetings.toLocaleString()}
          helper="+6 vs. last week"
          icon={CalendarClock}
        />
        <StatCard
          index={1}
          label="Active tasks"
          value={stats.activeTasks.toString()}
          helper="42 delegated • 26 owned"
          icon={Activity}
        />
        <StatCard
          index={2}
          label="Overdue tasks"
          value={stats.overdueTasks.toString()}
          helper="Requires attention today"
          icon={AlertTriangle}
          tone="destructive"
        />
        <StatCard
          index={3}
          label="Average risk score"
          value={`${stats.averageRisk}`}
          helper="Portfolio risk across all meetings"
          icon={Clock8}
        />
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <Card
            className="relative h-full overflow-hidden rounded-3xl border-border/70 bg-gradient-to-br from-background/80 via-background/70 to-background/40 shadow-[0_18px_45px_rgba(0,0,0,0.65)]"
            data-slot="glass"
          >
            <div className="pointer-events-none absolute -left-10 -top-24 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-12 top-12 h-40 w-40 rounded-full bg-purple-500/25 blur-3xl" />
            <CardContent className="relative flex flex-col gap-4 p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">
                    Decision density
                  </p>
                  <p className="text-sm text-muted-foreground">
                    How many real decisions come out of your meetings.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/30 bg-primary/10 text-[11px] text-primary"
                >
                  +{stats.decisionDensityChange}% vs. last 30 days
                </Badge>
              </div>

              <div className="mt-1 flex flex-col gap-4">
                <MiniTimelineSkeleton />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.04 }}
          className="relative"
        >
          <Card className="relative h-full overflow-hidden rounded-3xl border-border/70 bg-gradient-to-br from-background/80 via-background/60 to-background/40 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
            <div className="pointer-events-none absolute inset-y-8 -right-16 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <CardContent className="relative flex flex-col gap-4 p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/90">
                    Sentiment
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Emotional tone across your last 10 meetings.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-500/50 bg-emerald-500/10 text-[11px] text-emerald-200"
                >
                  {stats.sentimentTrend === "up" ? "Trending positive" : "Trending down"}
                </Badge>
              </div>

              <div className="mt-1 flex items-end justify-between gap-3">
                <div className="flex flex-1 items-end gap-1.5">
                  {/** Use deterministic heights to avoid hydration mismatches */}
                  {["52%", "68%", "61%", "74%", "80%", "65%", "58%", "70%", "62%", "55%"].map(
                    (height, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height }}
                        transition={{
                          duration: 0.4,
                          delay: 0.15 + index * 0.04,
                          ease: "easeOut",
                        }}
                        className="flex-1 rounded-full bg-gradient-to-t from-emerald-500/20 via-emerald-400/50 to-emerald-300"
                      />
                    ),
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <p className="text-sm font-medium text-emerald-200">Stable-positive</p>
                  <p className="text-xs text-muted-foreground">
                    Fewer frustrated moments, more aligned decisions.
                  </p>
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Healthy debate
                </span>
                <span className="inline-flex items-center gap-1">
                  <ArrowUpRight className="size-3" />
                  Sentiment normalized per attendee
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}

type StatCardProps = {
  index: number;
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "destructive";
};

function StatCard({
  index,
  label,
  value,
  helper,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  const isDestructive = tone === "destructive";

  return (
    <motion.div
      custom={index}
      variants={CARD_VARIANTS}
      className="relative"
    >
      <Card
        className={[
          "relative overflow-hidden rounded-3xl border-border/70 bg-gradient-to-br shadow-[0_18px_45px_rgba(0,0,0,0.65)]",
          isDestructive
            ? "from-rose-950/80 via-rose-950/60 to-rose-900/50"
            : "from-background/85 via-background/75 to-background/60",
        ].join(" ")}
      >
        <CardContent className="relative flex flex-col gap-3 p-4 md:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-background/60 text-muted-foreground shadow-inner shadow-black/40",
                  isDestructive && "border-rose-500/40 bg-rose-950/40 text-rose-100",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {label}
              </span>
            </div>
            {isDestructive ? (
              <Badge className="rounded-full bg-rose-500/20 text-[11px] text-rose-100">
                Needs attention
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-full border-border/70 bg-background/40 text-[11px] text-muted-foreground"
              >
                Last 30 days
              </Badge>
            )}
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {value}
                {label.toLowerCase().includes("risk") && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    /100
                  </span>
                )}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">{helper}</span>
            </div>
            <div className="flex h-9 items-center gap-1 rounded-full bg-background/40 px-2 text-[11px] text-muted-foreground shadow-inner shadow-black/40">
              <ArrowUpRight className="size-3.5 text-primary" />
              <span>View drill-down</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MiniTimelineSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Decisions per meeting</span>
        <span>Last 10 sessions</span>
      </div>
      <CardChart />
    </div>
  );
}

function CardChart() {
  return (
    <div className="relative h-32 overflow-hidden rounded-2xl border border-border/60 bg-background/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(88,28,135,0.45),_transparent_60%)] opacity-70" />
      <div className="relative h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DECISION_DENSITY_SERIES}>
            <defs>
              <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(56,189,248)" stopOpacity={0.9} />
                <stop offset="50%" stopColor="rgb(129,140,248)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(15,23,42)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 10 }}
            />
            <RechartsTooltip
              cursor={{ stroke: "rgba(148,163,184,0.3)", strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.98)",
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.5)",
                padding: "6px 8px",
                fontSize: 11,
              }}
              labelStyle={{ color: "rgba(148,163,184,0.9)" }}
              formatter={(v: number) => [`${v.toFixed(1)} decisions`, "Density"] as const}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="rgba(129,140,248,1)"
              strokeWidth={2}
              fill="url(#densityGradient)"
              isAnimationActive
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

