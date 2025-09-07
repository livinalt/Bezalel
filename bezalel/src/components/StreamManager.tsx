"use client";

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";

interface StreamManagerProps {
    isStreaming: boolean;
    useWebcam: boolean;
    enhanceWebcam: boolean;
    aiPrompt: string;
    webcamPrompt: string;
    roomId: string | string[];
    socketRef: React.MutableRefObject<Socket | null>;
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    setStreamId: (id: string | null) => void;
    webcamStream: MediaStream | null;
    setCanvasPlaybackUrl: (url: string | null) => void;
    setWebcamPlaybackUrl: (url: string | null) => void;
    setIsEnhanced: (value: boolean) => void;
    setIsStreaming: (value: boolean) => void;
}

export default function StreamManager({
    isStreaming,
    useWebcam,
    enhanceWebcam,
    aiPrompt,
    webcamPrompt,
    roomId,
    socketRef,
    canvasRef,
    setStreamId,
    webcamStream,
    setCanvasPlaybackUrl,
    setWebcamPlaybackUrl,
    setIsEnhanced,
    setIsStreaming,
}: StreamManagerProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const canvasStreamRef = useRef<MediaStream | null>(null);
    const webcamRecorderRef = useRef<MediaRecorder | null>(null);
    const webcamWsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const startCanvasStreaming = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_SIGNALING_URL?.replace("ws", "http") || "http://localhost:3001";
                const apiUrl = new URL("/mock/daydream/streams", baseUrl);
                const response = await fetch(apiUrl.toString(), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "combined" }),
                    credentials: "include", // Include credentials for CORS
                });

                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                }

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    const text = await response.text();
                    throw new Error(`Expected JSON, received ${contentType}: ${text.slice(0, 50)}...`);
                }

                const data = await response.json();
                if (isCancelled) return;

                setStreamId(data.id);

                const ws = new WebSocket(data.whip_url);
                wsRef.current = ws;

                const combinedStream = new MediaStream();
                if (canvasRef.current) {
                    canvasStreamRef.current = canvasRef.current.captureStream(30);
                    canvasStreamRef.current.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
                }
                if (useWebcam && !enhanceWebcam && webcamStream) {
                    webcamStream.getTracks().forEach((t) => combinedStream.addTrack(t));
                }

                mediaRecorderRef.current = new MediaRecorder(combinedStream, {
                    mimeType: "video/webm;codecs=vp8,opus",
                    videoBitsPerSecond: 2500000,
                });

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                        ws.send(event.data);
                    }
                };

                mediaRecorderRef.current.start(1000);

                ws.onopen = () => {
                    if (!isCancelled) toast.success("Streaming started");
                };

                ws.onclose = () => {
                    if (!isCancelled) toast.error("Streaming connection closed");
                };

                setCanvasPlaybackUrl(`https://mock-playback.daydream.live/${data.output_playback_id}`);
            } catch (error) {
                if (!isCancelled) {
                    console.error("Streaming error:", error);
                    toast.error(`Failed to start streaming: ${error.message}`);
                    setIsStreaming(false);
                    setStreamId(null);
                    setCanvasPlaybackUrl(null);
                }
            }
        };

        if (isStreaming) {
            startCanvasStreaming();
        }

        return () => {
            isCancelled = true;
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (canvasStreamRef.current) {
                canvasStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            setStreamId(null);
            setCanvasPlaybackUrl(null);
        };
    }, [isStreaming, useWebcam, enhanceWebcam, webcamStream, canvasRef, setStreamId, setCanvasPlaybackUrl, setIsStreaming]);

    useEffect(() => {
        let isCancelled = false;

        const startWebcamStreaming = async () => {
            if (!webcamStream) return;
            try {
                const baseUrl = process.env.NEXT_PUBLIC_SIGNALING_URL?.replace("ws", "http") || "http://localhost:3001";
                const apiUrl = new URL("/mock/daydream/streams", baseUrl);
                const response = await fetch(apiUrl.toString(), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: webcamPrompt, type: "webcam" }),
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                }

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    const text = await response.text();
                    throw new Error(`Expected JSON, received ${contentType}: ${text.slice(0, 50)}...`);
                }

                const data = await response.json();
                if (isCancelled) return;

                const ws = new WebSocket(data.whip_url);
                webcamWsRef.current = ws;

                const recorder = new MediaRecorder(webcamStream, {
                    mimeType: "video/webm;codecs=vp8,opus",
                    videoBitsPerSecond: 2500000,
                });

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                        ws.send(event.data);
                    }
                };

                recorder.start(1000);
                webcamRecorderRef.current = recorder;

                ws.onopen = () => {
                    if (!isCancelled) toast.success("Webcam enhancement started");
                };

                ws.onclose = () => {
                    if (!isCancelled) toast.error("Webcam streaming connection closed");
                };

                setWebcamPlaybackUrl(`https://mock-playback.daydream.live/${data.output_playback_id}`);
                setIsEnhanced(true);
            } catch (error) {
                if (!isCancelled) {
                    console.error("Webcam enhancement error:", error);
                    toast.error(`Failed to enhance webcam: ${error.message}`);
                    setWebcamPlaybackUrl(null);
                    setIsEnhanced(false);
                    setIsStreaming(false);
                }
            }
        };

        if (isStreaming && useWebcam && enhanceWebcam) {
            startWebcamStreaming();
        }

        return () => {
            isCancelled = true;
            if (webcamRecorderRef.current && webcamRecorderRef.current.state !== "inactive") {
                webcamRecorderRef.current.stop();
            }
            if (webcamWsRef.current) {
                webcamWsRef.current.close();
            }
            setWebcamPlaybackUrl(null);
            setIsEnhanced(false);
        };
    }, [isStreaming, useWebcam, enhanceWebcam, webcamPrompt, webcamStream, setWebcamPlaybackUrl, setIsEnhanced, setIsStreaming]);

    return null;
}