
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

export default function View() {
    const { roomId } = useParams();
    const videoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const [viewerCount, setViewerCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStreamLive, setIsStreamLive] = useState(true);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001");
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("joinSession", roomId);
            setIsLoading(true);
            setError(null);
        });

        socket.on("playbackInfo", async ({ playbackUrl }) => {
            console.log("Received playbackUrl:", playbackUrl);
            if (!videoRef.current || !playbackUrl) {
                console.error("Missing videoRef or playbackUrl");
                setError("Failed to load video stream.");
                setIsLoading(false);
                return;
            }

            try {
                // Dynamic import of hls.js
                const Hls = (await import("hls.js")).default;
                console.log("hls.js loaded successfully");
                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hls.loadSource(playbackUrl);
                    hls.attachMedia(videoRef.current);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        console.log("HLS manifest parsed, attempting to play");
                        videoRef.current?.play().catch((err) => {
                            console.error("Playback failed:", err);
                            setError("Playback failed. Please try again.");
                        });
                        setIsLoading(false);
                        setIsStreamLive(true);
                    });
                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error("HLS error:", data);
                        setError("Streaming error occurred. Please try again.");
                        setIsLoading(false);
                    });
                } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
                    console.log("Native HLS supported, using direct src");
                    videoRef.current.src = playbackUrl;
                    videoRef.current.addEventListener("loadedmetadata", () => {
                        videoRef.current?.play().catch((err) => {
                            console.error("Native playback failed:", err);
                            setError("Playback failed. Please try again.");
                        });
                        setIsLoading(false);
                        setIsStreamLive(true);
                    });
                } else {
                    console.error("HLS not supported by browser or hls.js");
                    setError("Your browser does not support HLS streaming.");
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Failed to load hls.js:", err);
                // Fallback: Try direct playback
                if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
                    console.log("Falling back to native HLS");
                    videoRef.current.src = playbackUrl;
                    videoRef.current.addEventListener("loadedmetadata", () => {
                        videoRef.current?.play().catch((err) => {
                            console.error("Native playback failed:", err);
                            setError("Playback failed. Please try again.");
                        });
                        setIsLoading(false);
                        setIsStreamLive(true);
                    });
                } else {
                    console.error("No HLS support available");
                    setError("No HLS support available in this browser.");
                    setIsLoading(false);
                }
            }
        });

        socket.on("viewerCount", (count: number) => {
            console.log(`Viewer count: ${count}`);
            setViewerCount(count);
        });

        socket.on("stopStream", () => {
            console.log("Stream stopped");
            setIsStreamLive(false);
            setIsLoading(false);
            setError("The stream has ended.");
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            setError("Failed to connect to server. Please try again.");
            setIsLoading(false);
            toast.error("Failed to connect to server.");
        });

        return () => {
            console.log("Disconnecting socket");
            socket.disconnect();
        };
    }, [roomId]);

    const handleRetry = () => {
        setError(null);
        setIsLoading(true);
        socketRef.current?.emit("joinSession", roomId);
    };

    if (!roomId || typeof roomId !== "string") {
        return <div className="text-red-500 text-center">Error: Invalid or missing roomId</div>;
    }

    return (
        <div className="relative flex w-screen h-screen items-center justify-center bg-neutral-100 dark:bg-zinc-900">
            <header className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                    <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Bezalel View</h1>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ {roomId}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400 px-2">
                        👀 {viewerCount} viewer{viewerCount === 1 ? "" : "s"}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 px-2">
                        {isStreamLive ? (
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live
                            </span>
                        ) : (
                            <span>Offline</span>
                        )}
                    </div>
                    <ThemeToggle />
                </div>
            </header>
            <main className="absolute top-14 bottom-0 left-0 right-0 flex items-center justify-center">
                {isLoading && (
                    <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading stream...</span>
                    </div>
                )}
                {error && (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <span className="text-red-500 dark:text-red-400">{error}</span>
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                        >
                            Retry
                        </button>
                    </div>
                )}
                {!isLoading && !error && (
                    <video
                        ref={videoRef}
                        autoPlay
                        controls
                        muted
                        className="max-w-[90%] max-h-[90%] rounded bg-neutral-900 object-contain"
                    />
                )}
            </main>
        </div>
    );
}