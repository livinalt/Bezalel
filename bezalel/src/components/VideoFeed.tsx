"use client";

import { useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff, Minimize2, Maximize2 } from "lucide-react";

interface VideoFeedProps {
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    isMuted: boolean;
    setIsMuted: (value: boolean) => void;
    onStreamChange?: (stream: MediaStream | null) => void;
    isEnhanced?: boolean;
    enhanceWebcam?: boolean;
    webcamPlaybackUrl?: string | null;
    isMinimized: boolean;
    setIsMinimized: (v: boolean) => void;
}

export default function VideoFeed({
    useWebcam,
    setUseWebcam,
    isMuted,
    setIsMuted,
    onStreamChange,
    webcamPlaybackUrl,
    isMinimized,
    setIsMinimized,
}: VideoFeedProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (!useWebcam) {
            if (onStreamChange) onStreamChange(null);
            return;
        }

        const startStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                if (onStreamChange) onStreamChange(stream);
            } catch (err) {
                console.error("Error accessing webcam:", err);
            }
        };

        startStream();

        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream)
                    .getTracks()
                    .forEach((track) => track.stop());
            }
        };
    }, [useWebcam, onStreamChange]);

    return (
        <div className="relative w-full h-full bg-black">
            {/* Camera feed */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
            />

            {/* Floating controls */}
            <div
                className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 px-2 py-1 rounded-lg bg-black/50 transition ${isMinimized ? "scale-75 opacity-90" : ""
                    }`}
            >
                <button
                    onClick={() => setUseWebcam(!useWebcam)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
                >
                    {useWebcam ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
                >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
                >
                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
            </div>
        </div>
    );
}
