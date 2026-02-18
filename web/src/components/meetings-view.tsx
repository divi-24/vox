"use client";

import { useState } from "react";
import { useMeetings } from "@/lib/hooks";
import { apiClient, type ApiMeeting, type ApiMeetingDetail } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, Clock, X } from "lucide-react";
import { MeetingUpload } from "./meeting-upload";

export function MeetingsView() {
  const { data: meetings, loading, uploadMeeting, refetch } = useMeetings();
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [meetingDetail, setMeetingDetail] = useState<ApiMeetingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadMeetingDetail = async (meeting: ApiMeeting, kind: "audio" | "document") => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail =
        kind === "document" || meeting.source_type && meeting.source_type !== "audio"
          ? await apiClient.getDocumentDetails(meeting.id)
          : await apiClient.getMeetingDetails(meeting.id);
      setMeetingDetail(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load meeting details";
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectMeeting = async (meeting: ApiMeeting) => {
    setSelectedMeeting(meeting.id);
    const kind: "audio" | "document" = meeting.source_type === "audio" ? "audio" : "document";
    await loadMeetingDetail(meeting, kind);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-rose-900 dark:text-rose-200">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <MeetingUpload
          onSuccess={async (id, type) => {
            setSelectedMeeting(id);
            setErrorMessage(null);
            await refetch();
            const justUploaded = meetings.find((m) => m.id === id);
            if (justUploaded) {
              await loadMeetingDetail(justUploaded, type);
            }
          }}
          onError={(error) => {
            setErrorMessage(error);
          }}
        />
      </div>

      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No content uploaded yet. Start by uploading a meeting or document.</p>
              </div>
            ) : (
              meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  onClick={() => handleSelectMeeting(meeting)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedMeeting === meeting.id
                      ? "border-primary bg-primary/5"
                      : "border-border/70 hover:bg-background/80"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{meeting.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {meeting.source_type === "audio" ? "🎙️ Audio" : "📄 Document"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(meeting.created_at).toLocaleDateString()}
                          </Badge>
                          {meeting.source_type === "audio" && meeting.duration_seconds && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              {Math.round(meeting.duration_seconds / 60)}m
                            </Badge>
                          )}
                          {meeting.pages && (
                            <Badge variant="secondary" className="text-xs">
                              {meeting.pages} pages
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>📋 {meeting.tasks_extracted} tasks</span>
                      <span>💡 {meeting.decisions_extracted} decisions</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {selectedMeeting && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Sanitized Transcript & Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detailLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}
              {detailError && !detailLoading && (
                <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5" />
                  <p className="text-rose-900 dark:text-rose-200">{detailError}</p>
                </div>
              )}
              {meetingDetail && !detailLoading && !detailError && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">
                      {meetingDetail.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(meetingDetail.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Sanitized transcript
                    </p>
                    <div className="max-h-64 overflow-y-auto rounded-md border border-border/70 bg-background/60 p-3 text-sm whitespace-pre-wrap">
                      {sanitizeTranscript(meetingDetail.transcript_raw || "") ||
                        "No transcript available for this item."}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Tasks
                      </p>
                      {meetingDetail.tasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No tasks extracted.</p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {meetingDetail.tasks.map((task) => (
                            <li key={task.id} className="flex flex-col rounded-md border border-border/70 bg-background/60 p-2">
                              <span className="font-medium line-clamp-2">
                                {task.task_description}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {(task.assignee || "Unassigned") +
                                  (task.deadline ? ` • due ${new Date(task.deadline).toLocaleDateString()}` : "")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Decisions
                      </p>
                      {meetingDetail.decisions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No decisions extracted.</p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {meetingDetail.decisions.map((decision) => (
                            <li key={decision.id} className="rounded-md border border-border/70 bg-background/60 p-2">
                              <span className="font-medium line-clamp-2">
                                {decision.decision_statement}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Confidence {(decision.confidence_score * 100).toFixed(0)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function sanitizeTranscript(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/\b(um|uh|like|you know)\b/gi, "");
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned;
}
