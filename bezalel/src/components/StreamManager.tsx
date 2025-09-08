
"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface StreamManagerProps {
    roomId: string;
    setCanvasPlaybackUrl: (url: string | null) => void;
    setWebcamPlaybackUrl: (url: string | null) => void;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
}

interface StreamData {
    id: string;
    streamKey: string;
    playbackId: string;
    isActive: boolean;
}

export default function StreamManager({
    roomId,
    setCanvasPlaybackUrl,
    setWebcamPlaybackUrl,
    isStreaming,
    setIsStreaming,
}: StreamManagerProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [canvasStream, setCanvasStream] = useState<StreamData | null>(null);
    const [webcamStream, setWebcamStream] = useState<StreamData | null>(null);

    const createLivepeerStream = async (name: string) => {
        if (!process.env.NEXT_PUBLIC_LIVEPEER_API_KEY) {
            console.error("LIVEPEER_API_KEY missing");
            toast.error("Configure LIVEPEER_API_KEY");
            return null;
        }

        try {
            const response = await fetch("https://livepeer.studio/api/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_LIVEPEER_API_KEY}`,
                },
                body: JSON.stringify({
                    name,
                    profiles: [
                        { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
                        { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
                    ],
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create stream: ${await response.text()}`);
            }

            const result = await response.json();
            console.log("Livepeer response:", JSON.stringify(result, null, 2));
            return result;
        } catch (error: any) {
            console.error("Create Livepeer stream error:", error);
            toast.error(`Failed to create stream: ${error.message}`);
            return null;
        }
    };

    const checkStreamStatus = async (streamId: string) => {
        if (!process.env.NEXT_PUBLIC_LIVEPEER_API_KEY) {
            console.error("LIVEPEER_API_KEY missing");
            return false;
        }

        try {
            const response = await fetch(`https://livepeer.studio/api/stream/${streamId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_LIVEPEER_API_KEY}`,
                },
            });
            if (!response.ok) {
                console.error(`Stream status check failed (${response.status}):`, await response.text());
                return false;
            }
            const result = await response.json();
            return result.isActive;
        } catch (error) {
            console.error("Stream status error:", error);
            return false;
        }
    };

    const handleStartStreaming = async () => {
        // Check if existing streams are active
        let canvasStreamActive = canvasStream ? await checkStreamStatus(canvasStream.id) : false;
        let webcamStreamActive = webcamStream ? await checkStreamStatus(webcamStream.id) : false;

        if (canvasStreamActive || webcamStreamActive) {
            toast("Streams are already active", {
                action: {
                    label: "Continue",
                    onClick: () => {
                        setIsStreaming(true);
                        if (canvasStream) {
                            console.log(`✅ Canvas RTMP instructions:
                    Configure OBS Studio:
                    1. Settings > Stream > Custom
                    2. URL: rtmp://rtmp.livepeer.com/live
                    3. Stream Key: ${canvasStream.streamKey}
                    4. Source: Display Capture
                    5. Start Streaming
                    Playback: https://livepeer.studio/hls/${canvasStream.playbackId}/index.m3u8`);
                            setCanvasPlaybackUrl(`https://livepeer.studio/hls/${canvasStream.playbackId}/index.m3u8`);
                            socket?.emit("updateCanvasPlaybackUrl", { roomId, url: `https://livepeer.studio/hls/${canvasStream.playbackId}/index.m3u8` });
                        }
                        if (webcamStream) {
                            console.log(`✅ Webcam RTMP instructions:
                    Configure OBS Studio:
                    1. Settings > Stream > Custom
                    2. URL: rtmp://rtmp.livepeer.com/live
                    3. Stream Key: ${webcamStream.streamKey}
                    4. Source: Video Capture
                    5. Start Streaming
                    Playback: https://livepeer.studio/hls/${webcamStream.playbackId}/index.m3u8`);
                            setWebcamPlaybackUrl(`https://livepeer.studio/hls/${webcamStream.playbackId}/index.m3u8`);
                            socket?.emit("updateWebcamPlaybackUrl", { roomId, url: `https://livepeer.studio/hls/${webcamStream.playbackId}/index.m3u8` });
                        }
                    },
                },
                cancel: {
                    label: "Cancel",
                    onClick: () => { },
                },
            });
            return;
        }

        // Create new streams if none are active
        const canvasResult = await createLivepeerStream(`Canvas Stream ${uuidv4()}`);
        const webcamResult = await createLivepeerStream(`Webcam Stream ${uuidv4()}`);

        if (canvasResult) {
            setCanvasStream({
                id: canvasResult.id,
                streamKey: canvasResult.streamKey,
                playbackId: canvasResult.playbackId,
                isActive: canvasResult.isActive,
            });
            console.log(`✅ Canvas RTMP instructions:
                Configure OBS Studio:
                1. Settings > Stream > Custom
                2. URL: rtmp://rtmp.livepeer.com/live
                3. Stream Key: ${canvasResult.streamKey}
                4. Source: Display Capture
                5. Start Streaming
                Playback: https://livepeer.studio/hls/${canvasResult.playbackId}/index.m3u8`);
            setCanvasPlaybackUrl(`https://livepeer.studio/hls/${canvasResult.playbackId}/index.m3u8`);
            socket?.emit("updateCanvasPlaybackUrl", { roomId, url: `https://livepeer.studio/hls/${canvasResult.playbackId}/index.m3u8` });
        }

        if (webcamResult) {
            setWebcamStream({
                id: webcamResult.id,
                streamKey: webcamResult.streamKey,
                playbackId: webcamResult.playbackId,
                isActive: webcamResult.isActive,
            });
            console.log(`✅ Webcam RTMP instructions:
                Configure OBS Studio:
                1. Settings > Stream > Custom
                2. URL: rtmp://rtmp.livepeer.com/live
                3. Stream Key: ${webcamResult.streamKey}
                4. Source: Video Capture
                5. Start Streaming
                Playback: https://livepeer.studio/hls/${webcamResult.playbackId}/index.m3u8`);
            setWebcamPlaybackUrl(`https://livepeer.studio/hls/${webcamResult.playbackId}/index.m3u8`);
            socket?.emit("updateWebcamPlaybackUrl", { roomId, url: `https://livepeer.studio/hls/${webcamResult.playbackId}/index.m3u8` });
        }

        if (canvasResult || webcamResult) {
            setIsStreaming(true);
        }
    };

    const handleStopStreaming = () => {
        toast("Are you sure you want to end the livestream?", {
            action: {
                label: "End Stream",
                onClick: () => {
                    setIsStreaming(false);
                    console.log("⏹ Stop streaming in OBS Studio");
                    setCanvasPlaybackUrl(null);
                    setWebcamPlaybackUrl(null);
                    socket?.emit("updateCanvasPlaybackUrl", { roomId, url: null });
                    socket?.emit("updateWebcamPlaybackUrl", { roomId, url: null });
                    setCanvasStream(null);
                    setWebcamStream(null);
                },
            },
            cancel: {
                label: "Cancel",
                onClick: () => { },
            },
        });
    };

    useEffect(() => {
        console.log("StreamManager mounted, isStreaming:", isStreaming);
        const newSocket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001");
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isStreaming]);

    useEffect(() => {
        if (isStreaming) {
            toast("Start streaming?", {
                action: {
                    label: "Confirm",
                    onClick: handleStartStreaming,
                },
                cancel: {
                    label: "Cancel",
                    onClick: () => setIsStreaming(false),
                },
            });
        } else {
            if (canvasStream || webcamStream) {
                handleStopStreaming();
            }
        }
    }, [isStreaming]);

    return null;
}