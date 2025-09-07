"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";
import Hls from "hls.js";

export default function View() {
    const { roomId } = useParams();
    const canvasVideoRef = useRef<HTMLVideoElement>(null);
    const webcamVideoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [canvasPlaybackUrl, setCanvasPlaybackUrl] = useState<string | null>(null);
    const [webcamPlaybackUrl, setWebcamPlaybackUrl] = useState<string | null>(null);

    const loadPlayback = (url: string, videoEl: HTMLVideoElement | null, streamType: 'canvas' | 'webcam') => {
        if (!videoEl || !url) {
            console.error(`Missing videoEl or url for ${streamType}`, { url, videoEl });
            setError(`Missing video element or URL for ${streamType}`);
            return;
        }

        if (videoEl.hls) {
            videoEl.hls.destroy();
            videoEl.hls = null;
        }

        setLoading(true);
        console.log(`Loading ${streamType} stream:`, url);

        if (Hls.isSupported()) {
            const hls = new Hls();
            videoEl.hls = hls;
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
    };

    useEffect(() => {
        console.log("Viewer joining room:", roomId);
        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001");
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("joinSession", roomId);
        });

        socket.on("playbackInfo", ({ canvasPlaybackUrl: newCanvasUrl, webcamPlaybackUrl: newWebcamUrl }) => {
            console.log("Received playbackUrls:", { newCanvasUrl, newWebcamUrl });
            setError(null);
            toast.success("Received stream URLs");

            if (newCanvasUrl !== canvasPlaybackUrl) {
                setCanvasPlaybackUrl(newCanvasUrl);
                if (newCanvasUrl) {
                    loadPlayback(newCanvasUrl, canvasVideoRef.current, 'canvas');
                } else if (canvasVideoRef.current) {
                    if (canvasVideoRef.current.hls) {
                        canvasVideoRef.current.hls.destroy();
                        canvasVideoRef.current.hls = null;
                    }
                    canvasVideoRef.current.src = '';
                    canvasVideoRef.current.pause();
                }
            }

            if (newWebcamUrl !== webcamPlaybackUrl) {
                setWebcamPlaybackUrl(newWebcamUrl);
                if (newWebcamUrl) {
                    loadPlayback(newWebcamUrl, webcamVideoRef.current, 'webcam');
                } else if (webcamVideoRef.current) {
                    if (webcamVideoRef.current.hls) {
                        webcamVideoRef.current.hls.destroy();
                        webcamVideoRef.current.hls = null;
                    }
                    webcamVideoRef.current.src = '';
                    webcamVideoRef.current.pause();
                }
            }
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
            if (canvasVideoRef.current?.hls) {
                canvasVideoRef.current.hls.destroy();
                canvasVideoRef.current.hls = null;
            }
            if (webcamVideoRef.current?.hls) {
                webcamVideoRef.current.hls.destroy();
                webcamVideoRef.current.hls = null;
            }
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
            <div className="absolute top-4 right-4 text-white text-xs">
                👀 {viewerCount} viewer{viewerCount === 1 ? "" : "s"}
            </div>
        </div>
    );
}