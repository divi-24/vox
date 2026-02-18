"use client";

import { useState } from "react";
import { useTasks } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";

interface TasksListProps {
  status?: string;
  risk_level?: string;
}

export function TasksList({ status, risk_level }: TasksListProps) {
  const { data: tasks, loading, error } = useTasks({ status, risk_level });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium">Failed to load tasks</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Circle className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No tasks found</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level: string | null) => {
    switch (level) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "High":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Circle className="h-5 w-5 text-blue-600" />;
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
          className="cursor-pointer rounded-lg border border-border/70 bg-background/50 p-4 hover:bg-background/80 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="pt-1">{getStatusIcon(task.status)}</div>

            <div className="flex-1 min-w-0">
              <p className="font-medium line-clamp-2">{task.task_description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {task.assignee && (
                  <Badge variant="outline" className="text-xs">
                    👤 {task.assignee}
                  </Badge>
                )}
                {task.deadline && (
                  <Badge variant="outline" className="text-xs">
                    📅 {new Date(task.deadline).toLocaleDateString()}
                  </Badge>
                )}
                <Badge className={`text-xs ${getRiskColor(task.risk_level)}`}>
                  {task.risk_level || "Unknown"} Risk
                </Badge>
              </div>
            </div>

            <div className="text-right pt-1">
              <p className="text-sm font-semibold text-muted-foreground">
                {task.risk_score ? `${Math.round(task.risk_score)}` : "-"}
              </p>
              <p className="text-xs text-muted-foreground">risk score</p>
            </div>
          </div>

          {expandedId === task.id && (
            <div className="mt-4 border-t pt-4 space-y-2 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Details</p>
                <p>Status: <span className="capitalize">{task.status}</span></p>
                <p>Confidence: {(task.confidence_score * 100).toFixed(0)}%</p>
                {task.deadline && (
                  <p>Deadline: {new Date(task.deadline).toLocaleString()}</p>
                )}
                <p>Created: {new Date(task.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
