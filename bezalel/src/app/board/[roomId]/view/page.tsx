
"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import io, { Socket } from "socket.io-client";

export default function View() {
    const { roomId } = useParams();
    const videoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001");
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("joinSession", roomId);
        });

        socket.on("playbackInfo", async ({ playbackUrl }) => {
            console.log("Received playbackUrl:", playbackUrl);
            if (!videoRef.current || !playbackUrl) {
                console.error("Missing videoRef or playbackUrl");
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
                        videoRef.current?.play().catch((err) => console.error("Playback failed:", err));
                    });
                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error("HLS error:", data);
                    });
                } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
                    console.log("Native HLS supported, using direct src");
                    videoRef.current.src = playbackUrl;
                    videoRef.current.addEventListener("loadedmetadata", () => {
                        videoRef.current?.play().catch((err) => console.error("Native playback failed:", err));
                    });
                } else {
                    console.error("HLS not supported by browser or hls.js");
                }
            } catch (err) {
                console.error("Failed to load hls.js:", err);
                // Fallback: Try direct playback
                if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
                    console.log("Falling back to native HLS");
                    videoRef.current.src = playbackUrl;
                    videoRef.current.addEventListener("loadedmetadata", () => {
                        videoRef.current?.play().catch((err) => console.error("Native playback failed:", err));
                    });
                } else {
                    console.error("No HLS support available");
                }
            }
        });

        socket.on("viewerCount", (count: number) => {
            console.log(`Viewer count: ${count}`);
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });

        return () => {
            console.log("Disconnecting socket");
            socket.disconnect();
        };
    }, [roomId]);

    return (
        <div className="flex w-screen h-screen items-center justify-center bg-black">
            <video
                ref={videoRef}
                autoPlay
                controls
                muted
                className="w-[90%] h-[90%] rounded bg-neutral-900"
            />
        </div>
    );
}