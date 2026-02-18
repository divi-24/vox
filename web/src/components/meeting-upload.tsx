"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";

interface MeetingUploadProps {
  onSuccess?: (id: string, type: "audio" | "document") => void;
  onError?: (error: string) => void;
}

export function MeetingUpload({ onSuccess, onError }: MeetingUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!title.trim()) {
      onError?.("Please enter a title");
      return;
    }

    setIsLoading(true);
    try {
      const isAudio = file.type.startsWith("audio/");
      const isPDF = file.name.endsWith(".pdf");
      const isDocx = file.name.endsWith(".docx");
      const isPptx = file.name.endsWith(".pptx");

      if (isAudio) {
        const result = await apiClient.uploadMeeting(file, title);
        onSuccess?.(result.meeting_id, "audio");
      } else if (isPDF || isDocx || isPptx) {
        const result = await apiClient.uploadDocument(file, title);
        onSuccess?.(result.document_id, "document");
      } else {
        onError?.("Supported: Audio (WAV, MP3) or Documents (PDF, DOCX, PPTX)");
        return;
      }

      setTitle("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border/70 bg-background/50 p-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          placeholder="e.g., Q1 Planning or Project Proposal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">File Upload</label>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.pdf,.docx,.pptx"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            disabled={isLoading}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={isLoading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isLoading ? "Uploading..." : "Select File"}
          </Button>
        </div>
      </div>

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || !title.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload & Extract
          </>
        )}
      </Button>

      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="font-medium">Supported:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>🎙️ Audio: WAV, MP3, M4A (up to 1 hour)</li>
          <li>📄 Documents: PDF, Word (.docx), PowerPoint (.pptx)</li>
        </ul>
      </div>
    </div>
  );
}
