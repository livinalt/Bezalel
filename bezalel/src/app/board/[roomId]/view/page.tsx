"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export default function View() {
    const { roomId } = useParams();
    const socketRef = useRef<Socket | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [canvasPlaybackUrl, setCanvasPlaybackUrl] = useState<string | null>(null);

    useEffect(() => {
        console.log("Viewer joining room:", roomId);
        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001");
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("joinSession", roomId);
        });

        socket.on("playbackInfo", ({ canvasPlaybackUrl: newCanvasUrl }) => {
            console.log("Received canvas playbackUrl:", newCanvasUrl);
            setError(null);
            toast.success("Received canvas stream URL");
            setCanvasPlaybackUrl(newCanvasUrl);
        });

        socket.on("viewerCount", (count: number) => {
            console.log(`Viewer count: ${count}`);
            setViewerCount(count);
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            setError(`Socket connection failed: ${err.message}`);
            toast.error(`Socket connection failed: ${err.message}`);
        });

        return () => {
            console.log("Disconnecting socket");
            socket.disconnect();
        };
    }, [roomId]);

    return (
        <div className="relative flex w-screen h-screen items-center justify-center bg-black">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-black/80">
                    <p>{error}</p>
                </div>
            )}
            {canvasPlaybackUrl && (
                <video
                    src={canvasPlaybackUrl}
                    autoPlay
                    muted
                    className="w-full h-full rounded bg-neutral-900"
                    onLoadStart={() => setLoading(true)}
                    onPlaying={() => setLoading(false)}
                    onError={(e) => {
                        setError(`Failed to play stream: ${e.currentTarget.error?.message || 'Unknown error'}`);
                        setLoading(false);
                    }}
                />
            )}
            <div className="absolute top-4 right-4 text-white text-xs">
                👀 {viewerCount} viewer{viewerCount === 1 ? "" : "s"}
            </div>
        </div>
    );
}