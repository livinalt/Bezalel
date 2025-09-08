import { Video, X } from "lucide-react";

interface StreamingControlsProps {
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
}

export default function StreamingControls({
    isStreaming,
    setIsStreaming,
}: StreamingControlsProps) {
    return (
        <div
            className="flex items-center gap-2 z-[10001]"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
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
        </div>
    );
}