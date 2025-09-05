
"use client";

import { forwardRef, useEffect, useRef, useState, useCallback, RefAttributes, useImperativeHandle } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { Canvas as FabricJSCanvas } from "fabric";

// Extend fabric.Canvas with compatible types
interface ExtendedFabricCanvas extends FabricJSCanvas {
    lowerCanvasEl: HTMLCanvasElement;
    getElement: () => HTMLCanvasElement;
}

interface StreamManagerProps extends RefAttributes<{ handleEnhance: () => Promise<void>; handleCanvasEnhance: () => Promise<void> }> {
    isStreaming: boolean;
    useWebcam: boolean;
    enhanceWebcam: boolean; // New prop for webcam enhancement toggle
    aiPrompt: string;
    roomId: string;
    socketRef: React.MutableRefObject<Socket | null>;
    canvasRef: React.MutableRefObject<FabricJSCanvas | null>;
    setStreamId: React.Dispatch<React.SetStateAction<string | null>>;
    webcamStream: MediaStream | null;
    setWebcamPlaybackUrl: React.Dispatch<React.SetStateAction<string | null>>;
    setIsEnhanced: React.Dispatch<React.SetStateAction<boolean>>;
    setCanvasPlaybackUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

const StreamManager = forwardRef<{ handleEnhance: () => Promise<void>; handleCanvasEnhance: () => Promise<void> }, StreamManagerProps>(
    (
        {
            isStreaming,
            useWebcam,
            enhanceWebcam,
            aiPrompt,
            roomId,
            socketRef,
            canvasRef,
            setStreamId,
            webcamStream,
            setWebcamPlaybackUrl,
            setIsEnhanced,
            setCanvasPlaybackUrl,
        },
        ref
    ) => {
        const streamRef = useRef<MediaStream | null>(null);
        const canvasPcRef = useRef<RTCPeerConnection | null>(null);
        const webcamPcRef = useRef<RTCPeerConnection | null>(null);
        const [webcamStreamId, setWebcamStreamId] = useState<string | null>(null);
        const [canvasStreamId, setCanvasStreamId] = useState<string | null>(null);
        const [isCanvasEnhanced, setIsCanvasEnhanced] = useState(false);

        // Daydream API Configuration
        const DAYDREAM_API_URL = "https://api.daydream.live/v1/streams";
        const DAYDREAM_API_TOKEN = process.env.NEXT_PUBLIC_DAYDREAM_API_TOKEN || "<your-api-token>";

        useImperativeHandle(ref, () => ({
            handleEnhance,
            handleCanvasEnhance,
        }));

        // Sync stream IDs with parent (for debug)
        useEffect(() => {
            setStreamId(webcamStreamId || canvasStreamId);
        }, [webcamStreamId, canvasStreamId, setStreamId]);

        // Close webcam connection when webcamStream is null
        useEffect(() => {
            if (!webcamStream) {
                if (webcamPcRef.current) {
                    webcamPcRef.current.close();
                    webcamPcRef.current = null;
                }
                setWebcamStreamId(null);
                setWebcamPlaybackUrl(null);
                setIsEnhanced(false);
            }
        }, [webcamStream, setWebcamPlaybackUrl, setIsEnhanced]);

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
                } catch (err: unknown) {
                    if (i === maxRetries - 1) throw err;
                }
            }
            throw new Error("Retry attempts exhausted");
        };

        // Create stream
        const createStream = useCallback(
            async (stream: MediaStream, prompt: string, streamType: 'canvas' | 'webcam') => {
                try {
                    console.log(`Creating ${streamType} stream with prompt:`, prompt);
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
                                name: `BezalelBoard-${roomId}-${streamType}-${Date.now()}`,
                                output_rtmp_url: "",
                            }),
                        })
                    );

                    console.log(`${streamType} API Response Status:`, response.status, response.statusText);
                    const data = await response.json().catch(() => ({}));
                    console.log(`${streamType} create response data:`, JSON.stringify(data, null, 2));
                    if (response.ok) {
                        return { id: data.id, whipUrl: data.whip_url, playbackUrl: `https://cdn.livepeer.com/hls/${data.output_playback_id}/index.m3u8` };
                    } else {
                        throw new Error(
                            data.error || data.message || `${streamType} stream creation failed with status ${response.status}: ${response.statusText}`
                        );
                    }
                } catch (err) {
                    console.error(`${streamType} API Error:`, err);
                    toast.error(`Failed to create ${streamType} stream: ${err instanceof Error ? err.message : "Unknown error"}`);
                    return null;
                }
            },
            [DAYDREAM_API_TOKEN, roomId]
        );

        // Publish to WHIP
        const publishToIngest = useCallback(
            async (whipUrl: string, stream: MediaStream, pcRef: React.MutableRefObject<RTCPeerConnection | null>, streamType: 'canvas' | 'webcam') => {
                if (!whipUrl || !stream) {
                    console.error(`Missing WHIP URL or stream for ${streamType}:`, { whipUrl, stream });
                    toast.error(`Missing WHIP URL or stream for ${streamType}`);
                    return;
                }

                if (typeof window === "undefined") {
                    console.warn(`Skipping ${streamType} WHIP publishing on server-side`);
                    return;
                }

                try {
                    console.log(`Publishing ${streamType} to WHIP URL:`, whipUrl);
                    const pc = new RTCPeerConnection({
                        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    });
                    pcRef.current = pc;

                    stream.getTracks().forEach((track) => {
                        console.log(`Adding ${streamType} track:`, track);
                        pc.addTrack(track, stream);
                    });

                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            console.log(`${streamType} ICE candidate:`, event.candidate);
                        }
                    };

                    pc.oniceconnectionstatechange = () => {
                        console.log(`${streamType} ICE connection state:`, pc.iceConnectionState);
                        if (pc.iceConnectionState === "failed") {
                            toast.error(`${streamType} stream publishing failed`);
                        }
                    };

                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    console.log(`Sending ${streamType} WHIP offer`);
                    const whipResponse = await fetch(whipUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/sdp" },
                        body: offer.sdp,
                    });

                    console.log(`${streamType} WHIP response status:`, whipResponse.status, whipResponse.statusText);
                    if (!whipResponse.ok) {
                        throw new Error(`WHIP publish failed for ${streamType}: ${whipResponse.statusText} (${whipResponse.status})`);
                    }

                    const answerSdp = await whipResponse.text();
                    await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answerSdp }));

                    console.log(`${streamType} WHIP publishing started successfully`);
                    toast.success(`${streamType} stream publishing started!`);
                } catch (err) {
                    console.error(`${streamType} WHIP publishing error:`, err);
                    toast.error(`Failed to publish ${streamType} stream: ${err instanceof Error ? err.message : "Unknown error"}`);
                }
            },
            []
        );

        // Handle webcam enhancement
        const handleEnhance = async () => {
            if (!aiPrompt) {
                toast.info("Please enter an AI prompt.");
                return;
            }
            if (!useWebcam || !webcamStream) {
                toast.info("Please enable webcam first.");
                return;
            }

            let id = webcamStreamId;
            let playbackUrl: string | null = null;

            if (!id) {
                // Create new webcam stream for enhancement
                const result = await createStream(webcamStream, aiPrompt, 'webcam');
                if (!result) return;

                await publishToIngest(result.whipUrl, webcamStream, webcamPcRef, 'webcam');
                id = result.id;
                playbackUrl = result.playbackUrl;
                setWebcamStreamId(id);
                setWebcamPlaybackUrl(playbackUrl);
                setIsEnhanced(true);
                toast.success("Webcam visual enhancement applied!");
            } else {
                // Update existing webcam stream
                try {
                    const statusResponse = await fetch(`${DAYDREAM_API_URL}/${id}`, {
                        headers: { Authorization: `Bearer ${DAYDREAM_API_TOKEN}` },
                    });
                    const statusData = await statusResponse.json().catch(() => ({}));
                    if (!statusResponse.ok || !statusData.isActive) {
                        throw new Error(statusData.error || statusData.message || "Webcam stream is not active");
                    }

                    const enhancedPrompt = aiPrompt.includes("::") ? aiPrompt : `${aiPrompt} :: neutral backdrop`;

                    const response = await retryWithBackoff(() =>
                        fetch(`${DAYDREAM_API_URL}/${id}`, {
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
                        toast.success("Webcam visual enhancement updated!");
                        setIsEnhanced(true);
                    } else {
                        throw new Error(data.error || data.message || `Webcam enhancement failed with status ${response.status}`);
                    }
                } catch (err) {
                    toast.error(`Failed to apply webcam enhancement: ${err instanceof Error ? err.message : "Unknown error"}`);
                }
            }
        };

        // Handle canvas enhancement
        const handleCanvasEnhance = async () => {
            if (!aiPrompt) {
                toast.info("Please enter an AI prompt.");
                return;
            }
            if (!canvasRef.current) {
                toast.info("Canvas not ready.");
                return;
            }

            const canvas = canvasRef.current as ExtendedFabricCanvas;
            const canvasElement = canvas.lowerCanvasEl;
            if (!canvasElement || typeof canvasElement.captureStream !== "function") {
                toast.error("Canvas enhancement not supported: unable to capture canvas stream.");
                return;
            }

            if (typeof window === "undefined") {
                console.warn("Skipping canvas stream capture on server-side");
                return;
            }

            const canvasStream = canvasElement.captureStream(30);

            let id = canvasStreamId;
            let playbackUrl: string | null = null;

            if (!id) {
                // Create new canvas stream for enhancement
                const result = await createStream(canvasStream, aiPrompt, 'canvas');
                if (!result) {
                    canvasStream.getTracks().forEach((track) => track.stop());
                    return;
                }

                await publishToIngest(result.whipUrl, canvasStream, canvasPcRef, 'canvas');
                id = result.id;
                playbackUrl = result.playbackUrl;
                setCanvasStreamId(id);
                setCanvasPlaybackUrl(playbackUrl);
                setIsCanvasEnhanced(true);
                toast.success("Canvas visual enhancement applied!");
            } else {
                // Update existing canvas stream
                try {
                    const statusResponse = await fetch(`${DAYDREAM_API_URL}/${id}`, {
                        headers: { Authorization: `Bearer ${DAYDREAM_API_TOKEN}` },
                    });
                    const statusData = await statusResponse.json().catch(() => ({}));
                    if (!statusResponse.ok || !statusData.isActive) {
                        throw new Error(statusData.error || statusData.message || "Canvas stream is not active");
                    }

                    const enhancedPrompt = aiPrompt.includes("::") ? aiPrompt : `${aiPrompt} :: neutral backdrop`;

                    const response = await retryWithBackoff(() =>
                        fetch(`${DAYDREAM_API_URL}/${id}`, {
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
                        toast.success("Canvas visual enhancement updated!");
                        setIsCanvasEnhanced(true);
                    } else {
                        throw new Error(data.error || data.message || `Canvas enhancement failed with status ${response.status}`);
                    }
                } catch (err) {
                    toast.error(`Failed to apply canvas enhancement: ${err instanceof Error ? err.message : "Unknown error"}`);
                } finally {
                    canvasStream.getTracks().forEach((track) => track.stop());
                }
            }
        };

        // Handle streaming for both canvas and webcam
        useEffect(() => {
            if (!isStreaming || !canvasRef.current) return;

            if (typeof window === "undefined") {
                console.warn("Skipping streaming logic on server-side");
                return;
            }

            let isActive = true;
            const canvas = canvasRef.current as ExtendedFabricCanvas;

            const canvasElement = canvas.lowerCanvasEl;
            if (!canvasElement || typeof canvasElement.captureStream !== "function") {
                toast.error("Streaming not supported: unable to capture canvas stream.");
                return;
            }

            const canvasStream = canvasElement.captureStream(30);
            streamRef.current = canvasStream;

            const startStreaming = async () => {
                if (!isActive) return;

                // Create canvas stream (enhanced if isCanvasEnhanced)
                const canvasResult = await createStream(canvasStream, isCanvasEnhanced ? aiPrompt : "", 'canvas');
                if (!canvasResult || !isActive) return;

                await publishToIngest(canvasResult.whipUrl, canvasStream, canvasPcRef, 'canvas');

                const canvasPlaybackUrl = canvasResult.playbackUrl;
                setCanvasStreamId(canvasResult.id);
                setCanvasPlaybackUrl(canvasPlaybackUrl);

                let webcamPlaybackUrl: string | null = null;

                // Create webcam stream (enhanced if enhanceWebcam and useWebcam are true)
                if (useWebcam && webcamStream) {
                    const webcamResult = await createStream(webcamStream, enhanceWebcam ? aiPrompt : "", 'webcam');
                    if (webcamResult && isActive) {
                        await publishToIngest(webcamResult.whipUrl, webcamStream, webcamPcRef, 'webcam');
                        webcamPlaybackUrl = webcamResult.playbackUrl;
                        setWebcamStreamId(webcamResult.id);
                        setWebcamPlaybackUrl(webcamPlaybackUrl);
                        if (enhanceWebcam) {
                            setIsEnhanced(true);
                        }
                    }
                }

                if (isActive) {
                    socketRef.current?.emit("playbackInfo", { canvasPlaybackUrl, webcamPlaybackUrl, roomId });
                    toast.success("Streaming started to shared view!");
                }
            };

            startStreaming();

            return () => {
                isActive = false;
                if (canvasStream) {
                    canvasStream.getTracks().forEach((track) => track.stop());
                }
                if (canvasPcRef.current) {
                    canvasPcRef.current.close();
                    canvasPcRef.current = null;
                }
                if (webcamPcRef.current) {
                    webcamPcRef.current.close();
                    webcamPcRef.current = null;
                }
                setWebcamStreamId(null);
                setCanvasStreamId(null);
                setWebcamPlaybackUrl(null);
                setCanvasPlaybackUrl(null);
                setIsEnhanced(false);
                setIsCanvasEnhanced(false);
                socketRef.current?.emit("playbackInfo", { canvasPlaybackUrl: null, webcamPlaybackUrl: null, roomId });
                toast.success("Streaming stopped.");
            };
        }, [isStreaming, useWebcam, enhanceWebcam, roomId, socketRef, canvasRef, createStream, publishToIngest, aiPrompt, webcamStream, setWebcamPlaybackUrl, setCanvasPlaybackUrl]);

        return null; // No UI, headless
    }
);

StreamManager.displayName = "StreamManager";

export default StreamManager;