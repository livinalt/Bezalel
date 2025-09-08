
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { Tldraw, Editor, TLEditorComponents, DefaultActionsMenu } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import StreamingControls from "./StreamingControls";

interface CanvasProps {
    showGrid: boolean;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    editorRef: React.RefObject<Editor>;
    showRulers: boolean;
    aiPrompt: string;
    setAiPrompt: (value: string) => void;
    saveCanvasState: () => void;
    webcamPrompt: string;
    setWebcamPrompt: (value: string) => void;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    enhanceWebcam: boolean;
    setEnhanceWebcam: (value: boolean) => void;
    streamId: string | null;
    setStreamId?: (id: string | null) => void;
}

export default function Canvas({
    showGrid,
    canvasRef,
    editorRef,
    showRulers,
    aiPrompt,
    setAiPrompt,
    saveCanvasState,
    webcamPrompt,
    setWebcamPrompt,
    isStreaming,
    setIsStreaming,
    useWebcam,
    setUseWebcam,
    enhanceWebcam,
    setEnhanceWebcam,
    streamId,
    setStreamId,
}: CanvasProps) {
    const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
    const webcamStreamRef = useRef<MediaStream | null>(null);
    const [localStreamId, setLocalStreamId] = useState<string | null>(null);
    const [enhancedWebcamUrl, setEnhancedWebcamUrl] = useState<string | null>(null);

    // Webcam toggle for OBS capture
    useEffect(() => {
        if (useWebcam) {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    webcamStreamRef.current = stream;
                    if (!webcamVideoRef.current) {
                        const video = document.createElement("video");
                        video.autoplay = true;
                        video.muted = true;
                        video.playsInline = true;
                        video.srcObject = stream;
                        webcamVideoRef.current = video;
                        document.body.appendChild(video);
                        video.style.position = "absolute";
                        video.style.bottom = "20px";
                        video.style.right = "20px";
                        video.style.width = "200px";
                        video.style.height = "150px";
                    } else {
                        webcamVideoRef.current.srcObject = stream;
                    }
                })
                .catch((err) => {
                    console.error("Webcam error:", err);
                    toast.error("Failed to access webcam");
                    setUseWebcam(false);
                });
        } else {
            webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
            if (webcamVideoRef.current) {
                webcamVideoRef.current.remove();
                webcamVideoRef.current = null;
            }
            webcamStreamRef.current = null;
            setEnhancedWebcamUrl(null);
        }
        return () => {
            webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
            if (webcamVideoRef.current) webcamVideoRef.current.remove();
        };
    }, [useWebcam, setUseWebcam]);

    // Create Daydream stream
    const createDaydreamStream = async () => {
        if (!process.env.NEXT_PUBLIC_DAYDREAM_API_KEY) {
            console.error("DAYDREAM_API_KEY missing");
            toast.error("Configure DAYDREAM_API_KEY");
            return null;
        }

        try {
            const response = await fetch("https://api.daydream.live/v1/streams", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                },
                body: JSON.stringify({ name: `Canvas Stream ${Date.now()}` }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create stream: ${await response.text()}`);
            }

            const result = await response.json();
            console.log("Stream created:", JSON.stringify(result, null, 2));
            setLocalStreamId(result.id);
            if (setStreamId) setStreamId(result.id);
            return result.id;
        } catch (error: any) {
            console.error("Create stream error:", error);
            toast.error(`Failed to create stream: ${error.message}`);
            return null;
        }
    };

    // Check stream status
    const checkStreamStatus = async (streamId: string) => {
        if (!process.env.NEXT_PUBLIC_DAYDREAM_API_KEY) {
            console.error("DAYDREAM_API_KEY missing");
            return false;
        }

        try {
            const response = await fetch(`https://api.daydream.live/v1/streams/${streamId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Stream status check failed (${response.status}):`, errorText);
                return false;
            }
            const result = await response.json();
            console.log("Stream status:", JSON.stringify(result, null, 2));
            return result.status === "active";
        } catch (error) {
            console.error("Stream status error:", error);
            return false;
        }
    };

    // Export shape as image for Daydream
    const exportShapeAsImage = async (editor: Editor, shapeId: string) => {
        const svg = await editor.getSvg([shapeId]);
        if (!svg) {
            console.error("Failed to get SVG for shape:", shapeId);
            return null;
        }
        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        return new Promise<string>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL("image/png");
                resolve(dataUrl.replace(/^data:image\/png;base64,/, ""));
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                console.error("Failed to load SVG image");
                resolve(null);
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    };

    // Export webcam frame as image
    const exportWebcamFrame = async () => {
        if (!webcamVideoRef.current) {
            console.error("Webcam video not available");
            return null;
        }
        const canvas = document.createElement("canvas");
        canvas.width = webcamVideoRef.current.videoWidth;
        canvas.height = webcamVideoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("Failed to get canvas context");
            return null;
        }
        ctx.drawImage(webcamVideoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        return dataUrl.replace(/^data:image\/png;base64,/, "");
    };

    // Replace shape with enhanced image
    const replaceShapeWithImage = (editor: Editor, shapeId: string, imageUrl: string) => {
        const shape = editor.getShape(shapeId);
        if (!shape) {
            console.error("Shape not found:", shapeId);
            return;
        }
        editor.updateShapes([
            {
                id: shape.id,
                type: "image",
                props: { w: shape.props.w || 200, h: shape.props.h || 200, url: imageUrl },
            },
        ]);
    };

    // Enhance selected objects with Daydream
    const handleEnhanceObjects = async () => {
        const editor = editorRef.current;
        if (!editor || !aiPrompt) {
            toast.error("Enter a prompt");
            return;
        }
        if (!process.env.NEXT_PUBLIC_DAYDREAM_API_KEY) {
            console.error("DAYDREAM_API_KEY missing");
            toast.error("Configure DAYDREAM_API_KEY");
            return;
        }

        const selectedShapes = editor.getSelectedShapeIds();
        if (selectedShapes.length === 0) {
            toast.error("Select an object");
            return;
        }

        const activeStreamId = streamId || localStreamId || (await createDaydreamStream());
        if (!activeStreamId) {
            toast.error("Failed to create stream for enhancement");
            return;
        }

        console.log("Using streamId:", activeStreamId);

        // Verify stream status
        const isStreamActive = await checkStreamStatus(activeStreamId);
        if (!isStreamActive) {
            toast.error("Stream is not active");
            return;
        }

        try {
            for (const shapeId of selectedShapes) {
                const dataUrl = await exportShapeAsImage(editor, shapeId);
                if (!dataUrl) {
                    toast.error("Failed to export shape");
                    continue;
                }

                let promptResponse = await fetch(
                    `https://api.daydream.live/beta/streams/${activeStreamId}/prompts`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                        },
                        body: JSON.stringify({
                            pipeline: "live-video-to-video",
                            model_id: "streamdiffusion",
                            params: {
                                prompt: aiPrompt,
                                image: dataUrl,
                                guidance_scale: 7.5,
                                num_inference_steps: 50,
                            },
                        }),
                    }
                );

                if (promptResponse.status === 405) {
                    console.warn("POST failed with 405, trying PUT...");
                    promptResponse = await fetch(
                        `https://api.daydream.live/beta/streams/${activeStreamId}/prompts`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                            },
                            body: JSON.stringify({
                                pipeline: "live-video-to-video",
                                model_id: "streamdiffusion",
                                params: {
                                    prompt: aiPrompt,
                                    image: dataUrl,
                                    guidance_scale: 7.5,
                                    num_inference_steps: 50,
                                },
                            }),
                        }
                    );
                }

                if (!promptResponse.ok) {
                    const errorText = await promptResponse.text();
                    console.error(`Daydream API error (${promptResponse.status}):`, errorText);
                    throw new Error(`Daydream API error: ${errorText}`);
                }

                const result = await promptResponse.json();
                console.log("Daydream API response:", JSON.stringify(result, null, 2));
                const enhancedImageUrl = result.output_url || `data:image/png;base64,${dataUrl}`;
                replaceShapeWithImage(editor, shapeId, enhancedImageUrl);
            }

            saveCanvasState();
            toast.success("Object(s) enhanced!");
        } catch (error: any) {
            console.error("Enhance error:", error);
            toast.error(`Enhance failed: ${error.message}`);
        }
    };

    // Enhance webcam with Daydream
    const handleEnhanceWebcam = async () => {
        if (!webcamPrompt || !webcamVideoRef.current) {
            toast.error("Enter a webcam prompt or enable webcam");
            return;
        }
        if (!process.env.NEXT_PUBLIC_DAYDREAM_API_KEY) {
            console.error("DAYDREAM_API_KEY missing");
            toast.error("Configure DAYDREAM_API_KEY");
            return;
        }

        const activeStreamId = streamId || localStreamId || (await createDaydreamStream());
        if (!activeStreamId) {
            toast.error("Failed to create stream for enhancement");
            return;
        }

        // Verify stream status
        const isStreamActive = await checkStreamStatus(activeStreamId);
        if (!isStreamActive) {
            toast.error("Stream is not active");
            return;
        }

        try {
            const dataUrl = await exportWebcamFrame();
            if (!dataUrl) {
                toast.error("Failed to export webcam frame");
                return;
            }

            let promptResponse = await fetch(
                `https://api.daydream.live/beta/streams/${activeStreamId}/prompts`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                    },
                    body: JSON.stringify({
                        pipeline: "live-video-to-video",
                        model_id: "streamdiffusion",
                        params: {
                            prompt: webcamPrompt,
                            image: dataUrl,
                            guidance_scale: 7.5,
                            num_inference_steps: 50,
                        },
                    }),
                }
            );

            if (promptResponse.status === 405) {
                console.warn("POST failed with 405, trying PUT...");
                promptResponse = await fetch(
                    `https://api.daydream.live/beta/streams/${activeStreamId}/prompts`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                        },
                        body: JSON.stringify({
                            pipeline: "live-video-to-video",
                            model_id: "streamdiffusion",
                            params: {
                                prompt: webcamPrompt,
                                image: dataUrl,
                                guidance_scale: 7.5,
                                num_inference_steps: 50,
                            },
                        }),
                    }
                );
            }

            if (!promptResponse.ok) {
                const errorText = await promptResponse.text();
                console.error(`Daydream API error (${promptResponse.status}):`, errorText);
                throw new Error(`Daydream API error: ${errorText}`);
            }

            const result = await promptResponse.json();
            console.log("Daydream webcam response:", JSON.stringify(result, null, 2));
            const enhancedImageUrl = result.output_url || `data:image/png;base64,${dataUrl}`;
            setEnhancedWebcamUrl(enhancedImageUrl);
            setEnhanceWebcam(true);
            toast.success("Webcam enhanced!");
        } catch (error: any) {
            console.error("Webcam enhance error:", error);
            toast.error(`Webcam enhance failed: ${error.message}`);
        }
    };

    // Update webcam display for enhanced image
    useEffect(() => {
        if (enhanceWebcam && enhancedWebcamUrl && webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = null;
            webcamVideoRef.current.src = enhancedWebcamUrl;
        } else if (webcamStreamRef.current && webcamVideoRef.current) {
            webcamVideoRef.current.src = "";
            webcamVideoRef.current.srcObject = webcamStreamRef.current;
        }
    }, [enhanceWebcam, enhancedWebcamUrl]);

    // UI Components
    const components: TLEditorComponents = {
        Cursor: () => null,
        Background: () => null,
        ActionsMenu: (props) => (
            <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2"
                style={{ zIndex: 10001, position: "relative" }}
            >
                <DefaultActionsMenu {...props} />
                <div className="flex items-center gap-2">
                    <input
                        tabIndex={0}
                        title="Object enhancement prompt"
                        placeholder="Object prompt..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 
                                   bg-gray-50 dark:bg-zinc-800 border border-gray-200 
                                   dark:border-zinc-700 rounded px-2 py-1 w-40 
                                   focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                    <button
                        title="Enhance Selected Objects"
                        disabled={!aiPrompt || !editorRef.current?.getSelectedShapeIds()?.length}
                        onClick={handleEnhanceObjects}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition 
                            ${aiPrompt && editorRef.current?.getSelectedShapeIds()?.length
                                ? "hover:bg-green-50 cursor-pointer bg-green-100"
                                : "opacity-50 cursor-not-allowed"}`}
                    >
                        <Sparkles className="w-4 h-4 text-green-600" />
                    </button>
                    <StreamingControls
                        webcamPrompt={webcamPrompt}
                        setWebcamPrompt={setWebcamPrompt}
                        isStreaming={isStreaming}
                        setIsStreaming={setIsStreaming}
                        useWebcam={useWebcam}
                        setUseWebcam={setUseWebcam}
                        enhanceWebcam={enhanceWebcam}
                        setEnhanceWebcam={setEnhanceWebcam}
                        onEnhanceWebcam={handleEnhanceWebcam}
                    />
                </div>
            </div>
        ),
    };

    // Capture canvas element reference
    useEffect(() => {
        if (!editorRef.current) return;
        const container = editorRef.current.getContainer();
        const observer = new MutationObserver(() => {
            const canvas = container.querySelector("canvas");
            if (canvas) {
                canvasRef.current = canvas as HTMLCanvasElement;
                observer.disconnect();
            }
        });
        observer.observe(container, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [editorRef, canvasRef]);

    return (
        <div className="absolute inset-0 z-[10000]">
            <Tldraw
                persistenceKey="canvas-drawing"
                components={components}
                onMount={(editor: Editor) => {
                    editorRef.current = editor;
                    editor.updateInstanceState({ isGridMode: showGrid });
                }}
            />
        </div>
    );
}