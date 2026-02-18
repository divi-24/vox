"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Share2,
  CalendarClock,
  User,
  AlertTriangle,
  ChevronRight,
  Clock,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMeetings, useTasks, useDecisions } from "@/lib/hooks";
import type { ApiMeeting, ApiTask, ApiDecision } from "@/lib/api-client";

type GraphNodeData = {
  kind: "meeting" | "decision" | "task" | "person" | "deadline";
  label: string;
  meta?: string;
  risk?: number;
  overdue?: boolean;
};

type SelectedNode = {
  id: string;
  data: GraphNodeData;
};

export default function DecisionGraphPage() {
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const { data: meetings } = useMeetings();
  const { data: tasks } = useTasks();
  const { data: decisions } = useDecisions();

  const { nodes, edges } = useMemo(() => buildGraph(meetings, tasks, decisions), [meetings, tasks, decisions]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Decision graph
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Every meeting, decision, task, person, and deadline — stitched into a single,
            explorable map of accountability.
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2 md:mt-0">
          <Badge
            variant="outline"
            className="rounded-full border-primary/40 bg-primary/10 text-[11px] text-primary"
          >
            {decisions?.length || 0} decisions · {tasks?.filter(t => t.status === 'overdue').length || 0}{" "}
            overdue tasks
          </Badge>
        </div>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.05fr)]">
        <Card className="relative overflow-hidden rounded-3xl border-border/80 bg-gradient-to-br from-background/85 via-background/70 to-background/55 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
          <div className="pointer-events-none absolute -left-20 -top-28 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-52 w-52 rounded-full bg-purple-500/20 blur-3xl" />

          <CardContent className="relative flex h-[520px] flex-col p-3 md:p-4 lg:h-[560px]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/70 text-primary shadow-inner shadow-black/50">
                  <Share2 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Graph explorer
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Zoom, pan and click nodes to inspect context.
                  </p>
                </div>
              </div>
              <div className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5">
                  ⌘ + scroll to zoom
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5">
                  drag to pan
                </span>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-2xl border border-border/80 bg-background/70">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="h-full w-full"
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  fitView
                  fitViewOptions={{ padding: 0.3 }}
                  onNodeClick={(_, node) => {
                    const data = node.data as GraphNodeData;
                    setSelected({ id: node.id, data });
                  }}
                  proOptions={{ hideAttribution: true }}
                  panOnScroll
                  selectionOnDrag={false}
                  minZoom={0.4}
                  maxZoom={1.8}
                  className="!bg-background/90"
                >
                  <Background
                    gap={32}
                    size={1}
                    color="rgba(148,163,184,0.25)"
                  />
                  <MiniMap
                    nodeColor={(node) => {
                      const data = node.data as GraphNodeData;
                      switch (data.kind) {
                        case "meeting":
                          return "#38bdf8";
                        case "decision":
                          return "#a855f7";
                        case "task":
                          return data.overdue ? "#f97373" : "#22c55e";
                        case "person":
                          return "#eab308";
                        case "deadline":
                          return "#fb7185";
                        default:
                          return "#64748b";
                      }
                    }}
                    pannable
                    zoomable
                    className="!bg-background/80 !shadow-lg !shadow-black/60"
                  />
                  <Controls className="!bg-background/90 !shadow-md !shadow-black/60" />
                </ReactFlow>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <DetailPanel selected={selected} />
        </motion.div>
      </div>
    </div>
  );
}

