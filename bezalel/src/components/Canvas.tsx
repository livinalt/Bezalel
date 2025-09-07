import { useRef } from "react";
import { Tldraw, Editor, TLEditorComponents } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

interface CanvasProps {
    showGrid: boolean;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    editorRef: React.RefObject<Editor>;
    brushColor: string;
    brushWidth: number;
    brushOpacity: number;
    activeTool: string;
    isDrawingMode: boolean;
    brushType: string;
    showRulers: boolean;
}

export default function Canvas({
    showGrid,
    canvasRef,
    editorRef,
    showRulers,
}: CanvasProps) {
    const components: TLEditorComponents = {
        Cursor: () => null,
        Background: () => (
            <>
                {showRulers && (
                    <>
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "20px",
                                background: "rgba(0, 0, 0, 0.1)",
                                borderBottom: "1px solid #ccc",
                                zIndex: 10001,
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "0 10px",
                                fontSize: "10px",
                                color: "#666",
                            }}
                        >
                            {[...Array(20)].map((_, i) => (
                                <span key={i} style={{ width: "5%" }}>
                                    {i * 50}
                                </span>
                            ))}
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "20px",
                                height: "100%",
                                background: "rgba(0, 0, 0, 0.1)",
                                borderRight: "1px solid #ccc",
                                zIndex: 10001,
                                writingMode: "vertical-rl",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                padding: "10px 0",
                                fontSize: "10px",
                                color: "#666",
                            }}
                        >
                            {[...Array(10)].map((_, i) => (
                                <span key={i} style={{ height: "10%" }}>
                                    {i * 50}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </>
        ),
    };

    return (
        <div className="absolute inset-0 z-[10000]">
            <Tldraw
                persistenceKey="canvas-drawing"
                components={components}
                onMount={(editor: Editor) => {
                    editorRef.current = editor;
                    const canvas = editor.getContainer().querySelector("canvas");
                    if (canvas) {
                        canvasRef.current = canvas as HTMLCanvasElement;
                    } else {
                        console.warn("Canvas not found during initialization");
                    }
                    editor.updateInstanceState({ isGridMode: showGrid });
                    console.log("Tldraw editor mounted:", editor);
                }}
            />
        </div>
    );
}