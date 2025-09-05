"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";

export default function View() {
    const { roomId } = useParams();
    const canvasVideoRef = useRef<HTMLVideoElement>(null);
    const webcamVideoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadPlayback = (url: string, videoEl: HTMLVideoElement | null, streamType: 'canvas' | 'webcam') => {
        if (!videoEl || !url) {
            console.error(`Missing videoEl or url for ${streamType}`, { url, videoEl });
            setError(`Missing video element or URL for ${streamType}`);
            return;
        }

        setLoading(true);
        console.log(`Loading ${streamType} stream:`, url);

        import("hls.js")
            .then(({ default: Hls }) => {
                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hls.loadSource(url);
                    hls.attachMedia(videoEl);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        console.log(`HLS manifest parsed for ${streamType}`);
                        videoEl.play().catch((err) => {
                            console.error(`Playback failed for ${streamType}:`, err);
                            setError(`Failed to play ${streamType} stream: ${err.message}`);
                        });
                        setLoading(false);
                    });
                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error(`HLS error for ${streamType}:`, { event, type: data.type, details: data.details, fatal: data.fatal });
                        if (data.fatal) {
                            setError(`Failed to load ${streamType} stream: ${data.type} - ${data.details}`);
                        }
                        setLoading(false);
                    });
                } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
                    console.log(`Native HLS supported for ${streamType}, using direct src:`, url);
                    videoEl.src = url;
                    videoEl.addEventListener("loadedmetadata", () => {
                        videoEl.play().catch((err) => {
                            console.error(`Native playback failed for ${streamType}:`, err);
                            setError(`Failed to play ${streamType} stream: ${err.message}`);
                        });
                        setLoading(false);
                    });
                } else {
                    console.error(`HLS not supported by browser or hls.js for ${streamType}`);
                    setError(`HLS not supported for ${streamType}`);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error(`Failed to load hls.js for ${streamType}:`, err);
                setError(`Failed to load HLS library for ${streamType}: ${err.message}`);
                setLoading(false);
                if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
                    console.log(`Falling back to native HLS for ${streamType}`);
                    videoEl.src = url;
                    videoEl.addEventListener("loadedmetadata", () => {
                        videoEl.play().catch((err) => {
                            console.error(`Native playback failed for ${streamType}:`, err);
                            setError(`Failed to play ${streamType} stream: ${err.message}`);
                        });
                        setLoading(false);
                    });
                } else {
                    setError(`No HLS support available for ${streamType}`);
                }
            });
    };

    useEffect(() => {
        console.log("Viewer joining room:", roomId);
        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001");
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("joinSession", roomId);
        });

        socket.on("playbackInfo", async ({ canvasPlaybackUrl, webcamPlaybackUrl }) => {
            console.log("Received playbackUrls:", { canvasPlaybackUrl, webcamPlaybackUrl });
            setError(null);
            toast.success("Received stream URLs");
            if (canvasPlaybackUrl) {
                loadPlayback(canvasPlaybackUrl, canvasVideoRef.current, 'canvas');
            } else {
                console.warn("No canvasPlaybackUrl received");
                toast.info("No canvas stream available");
            }
            if (webcamPlaybackUrl) {
                loadPlayback(webcamPlaybackUrl, webcamVideoRef.current, 'webcam');
            } else {
                console.warn("No webcamPlaybackUrl received");
                toast.info("No webcam stream available");
            }
        });

        socket.on("viewerCount", (count: number) => {
            console.log(`Viewer count: ${count}`);
            toast.info(`Viewer count: ${count}`);
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
            <video
                ref={canvasVideoRef}
                autoPlay
                controls
                muted
                className="w-full h-full rounded bg-neutral-900"
            />
            <video
                ref={webcamVideoRef}
                autoPlay
                controls
                className="absolute bottom-4 right-4 w-64 h-36 rounded bg-neutral-900 object-cover"
            />
        </div>
    );
}