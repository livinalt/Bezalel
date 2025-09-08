
import { Video, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StreamingControlsProps {
    webcamPrompt: string;
    setWebcamPrompt: (value: string) => void;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    enhanceWebcam: boolean;
    setEnhanceWebcam: (value: boolean) => void;
    onEnhanceWebcam: () => void;
}

export default function StreamingControls({
    webcamPrompt,
    setWebcamPrompt,
    isStreaming,
    setIsStreaming,
    useWebcam,
    setUseWebcam,
    enhanceWebcam,
    setEnhanceWebcam,
    onEnhanceWebcam,
}: StreamingControlsProps) {
    const [isPromptFocused, setIsPromptFocused] = useState(false);

    return (
        <div className="flex items-center gap-2">
            <button
                title={isStreaming ? "End Stream" : "Go Live"}
                onClick={() => setIsStreaming(!isStreaming)}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition ${isStreaming ? "bg-red-100 hover:bg-red-200" : "bg-green-100 hover:bg-green-200"
                    }`}
            >
                {isStreaming ? (
                    <X className="w-4 h-4 text-red-600" />
                ) : (
                    <Video className="w-4 h-4 text-green-600" />
                )}
            </button>
            <button
                title="Toggle Webcam"
                onClick={() => setUseWebcam(!useWebcam)}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition ${useWebcam ? "bg-green-100 hover:bg-green-200" : "bg-gray-100 hover:bg-gray-200"
                    }`}
            >
                <Video className={`w-4 h-4 ${useWebcam ? "text-green-600" : "text-gray-600"}`} />
            </button>
            {useWebcam && (
                <>
                    <input
                        title="Webcam enhancement prompt"
                        placeholder="Webcam prompt..."
                        value={webcamPrompt}
                        onChange={(e) => setWebcamPrompt(e.target.value)}
                        onFocus={() => setIsPromptFocused(true)}
                        onBlur={() => setIsPromptFocused(false)}
                        className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 
                                   bg-gray-50 dark:bg-zinc-800 border border-gray-200 
                                   dark:border-zinc-700 rounded px-2 py-1 w-40 
                                   focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                    <button
                        title="Enhance Webcam"
                        disabled={!webcamPrompt || isPromptFocused}
                        onClick={onEnhanceWebcam}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition 
                            ${webcamPrompt && !isPromptFocused ? "hover:bg-green-50 cursor-pointer bg-green-100" : "opacity-50 cursor-not-allowed"}`}
                    >
                        <Video className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                        title="Toggle Enhanced Webcam"
                        disabled={!webcamPrompt}
                        onClick={() => setEnhanceWebcam(!enhanceWebcam)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition 
                            ${webcamPrompt ? "hover:bg-green-50 cursor-pointer bg-green-100" : "opacity-50 cursor-not-allowed"}`}
                    >
                        <Video className="w-4 h-4 text-green-600" />
                    </button>
                </>
            )}
        </div>
    );
}