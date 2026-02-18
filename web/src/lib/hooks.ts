import { useState, useEffect, useCallback } from "react";
import { apiClient, ApiTask, ApiDecision, RiskSummary, ApiMeeting } from "./api-client";

export function useRiskSummary() {
  const [data, setData] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient.getRiskSummary();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch risk summary");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: () => apiClient.getRiskSummary().then(setData) };
}

export function useTasks(filters?: {
  status?: string;
  assignee?: string;
  risk_level?: string;
}) {
  const [data, setData] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient.listTasks(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters?.status, filters?.assignee, filters?.risk_level]);

  const updateTask = useCallback(
    async (taskId: string, updates: { status?: string; assignee?: string; deadline?: string }) => {
      try {
        const updated = await apiClient.updateTask(taskId, updates);
        setData((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update task";
        setError(message);
        throw err;
      }
    },
    []
  );

  return { data, loading, error, updateTask, refetch: () => apiClient.listTasks(filters).then(setData) };
}

export function useOverdueTasks() {
  const [data, setData] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient.getOverdueTasks();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch overdue tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: () => apiClient.getOverdueTasks().then(setData) };
}

export function useDecisions() {
  const [data, setData] = useState<ApiDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient.listDecisions();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch decisions");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error, refetch: () => apiClient.listDecisions().then(setData) };
}

export function useMeetings() {
  const [data, setData] = useState<ApiMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient.listMeetings();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch meetings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const uploadMeeting = useCallback(async (file: File, title: string) => {
    try {
      const result = await apiClient.uploadMeeting(file, title);
      // Refetch meetings
      const updated = await apiClient.listMeetings();
      setData(updated);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload meeting";
      setError(message);
      throw err;
    }
  }, []);

  return { data, loading, error, uploadMeeting, refetch: () => apiClient.listMeetings().then(setData) };
}

export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.healthCheck();
        setIsHealthy(true);
        setError(null);
      } catch (err) {
        setIsHealthy(false);
        setError(err instanceof Error ? err.message : "Backend connection failed");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, error };
}
