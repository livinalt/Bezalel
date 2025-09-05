// components/VideoFeed.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";

interface VideoFeedProps {
    stream: MediaStream | null;
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    isMuted: boolean;
    setIsMuted: (value: boolean) => void;
}

export default function VideoFeed({ stream, useWebcam, setUseWebcam, isMuted, setIsMuted }: VideoFeedProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 200 });
    const [error, setError] = useState<string | null>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (typeof window !== "undefined") {
            setPosition({ x: 20, y: window.innerHeight - 200 });
        }
    }, []);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((err) => {
                console.error("Video play error:", err);
                setError("Failed to play video stream");
                toast.error("Failed to play video stream");
            });
        } else if (videoRef.current && !stream) {
            videoRef.current.srcObject = null;
        }
    }, [stream]);

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
    };

    const toggleMute = () => {
        if (stream) {
            const audioTracks = stream.getAudioTracks();
            audioTracks.forEach((track) => (track.enabled = !track.enabled));
            setIsMuted(!isMuted);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`fixed z-40 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg transition-all duration-200 ${collapsed ? "w-12 h-12" : "w-64 h-48"
                }`}
            style={{ left: position.x, top: position.y, cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {collapsed ? (
                <button
                    className="w-full h-full flex items-center justify-center text-gray-800 dark:text-gray-200"
                    onClick={() => setCollapsed(false)}
                >
                    <Video className="w-6 h-6" />
                </button>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-zinc-700">
                        <span className="text-xs text-gray-800 dark:text-gray-200">Video Feed</span>
                        <div className="flex gap-2">
                            <button
                                onClick={toggleWebcam}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                                title={useWebcam ? "Disable Webcam" : "Enable Webcam"}
                            >
                                {useWebcam ? (
                                    <Video className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                                ) : (
                                    <VideoOff className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                                )}
                            </button>
                            <button
                                onClick={toggleMute}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? (
                                    <MicOff className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                                ) : (
                                    <Mic className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                                )}
                            </button>
                            <button
                                onClick={() => setCollapsed(true)}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                                title="Collapse"
                            >
                                <span className="text-xs text-gray-800 dark:text-gray-200">-</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs">
                                {error}
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            className={`w-full h-full object-cover rounded-b-xl ${error ? "opacity-50" : ""}`}
                            autoPlay
                            muted={isMuted}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}