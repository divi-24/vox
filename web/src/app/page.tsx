"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Share2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex h-full flex-col gap-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)] items-center"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Meetings in. Clear decisions out.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              VoxNote turns talking into a simple stream of decisions, owners and
              deadlines. No more digging through transcripts or guessing what you agreed
              on.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_14px_40px_rgba(59,130,246,0.6)] hover:bg-primary/90"
            >
              <Link href="/dashboard">
                <span>Open dashboard demo</span>
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
                Watch live meeting simulation
              </Link>
            </Button>
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
                  label="Listen"
                  body="We capture the conversation with a transcript that stays in the background."
                />
                <Pill
                  icon={Share2}
                  label="Understand"
                  body="VoxNote pulls out decisions, action items, owners and dates automatically."
                />
                <Pill
                  icon={ShieldAlert}
                  label="Stay on track"
                  body="Your dashboard and decision graph stay up to date so risk is always visible."
                />
              </div>

              <SimpleCompare />
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
          title="Never lose a decision"
          body="See a single list of what was decided, who owns it and when it is due."
        />
        <ValueCard
          title="One place for follow‑ups"
          body="Jump from a meeting to its decisions, tasks, risk score and history in one click."
        />
        <ValueCard
          title="Demo‑friendly"
          body="This sandbox runs on mock data only, so you can click around freely."
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

function SimpleCompare() {
  return (
    <div className="mt-2 grid gap-2 rounded-2xl bg-background/70 p-3 text-[11px] text-muted-foreground ring-1 ring-border/70 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Without VoxNote
        </p>
        <ul className="ml-3 list-disc space-y-0.5">
          <li>Transcripts no one reads.</li>
          <li>Decisions scattered across docs and chats.</li>
          <li>Risk only surfaces when something slips.</li>
        </ul>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          With VoxNote
        </p>
        <ul className="ml-3 list-disc space-y-0.5">
          <li>Clean minutes appear while people talk.</li>
          <li>Dashboard and graph stay in sync automatically.</li>
          <li>You always know which decisions feel risky.</li>
        </ul>
      </div>
    </div>
  );
}


