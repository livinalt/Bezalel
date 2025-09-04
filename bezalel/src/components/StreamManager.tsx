
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { Canvas as FabricJSCanvas } from "fabric";

interface StreamManagerProps {
    isStreaming: boolean;
    useWebcam: boolean;
    aiPrompt: string;
    roomId: string;
    socketRef: React.MutableRefObject<Socket | null>;
    canvasRef: React.MutableRefObject<FabricJSCanvas | null>;
    setStreamId: React.Dispatch<React.SetStateAction<string | null>>;
    onEnhance: () => void;
    setUseWebcam: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function StreamManager({
    isStreaming,
    useWebcam,
    aiPrompt,
    roomId,
    socketRef,
    canvasRef,
    setStreamId,
    onEnhance,
    setUseWebcam,
}: StreamManagerProps) {
    const canvasVideoRef = useRef<HTMLVideoElement | null>(null);
    const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [localStreamId, setLocalStreamId] = useState<string | null>(null);

    // Daydream API Configuration
    const DAYDREAM_API_URL = "https://api.daydream.live/v1/streams";
    const DAYDREAM_API_TOKEN = process.env.NEXT_PUBLIC_DAYDREAM_API_TOKEN || "<your-api-token>";

    // Sync localStreamId with parent
    useEffect(() => {
        setStreamId(localStreamId);
    }, [localStreamId, setStreamId]);

    // Retry with exponential backoff
    const retryWithBackoff = async (fn: () => Promise<Response>, maxRetries: number = 3, delay: number = 1000) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fn();
                if (response.status === 429) {
                    console.log(`Retrying due to rate limit, attempt: ${i + 1}/${maxRetries}`);
                    await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
                    continue;
                }
                return response;
            } catch (err: any) {
                if (i === maxRetries - 1) throw err;
            }
        }
        throw new Error("Retry attempts exhausted");
    };

    // Handle AI enhancement
    const handleEnhance = async () => {
        if (!localStreamId) {
            toast.info("Please start streaming first.");
            return;
        }
        if (!aiPrompt) {
            toast.info("Please enter an AI prompt.");
            return;
        }

        try {
            // Check stream status
            const statusResponse = await fetch(`${DAYDREAM_API_URL}/${localStreamId}`, {
                headers: { Authorization: `Bearer ${DAYDREAM_API_TOKEN}` },
            });
            const statusData = await statusResponse.json().catch(() => ({}));
            if (!statusResponse.ok || !statusData.isActive) {
                throw new Error(statusData.error || statusData.message || "Stream is not active");
            }

            // Ensure proper prompt format
            const enhancedPrompt = aiPrompt.includes("::") ? aiPrompt : `${aiPrompt} :: neutral backdrop`;

            const response = await retryWithBackoff(() =>
                fetch(`${DAYDREAM_API_URL}/${localStreamId}`, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${DAYDREAM_API_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        pipeline_params: { prompt: enhancedPrompt },
                    }),
                })
            );

            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                toast.success("AI visual enhancement applied!");
                onEnhance();
            } else {
                throw new Error(data.error || data.message || `Enhancement failed with status ${response.status}`);
            }
        } catch (err) {
            toast.error(`Failed to apply AI enhancement: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
    };

    // Toggle mute/unmute for webcam audio
    const toggleMute = () => {
        if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks();
            audioTracks.forEach((track) => {
                track.enabled = !isMuted;
            });
            setIsMuted(!isMuted);
            toast.success(isMuted ? "Audio unmuted" : "Audio muted");
        }
    };

    // Create stream (memoized to prevent unnecessary calls)
    const createStream = useCallback(
        async (stream: MediaStream, prompt: string) => {
            try {
                console.log("Environment DAYDREAM_API_TOKEN:", process.env.NEXT_PUBLIC_DAYDREAM_API_TOKEN);
                console.log("Daydream API Token:", DAYDREAM_API_TOKEN);
                const response = await retryWithBackoff(() =>
                    fetch(DAYDREAM_API_URL, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${DAYDREAM_API_TOKEN}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            pipeline_params: {
                                prompt: prompt || "default canvas stream :: neutral backdrop",
                            },
                            name: `BezalelBoard-${roomId}-${Date.now()}`,
                            output_rtmp_url: "",
                        }),
                    })
                );

                console.log("Daydream API Response:", response.status, response.statusText);
                const data = await response.json().catch(() => ({}));
                console.log("Daydream create response:", JSON.stringify(data, null, 2));
                if (response.ok) {
                    setLocalStreamId(data.id);
                    return { whipUrl: data.whip_url, playbackUrl: `https://cdn.livepeer.com/hls/${data.output_playback_id}/index.m3u8` };
                } else {
                    throw new Error(
                        data.error || data.message || `Stream creation failed with status ${response.status}: ${response.statusText}`
                    );
                }
            } catch (err) {
                console.error("Daydream API Error:", err);
                toast.error(`Failed to create Daydream stream: ${err instanceof Error ? err.message : "Unknown error"}`);
                return null;
            }
        },
        [DAYDREAM_API_TOKEN, roomId]
    );

    // Publish to WHIP
    const publishToIngest = useCallback(
        async (whipUrl: string, stream: MediaStream) => {
            if (!whipUrl || !stream) {
                toast.error("Missing WHIP URL or stream");
                return;
            }

            try {
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                });
                pcRef.current = pc;

                stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log("ICE candidate:", event.candidate);
                    }
                };

                pc.oniceconnectionstatechange = () => {
                    console.log("ICE connection state:", pc.iceConnectionState);
                    if (pc.iceConnectionState === "failed") {
                        toast.error("Stream publishing failed");
                    }
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                const whipResponse = await fetch(whipUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/sdp" },
                    body: offer.sdp,
                });

                if (!whipResponse.ok) {
                    throw new Error(`WHIP publish failed: ${whipResponse.statusText} (${whipResponse.status})`);
                }

                const answerSdp = await whipResponse.text();
                await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answerSdp }));

                toast.success("Stream publishing started!");
            } catch (err) {
                toast.error(`Failed to publish stream: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
        },
        []
    );

    useEffect(() => {
        if (!isStreaming || !canvasRef.current || !canvasVideoRef.current) return;

        let isActive = true;

        const canvasElement = (canvasRef.current as any).lowerCanvasEl ?? (canvasRef.current as any).getElement?.();
        if (!canvasElement || typeof canvasElement.captureStream !== "function") {
            toast.error("Streaming not supported: unable to capture canvas stream.");
            return;
        }

        const canvasStream = canvasElement.captureStream(30);
        streamRef.current = canvasStream;

        const combineStreams = async () => {
            if (!isActive) return;

            if (!useWebcam) {
                streamRef.current = canvasStream;
                canvasVideoRef.current!.srcObject = canvasStream;
                if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
                const result = await createStream(canvasStream, aiPrompt);
                if (result && isActive) {
                    await publishToIngest(result.whipUrl, canvasStream);
                    socketRef.current?.emit("playbackInfo", { playbackUrl: result.playbackUrl, roomId });
                    canvasVideoRef.current!.srcObject = canvasStream;
                }
                return;
            }

            try {
                const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!isActive) return;
                const combined = new MediaStream();
                canvasStream.getVideoTracks().forEach((t) => combined.addTrack(t));
                webcamStream.getVideoTracks().forEach((t) => combined.addTrack(t));
                webcamStream.getAudioTracks().forEach((t) => {
                    combined.addTrack(t);
                    t.enabled = !isMuted;
                });
                streamRef.current = combined;
                canvasVideoRef.current!.srcObject = canvasStream;
                if (webcamVideoRef.current) webcamVideoRef.current.srcObject = webcamStream;
                const result = await createStream(combined, aiPrompt);
                if (result && isActive) {
                    await publishToIngest(result.whipUrl, combined);
                    socketRef.current?.emit("playbackInfo", { playbackUrl: result.playbackUrl, roomId });
                    canvasVideoRef.current!.srcObject = canvasStream;
                }
            } catch {
                if (isActive) {
                    toast.error("Could not access webcam — streaming canvas only.");
                    streamRef.current = canvasStream;
                    canvasVideoRef.current!.srcObject = canvasStream;
                    if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
                    const result = await createStream(canvasStream, aiPrompt);
                    if (result && isActive) {
                        await publishToIngest(result.whipUrl, canvasStream);
                        socketRef.current?.emit("playbackInfo", { playbackUrl: result.playbackUrl, roomId });
                        canvasVideoRef.current!.srcObject = canvasStream;
                    }
                }
            }
        };

        combineStreams();

        return () => {
            isActive = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            if (canvasVideoRef.current) {
                canvasVideoRef.current.srcObject = null;
            }
            if (webcamVideoRef.current) {
                webcamVideoRef.current.srcObject = null;
            }
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            // No DELETE request, as it returns 405
            setLocalStreamId(null);
        };
    }, [isStreaming, useWebcam, roomId, socketRef, canvasRef, createStream, publishToIngest, isMuted]);

    return (
        <>
            {isStreaming && (
                <aside className="w-64 p-3 border-l border-gray-100 bg-white/60 dark:bg-zinc-800/60">
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-gray-700 dark:text-gray-300">Canvas Stream</label>
                            <video ref={canvasVideoRef} autoPlay muted className="w-full h-40 rounded-md object-cover" />
                        </div>
                        {useWebcam && (
                            <div>
                                <label className="text-xs text-gray-700 dark:text-gray-300">Webcam Preview</label>
                                <video ref={webcamVideoRef} autoPlay className="w-full h-40 rounded-md object-cover" />
                            </div>
                        )}
                        <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useWebcam}
                                onChange={(e) => setUseWebcam(e.target.checked)}
                                className="w-4 h-4 accent-blue-500"
                            />
                            <span>Use Webcam</span>
                        </label>
                        {useWebcam && (
                            <button
                                onClick={toggleMute}
                                className="flex items-center gap-2 px-2 py-1 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
                            >
                                {isMuted ? "Unmute Audio" : "Mute Audio"}
                            </button>
                        )}
                        <button
                            onClick={handleEnhance}
                            className="flex items-center gap-2 px-2 py-1 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
                        >
                            Enhance with AI
                        </button>
                    </div>
                </aside>
            )}
        </>
    );
}