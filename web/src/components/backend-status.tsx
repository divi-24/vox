"use client";

import { useHealthCheck } from "@/lib/hooks";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function BackendStatus() {
  const { isHealthy, error } = useHealthCheck();

  if (isHealthy) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">Backend connection issue</p>
        {error && <p className="text-xs opacity-75">{error}</p>}
      </div>
    </div>
  );
}
