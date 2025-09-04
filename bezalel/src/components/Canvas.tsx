"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Canvas as FabricJSCanvas, PencilBrush, Pattern, Path, Point } from "fabric";
import { useTheme } from "next-themes";

interface CanvasProps {
    isDrawingMode: boolean;
    setCanvasRef?: (canvas: FabricJSCanvas | null) => void;
    onPathCreated?: (path: Path) => void;
    width?: number;
    height?: number;
    brushColor?: string;
    brushWidth?: number;
    showGrid?: boolean;
}

interface PathCreatedEvent {
    path: Path;
}

const Canvas = forwardRef(function Canvas(
    {
        isDrawingMode,
        setCanvasRef,
        onPathCreated,
        width = 5000,
        height = 3500,
        brushColor = "#000000",
        brushWidth = 3,
        showGrid = true,
    }: CanvasProps,
    ref
) {
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const fabricRef = useRef<FabricJSCanvas | null>(null);
    const patternCacheRef = useRef<HTMLCanvasElement | null>(null);
    const { theme } = useTheme();

    const setZoom = (zoom: number, point?: { x: number; y: number }) => {
        if (!fabricRef.current) return;
        const zoomPoint = point
            ? new Point(point.x, point.y)
            : new Point(fabricRef.current.getWidth() / 2, fabricRef.current.getHeight() / 2);
        fabricRef.current.zoomToPoint(zoomPoint, zoom);
    };

    useImperativeHandle(ref, () => ({
        zoomIn: () => fabricRef.current && setZoom(fabricRef.current.getZoom() * 1.1),
        zoomOut: () => fabricRef.current && setZoom(fabricRef.current.getZoom() / 1.1),
        resetZoom: () => fabricRef.current && setZoom(1),
        toJSON: () => fabricRef.current?.toJSON(),
        loadFromJSON: (json: string | Record<string, unknown>) => {
            if (!fabricRef.current) return;
            fabricRef.current.loadFromJSON(json || {}, () => fabricRef.current!.renderAll());
        },
    }));

    useEffect(() => {
        if (!canvasElRef.current) return;

        const canvasElement = canvasElRef.current;
        const fcanvas = new FabricJSCanvas(canvasElement, {
            isDrawingMode,
            width,
            height,
            selection: false,
            backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
        });

        fabricRef.current = fcanvas;

        fcanvas.freeDrawingBrush = new PencilBrush(fcanvas);
        fcanvas.freeDrawingBrush.width = brushWidth;
        fcanvas.freeDrawingBrush.color = brushColor;

        if (onPathCreated) {
            fcanvas.on("path:created", (opts: PathCreatedEvent) => {
                onPathCreated(opts.path);
            });
        }

        // Grid
        const makeGridPattern = () => {
            const gridSize = 40;
            const gridCanvas = document.createElement("canvas");
            gridCanvas.width = gridSize;
            gridCanvas.height = gridSize;
            const ctx = gridCanvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, gridSize, gridSize);
                ctx.fillStyle = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
                ctx.beginPath();
                ctx.arc(gridSize / 2, gridSize / 2, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
            return gridCanvas;
        };

        patternCacheRef.current = makeGridPattern();

        if (showGrid && patternCacheRef.current) {
            fcanvas.set("backgroundColor", new Pattern({ source: patternCacheRef.current, repeat: "repeat" }));
        }

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

        return () => {
            fcanvas.dispose();
            if (setCanvasRef) setCanvasRef(null);
            canvasElement.removeEventListener("wheel", wheelHandler);
        };
    }, []);

    // Dynamic updates
    useEffect(() => {
        if (fabricRef.current) fabricRef.current.isDrawingMode = isDrawingMode;
    }, [isDrawingMode]);

    useEffect(() => {
        if (fabricRef.current?.freeDrawingBrush) fabricRef.current.freeDrawingBrush.color = brushColor;
    }, [brushColor]);

    useEffect(() => {
        if (fabricRef.current?.freeDrawingBrush) fabricRef.current.freeDrawingBrush.width = brushWidth;
    }, [brushWidth]);

    useEffect(() => {
        if (!fabricRef.current) return;
        if (showGrid && patternCacheRef.current) {
            fabricRef.current.set("backgroundColor", new Pattern({ source: patternCacheRef.current, repeat: "repeat" }));
        } else {
            fabricRef.current.set("backgroundColor", theme === "dark" ? "#1a1a1a" : "#ffffff");
        }
        fabricRef.current.renderAll();
    }, [showGrid, theme]);

    return (
        <div className="w-full h-full flex justify-center items-center overflow-auto p-6">
            <canvas
                ref={canvasElRef}
                width={width}
                height={height}
                className="block rounded-xl border border-gray-200 shadow-inner"
                aria-label="drawing-canvas"
            />
        </div>
    );
});

export default Canvas;