function buildGraph(
  meetings: ApiMeeting[],
  tasks: ApiTask[],
  decisions: ApiDecision[]
): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const meeting = meetings[0];
  if (!meeting) {
    return { nodes: [], edges: [] };
  }
  const meetingDecisions = decisions.filter((d) => d.meeting_id === meeting.id);
  const actions = tasks.filter((t) => t.meeting_id === meeting.id);

  const nodes: Node<GraphNodeData>[] = [];
  const edges: Edge[] = [];

  const meetingId = `meeting-${meeting.id}`;
  nodes.push({
    id: meetingId,
    position: { x: 0, y: 0 },
    data: {
      kind: "meeting",
      label: meeting.title,
      meta: `${meeting.source_type || "meeting"} · ${meeting.created_at ? new Date(meeting.created_at).toLocaleDateString() : ""}`,
      risk: 0,
    },
    style: {
      borderRadius: 18,
      padding: 10,
      border: "1px solid rgba(56,189,248,0.6)",
      background:
        "radial-gradient(circle at top, rgba(56,189,248,0.25), rgba(15,23,42,0.96))",
      boxShadow: "0 20px 40px rgba(8,47,73,0.85)",
      color: "white",
      fontSize: 11,
    },
  });

  meetingDecisions.slice(0, 3).forEach((decision, index) => {
    const decisionId = `decision-${decision.id}`;
    nodes.push({
      id: decisionId,
      position: { x: -180 + index * 180, y: 140 },
      data: {
        kind: "decision",
        label: decision.decision_statement.substring(0, 40) + (decision.decision_statement.length > 40 ? "..." : ""),
        meta: `Confidence ${(decision.confidence_score * 100).toFixed(0)}%`,
        risk: 0,
      },
      style: {
        borderRadius: 18,
        padding: 9,
        border: "1px solid rgba(168,85,247,0.6)",
        background:
          "radial-gradient(circle at top, rgba(168,85,247,0.45), rgba(15,23,42,0.96))",
        boxShadow: "0 16px 32px rgba(76,29,149,0.8)",
        color: "white",
        fontSize: 10,
      },
    });

    edges.push({
      id: `e-${meetingId}-${decisionId}`,
      source: meetingId,
      target: decisionId,
      animated: true,
      style: {
        stroke: "rgba(96,165,250,0.9)",
        strokeWidth: 1.6,
      },
    });
  });

  // Attach tasks, people and deadlines once, using the first decision as a parent.
  const parentDecision = meetingDecisions[0];
  const parentDecisionId = parentDecision ? `decision-${parentDecision.id}` : undefined;

  const totalActions = actions.length || 1;

  actions.slice(0, 5).forEach((action, actionIndex) => {
    // Center tasks horizontally under the first decision and spread them out
    const horizontalOffset = (actionIndex - (Math.min(totalActions, 5) - 1) / 2) * 260;
    const taskId = `task-${action.id}`;
    const overdue =
      action.risk_level === "High" && action.deadline && new Date(action.deadline) < new Date();

    nodes.push({
      id: taskId,
      position: {
        x: horizontalOffset,
        y: 260 + (overdue ? 24 : 0),
      },
      data: {
        kind: "task",
        label: action.task_description.substring(0, 35) + (action.task_description.length > 35 ? "..." : ""),
        meta: `${action.assignee || "Unassigned"}`,
        overdue,
        risk: action.risk_score || (action.risk_level === "High" ? 78 : action.risk_level === "Medium" ? 55 : 24),
      },
      style: {
        borderRadius: 18,
        padding: 8,
        border: overdue
          ? "1px solid rgba(248,113,113,0.9)"
          : "1px solid rgba(34,197,94,0.7)",
        background: overdue
          ? "radial-gradient(circle at top, rgba(248,113,113,0.35), rgba(15,23,42,0.98))"
          : "radial-gradient(circle at top, rgba(34,197,94,0.3), rgba(15,23,42,0.96))",
        boxShadow: overdue
          ? "0 16px 30px rgba(127,29,29,0.9)"
          : "0 16px 30px rgba(22,101,52,0.9)",
        color: "white",
        fontSize: 10,
      },
    });

    if (parentDecisionId) {
      edges.push({
        id: `e-${parentDecisionId}-${taskId}`,
        source: parentDecisionId,
        target: taskId,
        animated: true,
        style: {
          stroke: overdue
            ? "rgba(248,113,113,0.95)"
            : "rgba(52,211,153,0.9)",
          strokeWidth: overdue ? 2 : 1.4,
        },
      });
    }

    if (action.assignee) {
      const personId = `person-${action.assignee}`;
      if (!nodes.find((n) => n.id === personId)) {
        nodes.push({
          id: personId,
          position: { x: horizontalOffset - 140, y: 400 },
          data: {
            kind: "person",
            label: action.assignee,
            meta: "Owner",
          },
          style: {
            borderRadius: 999,
            padding: 6,
            border: "1px solid rgba(234,179,8,0.8)",
            background:
              "radial-gradient(circle at top, rgba(234,179,8,0.4), rgba(15,23,42,0.96))",
            boxShadow: "0 16px 30px rgba(133,77,14,0.9)",
            color: "white",
            fontSize: 10,
          },
        });
      }

      edges.push({
        id: `e-${taskId}-${personId}`,
        source: taskId,
        target: personId,
        animated: true,
        style: {
          stroke: "rgba(234,179,8,0.9)",
          strokeDasharray: "4 3",
          strokeWidth: 1.4,
        },
      });
    }

    if (action.deadline) {
      const deadlineId = `deadline-${action.id}`;
      nodes.push({
        id: deadlineId,
        position: { x: horizontalOffset + 170, y: 430 },
        data: {
          kind: "deadline",
          label: new Date(action.deadline).toLocaleDateString(),
          meta: "Due date",
          overdue,
        },
        style: {
          borderRadius: 18,
          padding: 6,
          border: "1px solid rgba(251,113,133,0.8)",
          background:
            "radial-gradient(circle at top, rgba(251,113,133,0.5), rgba(15,23,42,0.98))",
          boxShadow: "0 16px 30px rgba(159,18,57,0.95)",
          color: "white",
          fontSize: 10,
        },
      });

      edges.push({
        id: `e-${taskId}-${deadlineId}`,
        source: taskId,
        target: deadlineId,
        animated: true,
        style: {
          stroke: "rgba(248,113,113,0.95)",
          strokeWidth: 1.6,
        },
      });
    }
  });

  return { nodes, edges };
}

