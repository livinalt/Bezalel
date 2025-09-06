"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Canvas as FabricJSCanvas, PencilBrush, Pattern, Path, Point, Rect, Line, Circle, Triangle, Group } from "fabric";
import { useTheme } from "next-themes";
import { getStroke } from "perfect-freehand";
import { v4 as uuid } from "uuid";

interface CanvasProps {
    isDrawingMode: boolean;
    activeTool: string;
    setCanvasRef?: (canvas: FabricJSCanvas | null) => void;
    onPathCreated?: (path: Path) => void;
    width?: number;
    height?: number;
    brushColor?: string;
    brushWidth?: number;
    brushOpacity?: number;
    showGrid?: boolean;
}

interface PathCreatedEvent {
    path: Path;
}

// Custom function to convert stroke points to SVG path
const getSvgPathFromStroke = (stroke: number[][]): string => {
    if (!stroke.length) return "";
    const d = stroke.reduce(
        (acc, [x, y], i, arr) => {
            const type = i === 0 ? "M" : "L";
            return `${acc}${type} ${x} ${y} `;
        },
        ""
    );
    return d;
};

const Canvas = forwardRef(function Canvas(
    {
        isDrawingMode,
        activeTool,
        setCanvasRef,
        onPathCreated,
        width = 1920,
        height = 1080,
        brushColor = "#000000",
        brushWidth = 3,
        brushOpacity = 1,
        showGrid = true,
    }: CanvasProps,
    ref
) {
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const fabricRef = useRef<FabricJSCanvas | null>(null);
    const patternCacheRef = useRef<HTMLCanvasElement | null>(null);
    const { theme } = useTheme();
    const historyRef = useRef<any[]>([]);
    const redoStackRef = useRef<any[]>([]);
    const isDrawingShape = useRef(false);
    const currentShape = useRef<Rect | Line | Circle | Triangle | Group | null>(null);
    const startPoint = useRef<Point | null>(null);

    const setZoom = (zoom: number, point?: { x: number; y: number }) => {
        if (!fabricRef.current) return;
        const zoomPoint = point
            ? new Point(point.x, point.y)
            : new Point(fabricRef.current.getWidth() / 2, fabricRef.current.getHeight() / 2);
        fabricRef.current.zoomToPoint(zoomPoint, zoom);
        updateGrid();
    };

    const saveState = () => {
        if (fabricRef.current) {
            const state = fabricRef.current.toJSON(["selectable", "id"]);
            if (JSON.stringify(state) !== JSON.stringify(historyRef.current[historyRef.current.length - 1])) {
                historyRef.current = [...historyRef.current.slice(-49), state];
                redoStackRef.current = [];
            }
        }
    };

    const updateGrid = () => {
        if (!fabricRef.current || !showGrid || !patternCacheRef.current) return;
        const zoom = fabricRef.current.getZoom();
        const gridSize = 50 * zoom;
        const gridCanvas = document.createElement("canvas");
        gridCanvas.width = gridSize;
        gridCanvas.height = gridSize;
        const ctx = gridCanvas.getContext("2d");
        if (ctx) {
            ctx.strokeStyle = theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
            ctx.lineWidth = 1 / zoom;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, gridSize);
            ctx.moveTo(0, 0);
            ctx.lineTo(gridSize, 0);
            ctx.stroke();
        }
        patternCacheRef.current = gridCanvas;
        fabricRef.current.backgroundColor = new Pattern({ source: gridCanvas, repeat: "repeat" });
        fabricRef.current.renderAll();
    };

    useImperativeHandle(ref, () => ({
        zoomIn: () => fabricRef.current && setZoom(fabricRef.current.getZoom() * 1.1),
        zoomOut: () => fabricRef.current && setZoom(fabricRef.current.getZoom() / 1.1),
        resetZoom: () => fabricRef.current && setZoom(1),
        toJSON: () => fabricRef.current?.toJSON(["selectable", "id"]),
        loadFromJSON: (json: string | Record<string, unknown>) => {
            if (!fabricRef.current) return;
            fabricRef.current.loadFromJSON(json || {}, () => {
                fabricRef.current!.renderAll();
                updateGrid();
            });
        },
        undo: () => {
            if (historyRef.current.length <= 1 || !fabricRef.current) return;
            const currentState = fabricRef.current.toJSON(["selectable", "id"]);
            redoStackRef.current.push(currentState);
            const prevState = historyRef.current.pop();
            fabricRef.current.loadFromJSON(prevState, () => {
                fabricRef.current!.renderAll();
                updateGrid();
            });
        },
        redo: () => {
            if (redoStackRef.current.length === 0 || !fabricRef.current) return;
            const currentState = fabricRef.current.toJSON(["selectable", "id"]);
            historyRef.current.push(currentState);
            const nextState = redoStackRef.current.pop();
            fabricRef.current.loadFromJSON(nextState, () => {
                fabricRef.current!.renderAll();
                updateGrid();
            });
        },
        exportCanvas: () => {
            if (fabricRef.current) {
                const dataURL = fabricRef.current.toDataURL({ format: "png" });
                const link = document.createElement("a");
                link.href = dataURL;
                link.download = "drawing.png";
                link.click();
            }
        },
        deleteSelected: () => {
            if (fabricRef.current) {
                const activeObjects = fabricRef.current.getActiveObjects();
                if (activeObjects.length > 0) {
                    activeObjects.forEach((obj) => fabricRef.current!.remove(obj));
                    fabricRef.current.discardActiveObject();
                    saveState();
                    fabricRef.current.renderAll();
                }
            }
        },
        applyEnhanceToSelected: async (prompt: string) => {
            if (!fabricRef.current || !prompt) return;
            const activeObjects = fabricRef.current.getActiveObjects();
            if (activeObjects.length === 0) return;

            try {
                const response = await fetch("/mock/daydream/streams", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        objects: activeObjects.map((obj) => obj.toJSON(["selectable", "id"])),
                        prompt,
                    }),
                });
                const result = await response.json();
                console.log("DaydreamAPI response:", result);
                activeObjects.forEach((obj, index) => {
                    obj.set({ fill: result.objects?.[index]?.fill || obj.fill });
                    fabricRef.current!.renderAll();
                });
                saveState();
            } catch (error) {
                console.error("DaydreamAPI error:", error);
            }
        },
    }));

    useEffect(() => {
        if (!canvasElRef.current) return;

        const canvasElement = canvasElRef.current;
        const fcanvas = new FabricJSCanvas(canvasElement, {
            isDrawingMode: false,
            width,
            height,
            selection: false,
            backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
        });

        fabricRef.current = fcanvas;

        if (onPathCreated) {
            fcanvas.on("path:created", (opts: PathCreatedEvent) => {
                const path = opts.path;
                const points = path.path.map(([_, x, y]) => ({ x, y }));
                const stroke = getStroke(points, {
                    size: brushWidth,
                    smoothing: 0.5,
                    thinning: 0.5,
                    streamline: 0.5,
                    easement: 0.5,
                });
                const d = getSvgPathFromStroke(stroke);
                const fillColor = activeTool === "eraser" ? "transparent" : brushColor;
                const composite = activeTool === "eraser" ? "destination-out" : "source-over";
                const smoothedPath = new Path(d, {
                    fill: fillColor,
                    stroke: null,
                    opacity: brushOpacity,
                    selectable: true,
                    id: uuid(),
                    globalCompositeOperation: composite,
                });
                fcanvas.remove(path);
                fcanvas.add(smoothedPath);
                onPathCreated(smoothedPath);
                saveState();
            });
        }

        updateGrid();
        if (setCanvasRef) setCanvasRef(fcanvas);

        const wheelHandler = (opt: WheelEvent) => {
            if (!fabricRef.current) return;
            if (!(opt.ctrlKey || opt.metaKey)) return;
            opt.preventDefault();
            let zoom = fabricRef.current.getZoom();
            zoom *= 0.999 ** opt.deltaY;
            zoom = Math.min(Math.max(zoom, 0.2), 4);
            setZoom(zoom, { x: opt.offsetX, y: opt.offsetY });
        };

        canvasElement.addEventListener("wheel", wheelHandler, { passive: false });
        saveState();
        fcanvas.on("object:modified", saveState);
        fcanvas.on("object:added", saveState);
        fcanvas.on("object:removed", saveState);

        return () => {
            fcanvas.dispose();
            if (setCanvasRef) setCanvasRef(null);
            canvasElement.removeEventListener("wheel", wheelHandler);
        };
    }, []); // Empty dependency for mount only

    useEffect(() => {
        if (fabricRef.current) {
            fabricRef.current.backgroundColor = theme === "dark" ? "#1a1a1a" : "#ffffff";
            fabricRef.current.renderAll();
            updateGrid();
        }
    }, [theme]);

    useEffect(() => {
        if (fabricRef.current) {
            const fcanvas = fabricRef.current;
            const isFreeDraw = activeTool === "pencil" || activeTool === "eraser";
            const isSelect = activeTool === "select";

            fcanvas.isDrawingMode = isFreeDraw;
            fcanvas.selection = isSelect;
            fcanvas.forEachObject((obj) => {
                obj.selectable = !isFreeDraw;
            });

            if (isFreeDraw) {
                fcanvas.freeDrawingBrush = new PencilBrush(fcanvas);
                fcanvas.freeDrawingBrush.color = activeTool === "eraser" ? "transparent" : brushColor;
                fcanvas.freeDrawingBrush.globalCompositeOperation = activeTool === "eraser" ? "destination-out" : "source-over";
                fcanvas.freeDrawingBrush.width = brushWidth;
                fcanvas.freeDrawingBrush.opacity = brushOpacity;
            }

            fcanvas.renderAll();
        }
    }, [activeTool, brushColor, brushWidth, brushOpacity]);

    useEffect(() => {
        const handleShapeDrawing = () => {
            const fcanvas = fabricRef.current;
            if (!fcanvas) return;

            if (["rectangle", "line", "circle", "triangle", "arrow"].includes(activeTool)) {
                fcanvas.isDrawingMode = false;
                fcanvas.on("mouse:down", (o) => {
                    if (isDrawingShape.current) return;
                    if (o.target) return; // Don't start new shape if clicking on existing object
                    isDrawingShape.current = true;
                    const pointer = fcanvas.getPointer(o.e);
                    startPoint.current = new Point(pointer.x, pointer.y);
                    if (activeTool === "rectangle") {
                        currentShape.current = new Rect({
                            left: pointer.x,
                            top: pointer.y,
                            originX: "left",
                            originY: "top",
                            width: 0,
                            height: 0,
                            fill: "transparent",
                            stroke: brushColor,
                            strokeWidth: brushWidth,
                            opacity: brushOpacity,
                            selectable: true,
                            id: uuid(),
                        });
                    } else if (activeTool === "line") {
                        currentShape.current = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                            stroke: brushColor,
                            strokeWidth: brushWidth,
                            opacity: brushOpacity,
                            selectable: true,
                            id: uuid(),
                        });
                    } else if (activeTool === "circle") {
                        currentShape.current = new Circle({
                            left: pointer.x,
                            top: pointer.y,
                            originX: "left",
                            originY: "top",
                            radius: 0,
                            fill: "transparent",
                            stroke: brushColor,
                            strokeWidth: brushWidth,
                            opacity: brushOpacity,
                            selectable: true,
                            id: uuid(),
                        });
                    } else if (activeTool === "triangle") {
                        currentShape.current = new Triangle({
                            left: pointer.x,
                            top: pointer.y,
                            originX: "left",
                            originY: "top",
                            width: 0,
                            height: 0,
                            fill: "transparent",
                            stroke: brushColor,
                            strokeWidth: brushWidth,
                            opacity: brushOpacity,
                            selectable: true,
                            id: uuid(),
                        });
                    } else if (activeTool === "arrow") {
                        const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                            stroke: brushColor,
                            strokeWidth: brushWidth,
                            opacity: brushOpacity,
                            selectable: true,
                            id: uuid(),
                        });
                        const triangle = new Triangle({
                            left: pointer.x,
                            top: pointer.y,
                            originX: "center",
                            originY: "center",
                            width: brushWidth * 4,
                            height: brushWidth * 4,
                            fill: brushColor,
                            stroke: brushColor,
                            strokeWidth: brushWidth,
                            opacity: brushOpacity,
                            selectable: true,
                            id: uuid(),
                        });
                        currentShape.current = new Group([line, triangle], {
                            selectable: true,
                            id: uuid(),
                        });
                    }
                    fcanvas.add(currentShape.current!);
                });
                fcanvas.on("mouse:move", (o) => {
                    if (!isDrawingShape.current || !currentShape.current) return;
                    const pointer = fcanvas.getPointer(o.e);
                    if (activeTool === "rectangle") {
                        const rect = currentShape.current as Rect;
                        rect.set({
                            width: Math.abs(pointer.x - startPoint.current!.x),
                            height: Math.abs(pointer.y - startPoint.current!.y),
                            left: Math.min(startPoint.current!.x, pointer.x),
                            top: Math.min(startPoint.current!.y, pointer.y),
                        });
                    } else if (activeTool === "line") {
                        const line = currentShape.current as Line;
                        line.set({ x2: pointer.x, y2: pointer.y });
                    } else if (activeTool === "circle") {
                        const circle = currentShape.current as Circle;
                        const radius = Math.sqrt(
                            Math.pow(pointer.x - startPoint.current!.x, 2) +
                            Math.pow(pointer.y - startPoint.current!.y, 2)
                        ) / 2;
                        circle.set({
                            radius,
                            left: Math.min(startPoint.current!.x, pointer.x),
                            top: Math.min(startPoint.current!.y, pointer.y),
                        });
                    } else if (activeTool === "triangle") {
                        const triangle = currentShape.current as Triangle;
                        triangle.set({
                            width: Math.abs(pointer.x - startPoint.current!.x),
                            height: Math.abs(pointer.y - startPoint.current!.y),
                            left: Math.min(startPoint.current!.x, pointer.x),
                            top: Math.min(startPoint.current!.y, pointer.y),
                        });
                    } else if (activeTool === "arrow") {
                        const group = currentShape.current as Group;
                        const line = group._objects[0] as Line;
                        const triangle = group._objects[1] as Triangle;
                        line.set({ x2: pointer.x, y2: pointer.y });
                        const angle = Math.atan2(
                            pointer.y - startPoint.current!.y,
                            pointer.x - startPoint.current!.x
                        ) * (180 / Math.PI);
                        triangle.set({
                            left: pointer.x,
                            top: pointer.y,
                            angle: angle + 90,
                        });
                        group.set({
                            left: Math.min(startPoint.current!.x, pointer.x),
                            top: Math.min(startPoint.current!.y, pointer.y),
                            width: Math.abs(pointer.x - startPoint.current!.x),
                            height: Math.abs(pointer.y - startPoint.current!.y),
                        });
                    }
                    fcanvas.renderAll();
                });
                fcanvas.on("mouse:up", () => {
                    if (currentShape.current) {
                        saveState();
                        fabricRef.current?.setActiveObject(currentShape.current);
                        fabricRef.current?.renderAll();
                    }
                    isDrawingShape.current = false;
                    currentShape.current = null;
                    startPoint.current = null;
                });
            } else {
                fcanvas.off("mouse:down");
                fcanvas.off("mouse:move");
                fcanvas.off("mouse:up");
            }
        };

        handleShapeDrawing();
    }, [activeTool, brushColor, brushWidth, brushOpacity]);

    useEffect(() => {
        updateGrid();
    }, [showGrid, theme]);

    return (
        <div className="w-full h-full flex justify-center items-center overflow-auto p-6">
            <canvas
                ref={canvasElRef}
                width={width}
                height={height}
                className="block rounded-xl shadow-inner"
                aria-label="drawing-canvas"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
        </div>
    );
});

export default Canvas;