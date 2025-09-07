"use client";

import React, { Dispatch, SetStateAction, useCallback } from "react";
import { Sparkles, Radio, Square, ToggleLeft, ToggleRight } from "lucide-react";

interface StreamingControlsProps {
    webcamPrompt: string;
    setWebcamPrompt: Dispatch<SetStateAction<string>>;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    enhanceWebcam: boolean;
    setEnhanceWebcam: Dispatch<SetStateAction<boolean>>;
}

function StreamingControls({
    webcamPrompt,
    setWebcamPrompt,
    isStreaming,
    setIsStreaming,
    useWebcam,
    setUseWebcam,
    enhanceWebcam,
    setEnhanceWebcam,
}: StreamingControlsProps) {
    const toggleEnhanceWebcam = useCallback(() => {
        if (useWebcam) setEnhanceWebcam((prev) => !prev);
    }, [useWebcam, setEnhanceWebcam]);

    const toggleWebcam = useCallback(() => {
        setUseWebcam((prev) => !prev);
    }, [setUseWebcam]);

    const toggleStreaming = useCallback(() => {
        setIsStreaming((prev) => !prev);
    }, [setIsStreaming]);

    return (
        <>
            <input
                title="Webcam enhancement prompt"
                placeholder="Webcam prompt..."
                value={webcamPrompt}
                onChange={(e) => setWebcamPrompt(e.target.value)}
                className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-green-400"
            />
            <button
                title="Enhance Webcam"
                onClick={toggleEnhanceWebcam}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition ${enhanceWebcam && useWebcam
                        ? "bg-green-100 dark:bg-green-900"
                        : useWebcam
                            ? "hover:bg-green-50 dark:hover:bg-green-900"
                            : "opacity-50 cursor-not-allowed"
                    }`}
            >
                <Sparkles className="w-4 h-4 text-green-600" />
            </button>

            <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

            <div className="flex items-center gap-2">
                <button
                    title="Toggle Webcam"
                    onClick={toggleWebcam}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition ${useWebcam
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                >
                    {useWebcam ? (
                        <ToggleRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                        <ToggleLeft className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                    )}
                </button>
                <span className="text-xs text-gray-700 dark:text-gray-200">Webcam</span>
            </div>

            <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

            <button
                onClick={toggleStreaming}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition ${isStreaming
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
            >
                {isStreaming ? (
                    <>
                        <Square className="w-3.5 h-3.5" /> Stop
                    </>
                ) : (
                    <>
                        <Radio className="w-3.5 h-3.5 animate-pulse text-red-300" /> Live
                    </>
                )}
            </button>
        </>
    );
}

export default React.memo(StreamingControls);
