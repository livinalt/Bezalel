"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";

interface VideoFeedProps {
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    isMuted: boolean;
    setIsMuted: (value: boolean) => void;
    onStreamChange: (stream: MediaStream | null) => void;
    isEnhanced: boolean;
    enhanceWebcam: boolean;
    webcamPlaybackUrl: string | null;
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
}: VideoFeedProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Cleanup helper to stop tracks
    const stopStream = useCallback((stream: MediaStream | null) => {
        stream?.getTracks().forEach((t) => t.stop());
    }, []);

    // Request webcam only when toggled on
    useEffect(() => {
        let stream: MediaStream | null = null;

        if (useWebcam && !isEnhanced) {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((s) => {
                    stream = s;
                    setLocalStream(s);
                    onStreamChange(s);

                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                        videoRef.current.play().catch(() => { });
                    }
                })
                .catch((err) => {
                    console.error("Webcam error:", err);
                    setError("Could not access webcam");
                    toast.error("Could not access webcam");
                    setUseWebcam(false);
                });
        } else {
            setLocalStream(null);
            onStreamChange(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }

        return () => {
            stopStream(stream);
        };
    }, [useWebcam, isEnhanced, onStreamChange, setUseWebcam, stopStream]);

    // Mute/unmute tracks
    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = !isMuted;
            });
        }
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted, localStream]);

    // Enhanced (HLS playback)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isEnhanced && enhanceWebcam && webcamPlaybackUrl) {
            import("hls.js").then(({ default: Hls }) => {
                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hls.loadSource(webcamPlaybackUrl);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        video.play().catch(() => setError("Failed to play stream"));
                    });
                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = webcamPlaybackUrl;
                    video.addEventListener("loadedmetadata", () => {
                        video.play().catch(() => setError("Failed to play stream"));
                    });
                } else {
                    setError("HLS not supported in this browser");
                }
            });
        }
    }, [isEnhanced, enhanceWebcam, webcamPlaybackUrl]);

    return (
        <div className="relative w-full h-full bg-black">
            {/* Video */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className={`w-full h-full object-cover ${error ? "opacity-40" : ""}`}
            />

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-red-500 text-sm px-4 text-center">
                    {error}
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-3 rounded-full bg-gray-900/80 text-white hover:bg-gray-700 shadow"
                >
                    {isMuted ? (
                        <MicOff className="w-6 h-6" />
                    ) : (
                        <Mic className="w-6 h-6" />
                    )}
                </button>
                <button
                    onClick={() => setUseWebcam(!useWebcam)}
                    className="p-3 rounded-full bg-gray-900/80 text-white hover:bg-gray-700 shadow"
                >
                    {useWebcam ? (
                        <Video className="w-6 h-6" />
                    ) : (
                        <VideoOff className="w-6 h-6" />
                    )}
                </button>
            </div>
        </div>
    );
}
