"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { Canvas as FabricJSCanvas, Path } from "fabric";

interface ExtendedFabricCanvas extends FabricJSCanvas {
    lowerCanvasEl: HTMLCanvasElement;
}

interface StreamManagerProps {
    isStreaming: boolean;
    useWebcam: boolean;
    aiPrompt: string;
    roomId: string;
    socketRef: React.MutableRefObject<Socket | null>;
    canvasRef: React.MutableRefObject<FabricJSCanvas | null>;
    setStreamId: (id: string | null) => void;
    setUseWebcam: (value: boolean) => void;
    setStreamState: (state: { stream: MediaStream | null; isMuted: boolean }) => void;
}

export default function StreamManager({
    isStreaming,
    useWebcam,
    aiPrompt,
    roomId,
    socketRef,
    canvasRef,
    setStreamId,
    setUseWebcam,
    setStreamState,
}: StreamManagerProps) {
    const streamRef = useRef<MediaStream | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [localStreamId, setLocalStreamId] = useState<string | null>(null);
    const [enhanceStreamId, setEnhanceStreamId] = useState<string | null>(null);

    const DAYDREAM_API_URL = "https://api.daydream.live/v1/streams";
    const DAYDREAM_API_TOKEN = process.env.NEXT_PUBLIC_DAYDREAM_API_TOKEN || "";

    useEffect(() => {
        setStreamId(localStreamId);
    }, [localStreamId, setStreamId]);

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
            } catch (err: unknown) {
                if (i === maxRetries - 1) throw err;
            }
        }
        throw new Error("Retry attempts exhausted");
    };

    const createStream = useCallback(
        async (stream: MediaStream | null, prompt: string, forEnhanceOnly: boolean = false) => {
            try {
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

                const data = await response.json().catch(() => ({}));
                if (response.ok) {
                    const result = {
                        id: data.id,
                        whipUrl: data.whip_url,
                        playbackUrl: `https://cdn.livepeer.com/hls/${data.output_playback_id}/index.m3u8`,
                    };
                    if (!forEnhanceOnly && stream) {
                        await publishToIngest(result.whipUrl, stream);
                        socketRef.current?.emit("playbackInfo", { playbackUrl: result.playbackUrl, roomId });
                    }
                    return result;
                }
                throw new Error(data.error || data.message || `Stream creation failed with status ${response.status}`);
            } catch (err) {
                console.error("Daydream API Error:", err);
                toast.error(`Failed to create stream: ${err instanceof Error ? err.message : "Unknown error"}`);
                return null;
            }
        },
        [DAYDREAM_API_TOKEN, roomId, socketRef]
    );

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
                    if (event.candidate) console.log("ICE candidate:", event.candidate);
                };

                pc.oniceconnectionstatechange = () => {
                    console.log("ICE connection state:", pc.iceConnectionState);
                    if (pc.iceConnectionState === "failed") toast.error("Stream publishing failed");
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

    const applyEnhancementToCanvas = useCallback(
        async (playbackUrl: string) => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current as ExtendedFabricCanvas;

            try {
                const response = await fetch(playbackUrl);
                if (!response.ok) throw new Error("Failed to fetch enhanced stream");
                canvas.getObjects("path").forEach((obj: Path) => {
                    if (aiPrompt.includes("cartoon")) {
                        obj.set({ strokeWidth: obj.strokeWidth ? obj.strokeWidth * 1.5 : 5, opacity: 0.8 });
                    } else if (aiPrompt.includes("sketch")) {
                        obj.set({ stroke: "#555", opacity: 0.6 });
                    } else {
                        obj.set({ opacity: 0.9 });
                    }
                });
                canvas.renderAll();
                toast.success(`AI enhancement applied to canvas: ${aiPrompt}`);
            } catch (err) {
                toast.error(`Failed to apply enhancement: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
        },
        [aiPrompt]
    );

    const handleEnhance = async () => {
        if (!aiPrompt) {
            toast.info("Please enter an AI prompt.");
            return;
        }
        if (!canvasRef.current) {
            toast.error("Canvas is not initialized. Please try again.");
            return;
        }
        if (!canvasRef.current.lowerCanvasEl) {
            toast.error("Canvas rendering context is not available.");
            return;
        }

        const canvas = canvasRef.current as ExtendedFabricCanvas;
        const canvasStream = canvas.lowerCanvasEl.captureStream(30);

        try {
            const enhancedPrompt = aiPrompt.includes("::") ? aiPrompt : `${aiPrompt} :: neutral backdrop`;
            const streamIdToUse = isStreaming && localStreamId ? localStreamId : enhanceStreamId;

            if (streamIdToUse) {
                const response = await retryWithBackoff(() =>
                    fetch(`${DAYDREAM_API_URL}/${streamIdToUse}`, {
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
                if (!response.ok) {
                    throw new Error(data.error || data.message || `Enhancement failed with status ${response.status}`);
                }

                const playbackUrl = `https://cdn.livepeer.com/hls/${data.output_playback_id}/index.m3u8`;
                await applyEnhancementToCanvas(playbackUrl);
            } else {
                const result = await createStream(canvasStream, enhancedPrompt, true);
                if (result) {
                    setEnhanceStreamId(result.id);
                    await applyEnhancementToCanvas(result.playbackUrl);
                }
            }
        } catch (err) {
            toast.error(`Failed to apply AI enhancement: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            canvasStream.getTracks().forEach((track) => track.stop());
        }
    };

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.on("enhance", ({ aiPrompt: prompt, roomId: id }) => {
            if (id === roomId) {
                setAiPrompt(prompt);
                handleEnhance();
            }
        });

        return () => {
            socket.off("enhance");
        };
    }, [roomId, socketRef, handleEnhance]);

    useEffect(() => {
        if (!isStreaming || !canvasRef.current) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            setLocalStreamId(null);
            setStreamState({ stream: null, isMuted });
            socketRef.current?.emit("stopStream", { roomId });
            return;
        }

        const canvas = canvasRef.current as ExtendedFabricCanvas;
        if (!canvas.lowerCanvasEl || typeof canvas.lowerCanvasEl.captureStream !== "function") {
            toast.error("Streaming not supported: unable to capture canvas stream.");
            return;
        }

        const canvasStream = canvas.lowerCanvasEl.captureStream(30);
        streamRef.current = canvasStream;

        const combineStreams = async () => {
            let combined = canvasStream;
            let webcamStream: MediaStream | null = null;

            if (useWebcam) {
                try {
                    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    combined = new MediaStream([
                        ...canvasStream.getVideoTracks(),
                        ...webcamStream.getVideoTracks(),
                        ...webcamStream.getAudioTracks().map((t) => {
                            t.enabled = !isMuted;
                            return t;
                        }),
                    ]);
                    setStreamState({ stream: webcamStream, isMuted });
                } catch (err) {
                    toast.error("Webcam access failed; streaming canvas only.");
                    setStreamState({ stream: null, isMuted });
                }
            } else {
                setStreamState({ stream: null, isMuted });
            }

            streamRef.current = combined;
            const result = await createStream(combined, aiPrompt);
            if (result) {
                setLocalStreamId(result.id);
            }
        };

        combineStreams();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            setLocalStreamId(null);
            setStreamState({ stream: null, isMuted });
            socketRef.current?.emit("stopStream", { roomId });
        };
    }, [isStreaming, useWebcam, aiPrompt, roomId, canvasRef, createStream, socketRef, isMuted, setStreamState]);

    useEffect(() => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = !isMuted;
            });
            setStreamState({ stream: streamRef.current.getVideoTracks().length > 1 ? streamRef.current : null, isMuted });
        }
    }, [isMuted, setStreamState]);

    useEffect(() => {
        return () => {
            if (enhanceStreamId && !isStreaming) {
                fetch(`${DAYDREAM_API_URL}/${enhanceStreamId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${DAYDREAM_API_TOKEN}` },
                }).catch((err) => console.error("Failed to delete enhancement stream:", err));
                setEnhanceStreamId(null);
            }
        };
    }, [enhanceStreamId, isStreaming]);

    return null; // No UI rendered
}