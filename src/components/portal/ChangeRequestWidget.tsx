"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, Loader2, X } from "lucide-react";
import { MAX_CHANGE_REQUEST_NOTE_LENGTH } from "@/lib/constants";

const SUCCESS_DISPLAY_MS = 3000;

type Feedback = { type: "success" | "error"; text: string };

export function ChangeRequestWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  const trimmed = note.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed.length <= MAX_CHANGE_REQUEST_NOTE_LENGTH && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmed, page: pathname }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit change request");
      }

      setNote("");
      setFeedback({ type: "success", text: "Saved — thanks!" });
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), SUCCESS_DISPLAY_MS);
    } catch {
      setFeedback({ type: "error", text: "Couldn't save that — try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-[45] sm:bottom-4">
      {open && (
        <Card className="mb-2 w-72 p-3 space-y-2 shadow-lg" onKeyDown={handleKeyDown}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Submit change request
            </span>
            <button
              type="button"
              onClick={close}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What should change on this page?"
            className="min-h-[90px] text-sm"
            maxLength={MAX_CHANGE_REQUEST_NOTE_LENGTH}
          />

          <div aria-live="polite" className="min-h-[1.25rem] text-xs">
            {feedback && (
              <p className={feedback.type === "success" ? "text-emerald-600" : "text-destructive"}>
                {feedback.text}
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="sm"
            className="w-full gap-1.5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit
          </Button>
        </Card>
      )}

      <Button
        ref={triggerRef}
        variant="default"
        size="icon"
        className="rounded-full shadow-lg"
        aria-label="Submit change request"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MessageSquarePlus className="w-5 h-5" />
      </Button>
    </div>
  );
}
