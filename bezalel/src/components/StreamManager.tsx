"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { Copy, Video, X } from "lucide-react";

interface StreamManagerProps {
    roomId: string;
    setCanvasPlaybackUrl: (url: string | null) => void;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
    setStreamId: (value: string | null) => void;
    playbackUrl: string;
    showStreamDetails: boolean;
    setShowStreamDetails: (value: boolean) => void;
}

export default function StreamManager({
    roomId,
    setCanvasPlaybackUrl,
    isStreaming,
    setIsStreaming,
    setStreamId,
    playbackUrl,
    showStreamDetails,
    setShowStreamDetails,
}: StreamManagerProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [modal, setModal] = useState<{ type: "start" | "stop" | null }>({ type: null });

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001");
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (isStreaming && modal.type !== "start") {
            setModal({ type: "start" });
        } else if (!isStreaming && modal.type !== "stop" && modal.type !== null) {
            setModal({ type: "stop" });
        }
    }, [isStreaming]);

    const handleStartStreaming = () => {
        setIsStreaming(true);
        setModal({ type: null });
    };

    const handleStopStreaming = () => {
        setIsStreaming(false);
        setCanvasPlaybackUrl(null);
        setStreamId(null);
        setModal({ type: null });
        setShowStreamDetails(false);
        toast.success("Streaming stopped successfully!");
    };

    const copyPlaybackUrl = () => {
        if (playbackUrl) {
            navigator.clipboard.writeText(playbackUrl);
            toast.success("Playback URL copied to clipboard!");
        }
    };

    useEffect(() => {
        if (socket && playbackUrl) {
            socket.emit("updateCanvasPlaybackUrl", { roomId, url: playbackUrl });
        }
    }, [socket, playbackUrl, roomId]);

    return (
        <>
            {/* Start/Stop Modal */}
            {modal.type && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 mx-4 sm:mx-0">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {modal.type === "start" ? "Start Livestream" : "End Livestream"}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {modal.type === "start"
                                ? "Do you want to proceed with broadcasting your canvas live?"
                                : "This will end your live broadcast."}
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                className="px-6 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
                                onClick={() => {
                                    if (modal.type === "start") {
                                        setIsStreaming(false);
                                    }
                                    setModal({ type: null });
                                }}
                            >
                                {modal.type === "start" ? "No" : "Cancel"}
                            </button>
                            <button
                                className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                                onClick={() => {
                                    if (modal.type === "start") {
                                        handleStartStreaming();
                                    } else {
                                        handleStopStreaming();
                                    }
                                }}
                            >
                                {modal.type === "start" ? "Yes" : "End"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stream Details Modal */}
            {showStreamDetails && playbackUrl && (
                <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 mx-4 sm:mx-0">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Stream Details</h2>
                            <button
                                className="p-2 rounded-full hover:bg-gray-100"
                                onClick={() => setShowStreamDetails(false)}
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex justify-center mb-4">
                            <Video className="w-12 h-12 text-blue-600" />
                        </div>
                        <p className="text-gray-600 mb-6 text-center">
                            Share this link to let viewers watch your canvas stream:
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Playback URL</label>
                                <div className="flex items-center mt-1">
                                    <code className="flex-1 text-sm bg-gray-100 rounded-md px-3 py-2 font-mono truncate">
                                        {playbackUrl}
                                    </code>
                                    <button
                                        onClick={copyPlaybackUrl}
                                        className="ml-2 p-2 rounded-md hover:bg-gray-100"
                                    >
                                        <Copy className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-6">
                            <button
                                className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                                onClick={() => setShowStreamDetails(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}