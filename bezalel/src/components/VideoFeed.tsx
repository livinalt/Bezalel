
"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, Pencil } from "lucide-react";
import { toast } from "sonner";

interface VideoFeedProps {
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    isMuted: boolean;
    setIsMuted: (value: boolean) => void;
    onStreamChange: (stream: MediaStream | null) => void;
    isEnhanced: boolean;
    enhanceWebcam: boolean; // New prop for webcam enhancement toggle
    webcamPlaybackUrl: string | null;
    canvasPlaybackUrl: string | null;
}

export default function VideoFeed({
    useWebcam,
    setUseWebcam,
    isMuted,
    setIsMuted,
    onStreamChange,
    isEnhanced,
    enhanceWebcam,
    webcamPlaybackUrl,
    canvasPlaybackUrl,
}: VideoFeedProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 200 });
    const [error, setError] = useState<string | null>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [displayMode, setDisplayMode] = useState<"webcam" | "canvas">("webcam");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setPosition({ x: 20, y: window.innerHeight - 200 });
        }
    }, []);

    useEffect(() => {
        let stream: MediaStream | null = null;
        if (useWebcam) {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((s) => {
                    stream = s;
                    setLocalStream(s);
                    onStreamChange(s);
                })
                .catch((err) => {
                    console.error("Webcam access error:", err);
                    setError("Could not access webcam");
                    toast.error("Could not access webcam");
                    setUseWebcam(false);
                });
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            setLocalStream(null);
            onStreamChange(null);
        };
    }, [useWebcam, onStreamChange]);

    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => (track.enabled = !isMuted));
        }
    }, [isMuted, localStream]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const loadStream = async (url: string, retries: number = 3, delay: number = 2000) => {
            for (let i = 0; i < retries; i++) {
                try {
                    await import("hls.js").then(({ default: Hls }) => {
                        if (Hls.isSupported()) {
                            const hls = new Hls();
                            hls.loadSource(url);
                            hls.attachMedia(video);
                            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                                console.log(`HLS manifest parsed for ${displayMode}`);
                                video.play().catch((err) => {
                                    console.error(`Enhanced playback failed for ${displayMode}:`, err);
                                    setError(`Failed to play enhanced ${displayMode} stream`);
                                });
                            });
                            hls.on(Hls.Events.ERROR, (event, data) => {
                                console.error(`HLS error for ${displayMode}:`, data);
                                if (data.fatal) {
                                    setError(`Failed to load enhanced ${displayMode} stream`);
                                }
                            });
                        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                            console.log(`Using native HLS for ${displayMode}:`, url);
                            video.src = url;
                            video.addEventListener("loadedmetadata", () => {
                                video.play().catch((err) => {
                                    console.error(`Native enhanced playback failed for ${displayMode}:`, err);
                                    setError(`Failed to play enhanced ${displayMode} stream`);
                                });
                            });
                        } else {
                            setError("HLS not supported");
                        }
                    });
                    return;
                } catch (err) {
                    console.error(`Retry ${i + 1}/${retries} failed for ${displayMode}:`, err);
                    if (i < retries - 1) {
                        await new Promise((resolve) => setTimeout(resolve, delay));
                    }
                }
            }
            setError(`Failed to load ${displayMode} stream after retries`);
        };

        if (displayMode === "webcam" && useWebcam && enhanceWebcam && isEnhanced && webcamPlaybackUrl) {
            setError(null);
            loadStream(webcamPlaybackUrl);
            video.muted = isMuted;
        } else if (displayMode === "canvas" && canvasPlaybackUrl) {
            setError(null);
            loadStream(canvasPlaybackUrl);
            video.muted = true; // Canvas stream typically has no audio
        } else if (displayMode === "webcam" && useWebcam && localStream) {
            video.srcObject = localStream;
            video.muted = false; // Control via track
            video.play().catch((err) => {
                console.error("Local video play error:", err);
                setError("Failed to play local video stream");
            });
        } else {
            video.srcObject = null;
        }

        return () => {
            video.srcObject = null;
        };
    }, [localStream, isEnhanced, enhanceWebcam, webcamPlaybackUrl, canvasPlaybackUrl, isMuted, displayMode, useWebcam]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (containerRef.current) {
            setIsDragging(true);
            dragStartPos.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && containerRef.current) {
            const newX = e.clientX - dragStartPos.current.x;
            const newY = e.clientY - dragStartPos.current.y;
            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const toggleWebcam = () => {
        setUseWebcam(!useWebcam);
        if (!useWebcam) {
            setDisplayMode("webcam");
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div
            ref={containerRef}
            className={`fixed z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/60 dark:border-zinc-700/60 rounded-xl shadow-md transition-all duration-200 overflow-hidden ${
                collapsed ? "w-10 h-10" : "w-64 h-44"
            }`}
            style={{ left: position.x, top: position.y, cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {collapsed ? (
                <button
                    className="w-full h-full flex items-center justify-center text-gray-700 dark:text-gray-200"
                    onClick={() => setCollapsed(false)}
                >
                    <Video className="w-5 h-5" />
                </button>
            ) : (
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200/60 dark:border-zinc-700/60">
                        <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                            {displayMode === "webcam" ? "Webcam" : "Canvas"}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setDisplayMode("webcam")}
                                className={`p-1 rounded-md ${
                                    displayMode === "webcam" ? "bg-gray-100 dark:bg-zinc-800" : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                                }`}
                            >
                                <Video className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                            </button>
                            <button
                                onClick={() => setDisplayMode("canvas")}
                                className={`p-1 rounded-md ${
                                    displayMode === "canvas" ? "bg-gray-100 dark:bg-zinc-800" : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                                }`}
                            >
                                <Pencil className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                            </button>
                            <button
                                onClick={toggleWebcam}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                            >
                                {useWebcam ? (
                                    <Video className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                ) : (
                                    <VideoOff className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                )}
                            </button>
                            <button
                                onClick={toggleMute}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                            >
                                {isMuted ? (
                                    <MicOff className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                ) : (
                                    <Mic className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                )}
                            </button>
                            <button
                                onClick={() => setCollapsed(true)}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                            >
                                <span className="text-[10px] text-gray-700 dark:text-gray-200">–</span>
                            </button>
                        </div>
                    </div>

                    {/* Video Area */}
                    <div className="flex-1 relative bg-black/5 dark:bg-zinc-950/40">
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs px-2 text-center">
                                {error === "Failed to load enhanced stream" ? "Could not load stream" : error}
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            className={`w-full h-full object-cover ${error ? "opacity-40" : ""}`}
                            autoPlay
                        />
                    </div>
                </div>
            )}
        </div>
    );
}