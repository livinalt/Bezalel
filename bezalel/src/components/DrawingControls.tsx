// "use client";

// import { Dispatch, SetStateAction } from "react";
// import { Sparkles } from "lucide-react";
// import { TLEditor } from "@tldraw/tldraw";
// import { toast } from "sonner";

// interface DrawingControlsProps {
//     canvasComponentRef: React.RefObject<TLEditor>;
//     aiPrompt: string;
//     setAiPrompt: Dispatch<SetStateAction<string>>;
//     saveCanvasState: () => void;
// }

// export default function DrawingControls({
//     canvasComponentRef,
//     aiPrompt,
//     setAiPrompt,
//     saveCanvasState,
// }: DrawingControlsProps) {
//     return (
//         <div className="flex items-center gap-2 overflow-visible">
//             <input
//                 title="Object enhancement prompt"
//                 placeholder="Object prompt..."
//                 value={aiPrompt}
//                 onChange={(e) => setAiPrompt(e.target.value)}
//                 className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-green-400"
//             />
//             <button
//                 title="Enhance Selected Objects"
//                 onClick={async () => {
//                     const editor = canvasComponentRef.current;
//                     if (!editor || !aiPrompt) return;
//                     const selectedShapes = editor.getSelectedShapes();
//                     if (selectedShapes.length === 0) return;
//                     try {
//                         const response = await fetch("/mock/daydream/streams", {
//                             method: "POST",
//                             headers: { "Content-Type": "application/json" },
//                             body: JSON.stringify({
//                                 objects: selectedShapes.map((shape) => ({
//                                     id: shape.id,
//                                     type: shape.type,
//                                     props: shape.props,
//                                 })),
//                                 prompt: aiPrompt,
//                             }),
//                         });
//                         const result = await response.json();
//                         editor.updateShapes(
//                             result.objects.map((obj: any) => ({
//                                 id: obj.id,
//                                 type: obj.type,
//                                 props: { ...obj.props, fill: obj.fill || obj.props.fill },
//                             }))
//                         );
//                         saveCanvasState();
//                     } catch (error) {
//                         console.error("DaydreamAPI error:", error);
//                         toast.error("Failed to enhance objects");
//                     }
//                 }}
//                 className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-green-50"
//             >
//                 <Sparkles className="w-4 h-4 text-green-600" />
//             </button>
//         </div>
//     );
// }