function DetailPanel({ selected }: { selected: SelectedNode | null }) {
  const headerIcon =
    selected?.data.kind === "meeting"
      ? CalendarClock
      : selected?.data.kind === "decision"
      ? Share2
      : selected?.data.kind === "task"
      ? AlertTriangle
      : selected?.data.kind === "person"
      ? User
      : Clock;

  const HeaderIcon = headerIcon;

  return (
    <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl border-border/80 bg-gradient-to-br from-background/85 via-background/75 to-background/55 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
      <div className="pointer-events-none absolute -right-20 -top-28 h-52 w-52 rounded-full bg-emerald-500/20 blur-3xl" />

      <CardContent className="relative flex flex-1 flex-col p-4 md:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/70 text-primary shadow-inner shadow-black/50">
              <HeaderIcon className="size-4" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {selected
                  ? labelForKind(selected.data.kind)
                  : "Graph insight"}
              </p>
              <p className="text-xs text-muted-foreground/80">
                {selected
                  ? "Live context for the node you selected."
                  : "Click any node in the graph to inspect its context."}
              </p>
            </div>
          </div>
        </div>

        <Separator className="mb-3 border-border/70" />

        {selected ? (
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3 pr-1 text-xs">
              <div className="rounded-2xl bg-background/70 p-3 ring-1 ring-border/70">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Node
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {selected.data.label}
                </p>
                {selected.data.meta && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {selected.data.meta}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-background/70 text-[10px] text-muted-foreground"
                  >
                    {labelForKind(selected.data.kind)}
                  </Badge>

                  {selected.data.kind === "task" && selected.data.overdue && (
                    <Badge className="rounded-full bg-rose-500/20 text-[10px] text-rose-100">
                      Overdue · escalated
                    </Badge>
                  )}

                  {typeof selected.data.risk === "number" && (
                    <Badge
                      className={[
                        "rounded-full text-[10px]",
                        selected.data.risk >= 70
                          ? "bg-rose-500/25 text-rose-100"
                          : selected.data.risk >= 40
                          ? "bg-amber-500/20 text-amber-100"
                          : "bg-emerald-500/20 text-emerald-100",
                      ].join(" ")}
                    >
                      Risk {selected.data.risk}/100
                    </Badge>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-background/70 p-3 ring-1 ring-border/70">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  How this node fits
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  {explanationForNode(selected)}
                </p>
              </div>

              <div className="rounded-2xl bg-background/70 p-3 ring-1 ring-border/70">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Next best move
                </p>
                <div className="mt-1 flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                  {recommendationsForNode(selected).map((line) => (
                    <p key={line} className="flex items-start gap-1.5">
                      <ChevronRight className="mt-0.5 size-3 text-muted-foreground/80" />
                      <span>{line}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-1 flex-col items-start justify-center gap-2 text-xs text-muted-foreground">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Start exploring
            </p>
            <p>
              Click a{" "}
              <span className="font-medium text-sky-300">meeting</span>,{" "}
              <span className="font-medium text-purple-300">decision</span>, or{" "}
              <span className="font-medium text-emerald-300">task</span> node in the graph
              to see how it connects to people and deadlines.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function labelForKind(kind: GraphNodeData["kind"]): string {
  switch (kind) {
    case "meeting":
      return "Meeting";
    case "decision":
      return "Decision";
    case "task":
      return "Task";
    case "person":
      return "Person";
    case "deadline":
      return "Deadline";
  }
}

function explanationForNode(node: SelectedNode): string {
  const { kind, label } = node.data;
  switch (kind) {
    case "meeting":
      return `${label} is the root of this graph. Every downstream decision, task and deadline ultimately traces back to this conversation.`;
    case "decision":
      return `${label} is a committed call coming out of this meeting. Tasks and owners downstream should always mirror this decision narrative.`;
    case "task":
      return `${label} is how the decision shows up in execution. If it slips, the risk of the parent decision climbs quickly.`;
    case "person":
      return `${label} owns one or more tasks connected to this meeting. Their load and follow-through materially affect your effective risk.`;
    case "deadline":
      return `${label} is the boundary for this work. Crossing it without renegotiating the decision is where silent risk tends to spike.`;
  }
}

function recommendationsForNode(node: SelectedNode): string[] {
  const { kind, overdue, risk } = node.data;

  if (kind === "task" && overdue) {
    return [
      "Renegotiate the parent decision or re-commit to an updated delivery date.",
      "Confirm that the owner has capacity — this is likely blocking other work.",
      "Communicate the impact of this slip to any dependent teams before your next standup.",
    ];
  }

  if (kind === "decision" && typeof risk === "number" && risk >= 70) {
    return [
      "Clarify the success metric in the next meeting so owners know what \"good\" looks like.",
      "Reduce scope slightly to create a lower-risk first win.",
      "Pair a senior owner with the current lead for the first week of execution.",
    ];
  }

  if (kind === "meeting") {
    return [
      "Scan the graph for red overdue nodes — clean those up before scheduling a new decision-heavy meeting.",
      "Check that each major decision has at least one task and a clearly assigned owner.",
      "Use this map to open your next retrospective and align on where risk actually lives.",
    ];
  }

  if (kind === "person") {
    return [
      "Confirm that this owner is not carrying a disproportionate number of high-risk tasks.",
      "Ask if any of their commitments should be delegated or sequenced differently.",
      "Highlight their critical path tasks at the start of your next weekly sync.",
    ];
  }

  return [
    "Ensure the upstream decision is still correct given current information.",
    "If the risk feels high, convert this into a smaller, time-boxed experiment.",
    "Capture what you'll learn by hitting — or missing — this node's outcome.",
  ];
}

