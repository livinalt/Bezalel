import { useState, useEffect } from "react";
import { Editor } from "@tldraw/tldraw";
import { Eye, EyeOff, Layers, MoveUp, MoveDown } from "lucide-react";

interface Layer {
    id: string;
    name: string;
    isVisible: boolean;
}

interface LayersPanelProps {
    editorRef: React.RefObject<Editor>;
}

export default function LayersPanel({ editorRef }: LayersPanelProps) {
    const [layers, setLayers] = useState<Layer[]>([]);

    // Sync layers with Tldraw shapes
    useEffect(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const updateLayers = () => {
            const shapes = editor.getCurrentPageShapes();
            const newLayers = shapes.map((shape, index) => ({
                id: shape.id,
                name: `Layer ${index + 1}`,
                isVisible: !editor.isShapeHidden(shape.id),
            }));
            setLayers(newLayers);
        };

        updateLayers();
        editor.store.on("change", updateLayers);
        return () => {
            editor.store.off("change", updateLayers);
        };
    }, [editorRef]);

    const toggleVisibility = (id: string) => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const isHidden = editor.isShapeHidden(id);
        editor.setShapeHidden(id, !isHidden);
        setLayers((prev) =>
            prev.map((layer) =>
                layer.id === id ? { ...layer, isVisible: !isHidden } : layer
            )
        );
    };

    const moveLayerUp = (id: string) => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const shapes = editor.getCurrentPageShapes();
        const index = shapes.findIndex((shape) => shape.id === id);
        if (index < shapes.length - 1) {
            editor.bringForward([id]);
        }
    };

    const moveLayerDown = (id: string) => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const shapes = editor.getCurrentPageShapes();
        const index = shapes.findIndex((shape) => shape.id === id);
        if (index > 0) {
            editor.sendBackward([id]);
        }
    };

    return (
        <div className="fixed right-0 top-14 w-48 h-[calc(100vh-3.5rem)] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-700 p-2 z-[9998] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4" />
                <h2 className="text-sm font-semibold">Layers</h2>
            </div>
            {layers.map((layer) => (
                <div
                    key={layer.id}
                    className="flex items-center justify-between p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                >
                    <span className="text-xs">{layer.name}</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => toggleVisibility(layer.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded"
                        >
                            {layer.isVisible ? (
                                <Eye className="w-4 h-4" />
                            ) : (
                                <EyeOff className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            onClick={() => moveLayerUp(layer.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded"
                        >
                            <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => moveLayerDown(layer.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded"
                        >
                            <MoveDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}