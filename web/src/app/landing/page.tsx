"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Share2, ShieldAlert, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex h-full flex-col gap-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)]"
      >
        <div className="flex flex-col gap-5">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] text-primary shadow-sm shadow-primary/40">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Decision intelligence for the way you actually talk.
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Turn messy meetings into a living decision system.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              VoxNote listens to the conversation, captures what was really decided, and
              keeps risk visible long after the call ends. No more guessing what you
              actually committed to.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_14px_40px_rgba(59,130,246,0.6)] hover:bg-primary/90"
            >
              <Link href="/dashboard">
                <span>Open live dashboard</span>
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-border/70 bg-background/70 text-sm text-muted-foreground hover:bg-background"
            >
              <Link href="/live">
                <Mic className="mr-2 size-4" />
                Watch a simulated meeting
              </Link>
            </Button>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="size-3 text-primary" />
              Seed‑ready UI · mock data only · no backend
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, x: 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative"
        >
          <Card className="relative h-full overflow-hidden rounded-3xl border-border/70 bg-gradient-to-br from-background/90 via-background/70 to-background/40 shadow-[0_22px_60px_rgba(0,0,0,0.85)]">
            <div className="pointer-events-none absolute -left-16 -top-24 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-purple-500/30 blur-3xl" />

            <CardContent className="relative flex h-full flex-col gap-4 p-4 md:p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                How VoxNote works
              </p>

              <div className="grid gap-3 md:grid-cols-3">
                <Pill
                  icon={Mic}
                  label="Hear the room"
                  body="Live transcription tuned for messy, interrupt‑driven conversations."
                />
                <Pill
                  icon={Share2}
                  label="Model the decision"
                  body="We identify decisions, owners, and deadlines — not just bullets."
                />
                <Pill
                  icon={ShieldAlert}
                  label="Track the risk"
                  body="A living graph shows where risk accumulates across meetings."
                />
              </div>

              <div className="mt-2 flex flex-col gap-2 rounded-2xl bg-background/70 p-3 text-xs text-muted-foreground ring-1 ring-border/70">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Different from "just notes"
                </p>
                <ul className="flex list-disc flex-col gap-1 pl-4">
                  <li>
                    Traditional tools capture sentences. VoxNote captures{" "}
                    <span className="font-medium text-foreground">
                      decisions, tasks, and risk
                    </span>
                    .
                  </li>
                  <li>
                    Instead of static docs, you get a{" "}
                    <span className="font-medium text-foreground">
                      cross‑meeting memory
                    </span>{" "}
                    that knows when work drifts.
                  </li>
                  <li>
                    Every meeting quietly updates the{" "}
                    <span className="font-medium text-foreground">decision graph</span> and{" "}
                    <span className="font-medium text-foreground">risk analytics</span>{" "}
                    you saw in the demo dashboard.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <ValueCard
          title="Always‑on memory"
          body="VoxNote threads decisions across recurring meetings so nothing critical gets lost between standups."
        />
        <ValueCard
          title="Decision‑first analytics"
          body="Dashboards are built from actual commitments, not meeting length or vague sentiment."
        />
        <ValueCard
          title="Built to plug in"
          body="This demo runs entirely on mock data — but the surfaces are ready for your real backend."
        />
      </motion.section>
    </div>
  );
}

type PillProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  body: string;
};

function Pill({ icon: Icon, label, body }: PillProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-background/70 p-3 text-xs text-muted-foreground ring-1 ring-border/70">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="size-3.5" />
        </span>
        <span className="text-[12px] font-medium text-foreground">{label}</span>
      </div>
      <p>{body}</p>
    </div>
  );
}

type ValueCardProps = {
  title: string;
  body: string;
};

function ValueCard({ title, body }: ValueCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-gradient-to-br from-background/85 via-background/70 to-background/55 shadow-[0_16px_40px_rgba(0,0,0,0.8)]">
      <CardContent className="relative flex h-full flex-col gap-2 p-4">
        <p className="text-[12px] font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

