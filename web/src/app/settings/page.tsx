"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sliders, Sparkles, Shield } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [autoStart, setAutoStart] = useState(true);
  const [autoHighlight, setAutoHighlight] = useState(true);
  const [keyboardHints, setKeyboardHints] = useState(true);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Settings
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Tune how VoxNote behaves in live meetings and dashboards. All changes are
            local to this demo.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.05fr)]">
        <Card className="relative overflow-hidden rounded-3xl border-border/80 bg-gradient-to-br from-background/85 via-background/75 to-background/55 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
          <CardContent className="relative flex flex-col gap-4 p-4 md:p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/70 text-primary shadow-inner shadow-black/50">
                <Sliders className="size-4" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Meeting defaults
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Configure how live meetings behave by default.
                </p>
              </div>
            </div>

            <div className="mt-1 grid gap-4 md:grid-cols-2">
              <ToggleRow
                id="auto-start"
                label="Auto‑start transcript"
                description="Begin listening as soon as you open the Live Meeting view."
                checked={autoStart}
                onCheckedChange={setAutoStart}
              />
              <ToggleRow
                id="auto-highlight"
                label="Highlight overdue work"
                description="Automatically spotlight overdue tasks in live meetings."
                checked={autoHighlight}
                onCheckedChange={setAutoHighlight}
              />
              <ToggleRow
                id="keyboard-hints"
                label="Keyboard hints"
                description="Show subtle keyboard navigation hints in the UI."
                checked={keyboardHints}
                onCheckedChange={setKeyboardHints}
              />
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="standup-time"
                  className="text-xs text-muted-foreground"
                >
                  Default standup time
                </Label>
                <Input
                  id="standup-time"
                  type="time"
                  defaultValue="09:30"
                  className="h-8 rounded-xl border-border/70 bg-background/80 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Used to determine when to surface risk digests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-3xl border-border/80 bg-gradient-to-br from-background/85 via-background/75 to-background/55 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />
          <CardContent className="relative flex h-full flex-col gap-4 p-4 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/70 text-emerald-200 shadow-inner shadow-black/50">
                  <Shield className="size-4" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Privacy
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    This demo runs entirely in your browser.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-3 text-xs text-muted-foreground">
              <p>
                VoxNote 2.0 is designed so that raw meeting audio and transcripts never
                leave your control without your consent. In this demo, all data is{" "}
                <span className="font-medium text-foreground">
                  mock JSON rendered locally
                </span>
                .
              </p>
              <div className="rounded-2xl bg-background/80 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="size-3" />
                  Simulated intelligence
                </p>
                <p>
                  The intelligence you see — summaries, risk projections, cross‑meeting
                  memory — is powered by curated mock data. It&apos;s{" "}
                  <span className="font-medium text-foreground">
                    exactly what a real deployment would feel like
                  </span>{" "}
                  during a live demo.
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-background/80 p-3 text-[11px]"
              >
                <p>
                  Want to wire this up to a real backend later? Swap the mock data module
                  for your API layer and keep the same UI surfaces.
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-background/80 p-3 ring-1 ring-border/70">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id} className="text-xs text-foreground">
          {label}
        </Label>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
      />
    </div>
  );
}

