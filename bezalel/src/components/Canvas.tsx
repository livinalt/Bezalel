"use client";

import { useEffect, useRef } from "react";
import { Editor, Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { toast } from "sonner";

interface CanvasProps {
    showGrid: boolean;
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    editorRef: React.MutableRefObject<Editor | null>;
    showRulers: boolean;
    aiPrompt: string;
    setAiPrompt: (value: string) => void;
    saveCanvasState: () => void;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
    streamId: string | null;
    setStreamId: (value: string | null) => void;
    setCanvasPlaybackUrl: (url: string | null) => void;
}

export default function Canvas({
    showGrid,
    canvasRef,
    editorRef,
    showRulers,
    aiPrompt,
    setAiPrompt,
    saveCanvasState,
    isStreaming,
    setIsStreaming,
    streamId,
    setStreamId,
    setCanvasPlaybackUrl,
}: CanvasProps) {
    const streamRef = useRef<MediaStream | null>(null);

    // Function to create a Livepeer stream
    const createLivepeerStream = async () => {
        if (!process.env.NEXT_PUBLIC_LIVEPEER_API_KEY) {
            console.error("LIVEPEER_API_KEY missing");
            toast.error("Livepeer API key is not configured");
            setIsStreaming(false);
            return null;
        }

        try {
            console.log("Creating Livepeer stream...");
            const response = await fetch("https://livepeer.studio/api/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_LIVEPEER_API_KEY}`,
                },
                body: JSON.stringify({
                    name: `Canvas Stream ${Date.now()}`,
                    record: false,
                    profiles: [
                        { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
                        { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
                    ],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Create Livepeer stream failed:", errorText);
                throw new Error(`Failed to create stream: ${errorText}`);
            }

            const result = await response.json();
            console.log("Livepeer stream created:", JSON.stringify(result, null, 2));
            return result;
        } catch (error: any) {
            console.error("Create Livepeer stream error:", error);
            toast.error(`Failed to create stream: ${error.message}`);
            setIsStreaming(false);
            return null;
        }
    };

    useEffect(() => {
        if (isStreaming && !streamId) {
            createLivepeerStream().then((streamData) => {
                if (streamData) {
                    setStreamId(streamData.id);
                    const playbackUrl = `https://lvpr.tv?v=${streamData.playbackId}`;
                    setCanvasPlaybackUrl(playbackUrl);
                    console.log("Stream created, playback URL:", playbackUrl);
                    console.log("RTMP Server: rtmp://rtmp.livepeer.studio/live");
                    console.log("Stream Key:", streamData.streamKey);
                    toast.info(
                        `Stream created! Configure OBS to start streaming:\n` +
                        `1. Open OBS Studio\n` +
                        `2. Go to Settings > Stream\n` +
                        `3. Set Service to Custom\n` +
                        `4. Server: rtmp://rtmp.livepeer.studio/live\n` +
                        `5. Stream Key: ${streamData.streamKey}\n` +
                        `6. Add a Browser Source or Window Capture to capture the canvas\n` +
                        `7. Click Start Streaming\n` +
                        `Share this link with viewers: ${playbackUrl}`,
                        { duration: 10000 }
                    );
                }
            });
        }
    }, [isStreaming, streamId, setStreamId, setCanvasPlaybackUrl]); // Removed setIsStreaming

    useEffect(() => {
        if (!isStreaming || !streamId) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            return;
        }

        const startCanvasStream = async () => {
            if (!editorRef.current || !canvasRef.current) return;

            // Capture the tldraw canvas as a stream
            const canvas = canvasRef.current;
            const stream = canvas.captureStream(30); // 30 FPS
            streamRef.current = stream;
            console.log("Canvas stream started:", stream);
            // Note: Browser cannot push to RTMP directly; OBS is required
        };

        startCanvasStream();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, [isStreaming, streamId]);

    return (
        <div className="absolute inset-0 z-[1000]">
            <Tldraw
                onMount={(editor: Editor) => {
                    editorRef.current = editor;
                    editor.setCurrentTool("draw");
                    editor.updateInstanceState({
                        isGridMode: showGrid,
                    });
                    // Ensure canvasRef is linked to tldraw's canvas
                    canvasRef.current = editor.getContainer().querySelector("canvas") || canvasRef.current;
                }}
                onChange={() => {
                    saveCanvasState();
                }}
            >
                <canvas ref={canvasRef} style={{ display: "none" }} />
            </Tldraw>
        </div>
    );
}