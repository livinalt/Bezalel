"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Socket } from "socket.io-client";
import { Canvas as FabricJSCanvas } from "fabric";
import { toast } from "sonner";

interface StreamManagerProps {
    isStreaming: boolean;
    useWebcam: boolean;
    enhanceWebcam: boolean;
    aiPrompt: string;
    webcamPrompt: string;
    roomId: string | string[];
    socketRef: React.MutableRefObject<Socket | null>;
    canvasRef: React.MutableRefObject<FabricJSCanvas | null>;
    setStreamId: (id: string | null) => void;
    webcamStream: MediaStream | null;
    setWebcamPlaybackUrl: (url: string | null) => void;
    setCanvasPlaybackUrl: (url: string | null) => void;
    setIsEnhanced: (value: boolean) => void;
}

const StreamManager = forwardRef(function StreamManager(
    {
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
        setWebcamPlaybackUrl,
        setCanvasPlaybackUrl,
        setIsEnhanced,
    }: StreamManagerProps,
    ref
) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const canvasStreamRef = useRef<MediaStream | null>(null);

    useImperativeHandle(ref, () => ({
        handleEnhance: async () => {
            if (!webcamStream || !webcamPrompt) return;
            try {
                const response = await fetch("/mock/daydream/streams", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: webcamPrompt, type: "webcam" }),
                });
                const data = await response.json();
                setWebcamPlaybackUrl(`https://mock-playback.daydream.live/${data.output_playback_id}`);
                setIsEnhanced(true);
                toast.success("Webcam enhancement started");
            } catch (error) {
                console.error("Webcam enhancement error:", error);
                toast.error("Failed to enhance webcam");
            }
        },
        handleCanvasEnhance: async () => {
            if (!canvasRef.current || !aiPrompt) return;
            try {
                const canvasData = canvasRef.current.toDataURL({ format: "png" });
                const response = await fetch("/mock/daydream/streams", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: aiPrompt, image: canvasData, type: "canvas" }),
                });
                const data = await response.json();
                setCanvasPlaybackUrl(`https://mock-playback.daydream.live/${data.output_playback_id}`);
                toast.success("Canvas enhancement started");
            } catch (error) {
                console.error("Canvas enhancement error:", error);
                toast.error("Failed to enhance canvas");
            }
        },
    }));

    useEffect(() => {
        if (!isStreaming) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            setStreamId(null);
            setWebcamPlaybackUrl(null);
            setCanvasPlaybackUrl(null);
            setIsEnhanced(false);
            return;
        }

        const startStreaming = async () => {
            try {
                const response = await fetch("/mock/daydream/streams", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "combined" }),
                });
                const data = await response.json();
                setStreamId(data.id);

                const ws = new WebSocket(data.whip_url);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log("WebSocket connected for streaming");
                };

                ws.onclose = () => {
                    console.log("WebSocket closed");
                    setStreamId(null);
                };

                ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    toast.error("Streaming error");
                };

                const combinedStream = new MediaStream();
                if (canvasRef.current) {
                    canvasStreamRef.current = canvasRef.current.getCanvasElement().captureStream(30);
                    canvasStreamRef.current.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
                }
                if (webcamStream) {
                    webcamStream.getTracks().forEach((track) => combinedStream.addTrack(track));
                }

                mediaRecorderRef.current = new MediaRecorder(combinedStream, {
                    mimeType: "video/webm;codecs=vp8,opus",
                });

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                        ws.send(event.data);
                    }
                };

                mediaRecorderRef.current.onstop = () => {
                    console.log("MediaRecorder stopped");
                    if (canvasStreamRef.current) {
                        canvasStreamRef.current.getTracks().forEach((track) => track.stop());
                    }
                };

                mediaRecorderRef.current.start(1000);

                socketRef.current?.emit("playbackInfo", {
                    canvasPlaybackUrl: `https://mock-playback.daydream.live/${data.output_playback_id}/canvas`,
                    webcamPlaybackUrl: useWebcam ? `https://mock-playback.daydream.live/${data.output_playback_id}/webcam` : null,
                    roomId,
                });

                if (enhanceWebcam && webcamPrompt) {
                    const enhanceResponse = await fetch("/mock/daydream/streams", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt: webcamPrompt, type: "webcam" }),
                    });
                    const enhanceData = await enhanceResponse.json();
                    setWebcamPlaybackUrl(`https://mock-playback.daydream.live/${enhanceData.output_playback_id}`);
                    setIsEnhanced(true);
                }
            } catch (error) {
                console.error("Streaming setup error:", error);
                toast.error("Failed to start streaming");
            }
        };

        startStreaming();

        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [isStreaming, useWebcam, enhanceWebcam, webcamPrompt, roomId, socketRef, canvasRef, setStreamId, webcamStream, setWebcamPlaybackUrl, setCanvasPlaybackUrl, setIsEnhanced]);

    return null;
});

export default StreamManager;