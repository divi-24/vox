"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Waves, AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TasksList } from "@/components/tasks-list";
import { DecisionsList } from "@/components/decisions-list";
import { RiskDashboard } from "@/components/risk-dashboard";
import { useOverdueTasks, useRiskSummary } from "@/lib/hooks";
import { apiClient } from "@/lib/api-client";

export default function LivePage() {
  const { data: riskData, loading: riskLoading } = useRiskSummary();
  const { data: overdueTasks } = useOverdueTasks();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<any | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        setSpeechSupported(false);
      }
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setRecordingError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) return;

        setIsUploading(true);
        try {
          const file = new File([blob], `live-meeting-${new Date().toISOString()}.webm`, {
            type: "audio/webm",
          });
          await apiClient.uploadMeeting(file, `Live meeting ${new Date().toLocaleString()}`);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to upload recorded meeting";
          setRecordingError(message);
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not access microphone. Please check browser permissions.";
      setRecordingError(message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const startLiveTranscript = () => {
    setSpeechError(null);

    if (typeof window === "undefined") {
      setSpeechError("Live transcription is not available in this environment.");
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      setSpeechError("Your browser does not support live transcription.");
      return;
    }

    try {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript + " ";
        }
        setLiveTranscript(text.trim());
      };

      recognition.onerror = (event: any) => {
        setSpeechError(event.error || "Live transcription error");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start live transcription.";
      setSpeechError(message);
      setIsListening(false);
    }
  };

  const stopLiveTranscript = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Live Intelligence Dashboard
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Real-time view of all extracted decisions, tasks, and risks from your uploaded meetings and documents.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Waves className="h-5 w-5 text-primary" />
            Live meeting capture
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Capture a live meeting directly from your microphone. When you stop, the audio is
              uploaded and processed through the same transcription and extraction pipeline as
              file uploads.
            </p>
            <p className="text-xs">
              The extracted tasks, decisions, and risk will appear in the History and Dashboard
              views once processing finishes.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isUploading}
              className={[
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm",
                isRecording
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              ].join(" ")}
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start recording
                </>
              )}
            </button>
            <div className="text-xs text-muted-foreground">
              {isRecording
                ? `Recording… ${recordSeconds}s`
                : isUploading
                ? "Uploading and processing recording…"
                : "Idle"}
            </div>
            {recordingError && (
              <div className="mt-1 flex items-start gap-1 text-xs text-rose-500">
                <AlertCircle className="h-3 w-3 mt-0.5" />
                <span>{recordingError}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Waves className="h-5 w-5 text-primary" />
            Live transcript (browser demo)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground md:max-w-xl">
              This uses your browser&apos;s built-in speech recognition to generate an on-screen
              transcript in real time. It&apos;s local to your browser and does not affect the
              backend pipeline.
            </p>
            <div className="flex flex-col items-start gap-1 md:items-end">
              <button
                type="button"
                onClick={isListening ? stopLiveTranscript : startLiveTranscript}
                disabled={!speechSupported}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm",
                  isListening
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ].join(" ")}
              >
                {isListening ? (
                  <>
                    <Square className="h-4 w-4" />
                    Stop live transcript
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Start live transcript
                  </>
                )}
              </button>
              <span className="text-xs text-muted-foreground">
                {speechSupported
                  ? isListening
                    ? "Listening…"
                    : "Idle"
                  : "Not supported in this browser"}
              </span>
            </div>
          </div>

          {speechError && (
            <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-500">
              <AlertCircle className="h-3 w-3 mt-0.5" />
              <span>{speechError}</span>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Live transcript
            </p>
            <div className="max-h-56 overflow-y-auto rounded-md border border-border/70 bg-background/60 p-3 text-sm whitespace-pre-wrap">
              {liveTranscript || "Start live transcript to see text appear here as you speak."}
            </div>
          </div>
        </CardContent>
      </Card>

      <RiskDashboard />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Critical & High-Risk Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksList risk_level="High" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <DecisionsList />
          </CardContent>
        </Card>
      </div>

      {overdueTasks.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 dark:text-red-400">
              ⚠️ {overdueTasks.length} Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TasksList status="overdue" />
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
