"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type WebcamStatus = "idle" | "requesting" | "ready" | "denied" | "error";

export type UseWebcamResult = {
  status: WebcamStatus;
  stream: MediaStream | null;
  errorMessage: string | null;
  requestAccess: () => Promise<void>;
  stop: () => void;
};

const defaultConstraints: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user",
  },
  audio: false,
};

function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function useWebcam(): UseWebcamResult {
  const [status, setStatus] = useState<WebcamStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const requestAccess = useCallback(async () => {
    if (typeof navigator === "undefined") return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Webcam API is not available in this browser.");
      return;
    }

    setStatus("requesting");
    setErrorMessage(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        defaultConstraints,
      );

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setStatus("ready");
    } catch {
      setStream(null);
      streamRef.current = null;
      setStatus("denied");
      setErrorMessage("Webcam permission denied or unavailable.");
    }
  }, []);

  const stop = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  return useMemo(
    () => ({ status, stream, errorMessage, requestAccess, stop }),
    [status, stream, errorMessage, requestAccess, stop],
  );
}
