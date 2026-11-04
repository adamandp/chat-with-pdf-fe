"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getDocument } from "@/features/document/document.api";
import { documentKeys } from "@/features/document/document.query";
import { useAuth } from "@/providers/auth-provider";
import {
  forgetPendingUploads,
  getPendingUploads,
  subscribePendingUploads,
  EMPTY_PENDING_UPLOADS,
} from "./pending-uploads";

type PollStatus = "READY" | "FAILED" | "PENDING";

/** A failed status request is not evidence that the PDF worker failed. */
export async function checkUploadStatus(id: string): Promise<PollStatus> {
  try {
    const document = await getDocument(id);
    if (document.status === "READY" || document.status === "FAILED") return document.status;
  } catch {
    // Network errors, transient 5xx and timeouts all remain recoverable.
  }
  return "PENDING";
}

/** Resume queued PDFs on remount/refresh without a second PUT or process request. */
export function usePendingUploads(scope: string, onReady: (ids: string[]) => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  const ownerId = user?.id ?? null;
  const allPending = useSyncExternalStore(
    subscribePendingUploads,
    () => getPendingUploads(ownerId ?? ""),
    () => EMPTY_PENDING_UPLOADS,
  );
  const uploads = useMemo(
    () => allPending.filter((item) => item.scope === scope),
    [allPending, scope],
  );

  useEffect(() => {
    if (!ownerId || uploads.length === 0) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      const statuses = await Promise.all(
        uploads.map(async (item) => ({ item, status: await checkUploadStatus(item.id) })),
      );
      if (disposed) return;
      const completed = statuses.filter(({ status }) => status === "READY");
      const failed = statuses.filter(({ status }) => status === "FAILED");
      if (completed.length || failed.length) {
        forgetPendingUploads(
          ownerId,
          [...completed, ...failed].map(({ item }) => item.id),
        );
        if (completed.length) {
          onReadyRef.current(completed.map(({ item }) => item.id));
          toast.success(
            completed.length === 1
              ? `${completed[0].item.name} is ready to chat`
              : `${completed.length} PDFs are ready to chat`,
          );
        }
        if (failed.length) toast.error("PDF processing failed. Upload the PDF again to retry.");
        void queryClient.invalidateQueries({ queryKey: documentKeys.all });
      } else {
        // Back off for long-running jobs; never interpret elapsed time as FAILED.
        const oldest = Math.min(...uploads.map((item) => item.queuedAt));
        const elapsed = Date.now() - oldest;
        timer = setTimeout(poll, elapsed > 600_000 ? 30_000 : elapsed > 120_000 ? 10_000 : 3_000);
      }
    };

    void poll();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [ownerId, uploads, queryClient]);

  return uploads;
}
