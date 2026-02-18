"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TasksList } from "@/components/tasks-list";
import { DecisionsList } from "@/components/decisions-list";
import { MeetingsView } from "@/components/meetings-view";

export default function HistoryPage() {
  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Meeting History & Intelligence
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Upload, track, and analyze all your meetings in one place. Every decision and task is automatically extracted and monitored.
        </p>
      </div>

      <MeetingsView />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <DecisionsList />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
