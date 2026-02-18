const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiTask {
  id: string;
  meeting_id: string;
  task_description: string;
  assignee: string | null;
  deadline: string | null;
  confidence_score: number;
  risk_score: number | null;
  risk_level: string | null;
  status: string;
  created_at: string;
}

export interface ApiDecision {
  id: string;
  decision_statement: string;
  confidence_score: number;
  meeting_id: string;
  created_at: string;
  related_tasks: string[] | null;
}

export interface ApiMeeting {
  id: string;
  title: string;
  source_type?: string;
  duration_seconds?: number;
  pages?: number;
  created_at: string;
  transcript_segments?: number;
  tasks_extracted: number;
  decisions_extracted: number;
}

export interface ApiMeetingDetail {
  id: string;
  title: string;
  duration_seconds: number;
  transcript_raw: string;
  segments: unknown[];
  tasks: ApiTask[];
  decisions: ApiDecision[];
  created_at: string;
}

export interface RiskSummary {
  total_tasks: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  average_risk_score: number;
  risk_breakdown_percentage: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface RiskByAssignee {
  assignee: string;
  task_count: number;
  average_risk_score: number;
  critical_count: number;
  high_count: number;
}

export class VoxNoteApiClient {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Meetings
  async uploadMeeting(
    file: File,
    title: string
  ): Promise<{
    status: string;
    meeting_id: string;
    title: string;
    duration_seconds: number;
    segments: number;
    tasks_extracted: number;
    decisions_extracted: number;
    processing_metadata: unknown;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const response = await fetch(`${this.baseUrl}/api/meetings/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Documents
  async uploadDocument(
    file: File,
    title: string
  ): Promise<{
    status: string;
    document_id: string;
    title: string;
    document_type: string;
    pages: number;
    tasks_extracted: number;
    decisions_extracted: number;
    processing_metadata: unknown;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const response = await fetch(`${this.baseUrl}/api/documents/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async listDocuments(sourceType?: string, limit = 50, offset = 0): Promise<ApiMeeting[]> {
    const params = new URLSearchParams();
    if (sourceType) params.append("source_type", sourceType);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    return this.request(`/api/documents?${params.toString()}`);
  }

  async getDocumentDetails(documentId: string): Promise<ApiMeetingDetail> {
    return this.request(`/api/documents/${documentId}`);
  }

  async listMeetings(limit = 50, offset = 0): Promise<ApiMeeting[]> {
    return this.request(
      `/api/meetings?limit=${limit}&offset=${offset}`
    );
  }

  async getMeetingDetails(meetingId: string): Promise<ApiMeetingDetail> {
    return this.request(`/api/meetings/${meetingId}`);
  }

  // Tasks
  async listTasks(filters: {
    status?: string;
    assignee?: string;
    risk_level?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiTask[]> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.assignee) params.append("assignee", filters.assignee);
    if (filters.risk_level) params.append("risk_level", filters.risk_level);
    params.append("limit", (filters.limit || 50).toString());
    params.append("offset", (filters.offset || 0).toString());

    return this.request(`/api/tasks?${params.toString()}`);
  }

  async getTask(taskId: string): Promise<ApiTask> {
    return this.request(`/api/tasks/${taskId}`);
  }

  async getOverdueTasks(): Promise<ApiTask[]> {
    return this.request("/api/tasks/overdue");
  }

  async updateTask(
    taskId: string,
    updates: {
      status?: string;
      assignee?: string;
      deadline?: string;
    }
  ): Promise<ApiTask> {
    return this.request(`/api/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  // Decisions
  async listDecisions(
    confidenceMin = 0,
    limit = 50,
    offset = 0
  ): Promise<ApiDecision[]> {
    return this.request(
      `/api/decisions?confidence_min=${confidenceMin}&limit=${limit}&offset=${offset}`
    );
  }

  async getDecision(decisionId: string): Promise<ApiDecision> {
    return this.request(`/api/decisions/${decisionId}`);
  }

  // Risk Reports
  async getRiskSummary(): Promise<RiskSummary> {
    return this.request("/api/risk/summary");
  }

  async getRiskByAssignee(): Promise<RiskByAssignee[]> {
    return this.request("/api/risk/by-assignee");
  }

  async getRiskTimeline(days = 30): Promise<{
    period_days: number;
    timeline: Array<{
      date: string;
      task_count: number;
      avg_risk_score: number;
      critical_count: number;
      high_count: number;
    }>;
  }> {
    return this.request(`/api/risk/timeline?days=${days}`);
  }

  // Graph Queries
  async getTaskGraph(taskId: string): Promise<unknown> {
    return this.request(`/api/graph/task/${taskId}`);
  }

  async getMeetingGraph(meetingId: string): Promise<unknown> {
    return this.request(`/api/graph/meeting/${meetingId}`);
  }

  async getPersonNetwork(assignee: string): Promise<unknown> {
    return this.request(`/api/graph/person/${assignee}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.request("/health");
  }
}

export const apiClient = new VoxNoteApiClient();
