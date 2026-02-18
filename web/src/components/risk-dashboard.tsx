"use client";

import { useRiskSummary, useOverdueTasks } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function RiskDashboard() {
  const { data: riskData, loading: riskLoading, error: riskError } = useRiskSummary();
  const { data: overdueTasks, loading: overdueLoading } = useOverdueTasks();

  if (riskLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (riskError) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium">Failed to load risk data</p>
            <p className="text-sm text-muted-foreground">{riskError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!riskData) {
    return null;
  }

  const getRiskColor = (count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    if (percentage > 30) return "text-red-600 dark:text-red-400";
    if (percentage > 15) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{riskData.total_tasks}</div>
            <p className="text-xs text-muted-foreground mt-1">tracked tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getRiskColor(riskData.critical_count, riskData.total_tasks)}`}>
              {riskData.critical_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {riskData.risk_breakdown_percentage.critical}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getRiskColor(riskData.high_count, riskData.total_tasks)}`}>
              {riskData.high_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {riskData.risk_breakdown_percentage.high}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{riskData.average_risk_score.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Critical", count: riskData.critical_count, color: "bg-red-500" },
                { label: "High", count: riskData.high_count, color: "bg-yellow-500" },
                { label: "Medium", count: riskData.medium_count, color: "bg-orange-500" },
                { label: "Low", count: riskData.low_count, color: "bg-green-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : overdueTasks.length > 0 ? (
              <div className="space-y-2">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-between justify-between border-b pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{task.task_description}</p>
                      <p className="text-xs text-muted-foreground">{task.assignee || "Unassigned"}</p>
                    </div>
                    <span className="ml-2 rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900 dark:text-red-200">
                      {task.risk_level || "Unknown"}
                    </span>
                  </div>
                ))}
                {overdueTasks.length > 5 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    +{overdueTasks.length - 5} more overdue tasks
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No overdue tasks</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
