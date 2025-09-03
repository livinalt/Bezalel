(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/Canvas.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$fabric$2f$dist$2f$index$2e$min$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/fabric/dist/index.min.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
// ForwardRef so parent (Board) can call zoomIn/zoomOut
const Canvas = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = _s(function Canvas(param, ref) {
    let { isDrawingMode, setCanvasRef, onPathCreated, width = 5000, height = 3500, brushColor = "#000000", brushWidth = 3, showGrid = true } = param;
    _s();
    const canvasElRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fabricRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const patternCacheRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // --- helper: apply zoom ---
    const setZoom = (zoom, point)=>{
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        if (!point) {
            point = {
                x: canvas.getWidth() / 2,
                y: canvas.getHeight() / 2
            };
        }
        canvas.zoomToPoint(point, zoom);
    };
    // Expose zoom methods to parent
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useImperativeHandle"])(ref, {
        "Canvas.Canvas.useImperativeHandle": ()=>({
                zoomIn: ({
                    "Canvas.Canvas.useImperativeHandle": ()=>{
                        if (fabricRef.current) {
                            const zoom = fabricRef.current.getZoom() * 1.1;
                            setZoom(Math.min(zoom, 4));
                        }
                    }
                })["Canvas.Canvas.useImperativeHandle"],
                zoomOut: ({
                    "Canvas.Canvas.useImperativeHandle": ()=>{
                        if (fabricRef.current) {
                            const zoom = fabricRef.current.getZoom() / 1.1;
                            setZoom(Math.max(zoom, 0.2));
                        }
                    }
                })["Canvas.Canvas.useImperativeHandle"],
                resetZoom: ({
                    "Canvas.Canvas.useImperativeHandle": ()=>{
                        if (fabricRef.current) {
                            setZoom(1);
                        }
                    }
                })["Canvas.Canvas.useImperativeHandle"]
            })
    }["Canvas.Canvas.useImperativeHandle"]);
    // Initialize Fabric canvas (once)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Canvas.Canvas.useEffect": ()=>{
            var _canvasElRef_current;
            if (!canvasElRef.current) return;
            const fcanvas = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$fabric$2f$dist$2f$index$2e$min$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Canvas"](canvasElRef.current, {
                isDrawingMode,
                width,
                height,
                selection: false,
                backgroundColor: "#ffffff"
            });
            fabricRef.current = fcanvas;
            fcanvas.freeDrawingBrush = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$fabric$2f$dist$2f$index$2e$min$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PencilBrush"](fcanvas);
            fcanvas.freeDrawingBrush.width = brushWidth;
            fcanvas.freeDrawingBrush.color = brushColor;
            if (onPathCreated) {
                fcanvas.on("path:created", {
                    "Canvas.Canvas.useEffect": (opts)=>{
                        const path = opts.path;
                        if (path) onPathCreated(path);
                    }
                }["Canvas.Canvas.useEffect"]);
            }
            // Make subtle dot grid
            const makeGridPattern = {
                "Canvas.Canvas.useEffect.makeGridPattern": ()=>{
                    const gridSize = 40;
                    const gridCanvas = document.createElement("canvas");
                    gridCanvas.width = gridSize;
                    gridCanvas.height = gridSize;
                    const ctx = gridCanvas.getContext("2d");
                    if (ctx) {
                        ctx.clearRect(0, 0, gridSize, gridSize);
                        ctx.fillStyle = "rgba(0,0,0,0.06)";
                        ctx.beginPath();
                        ctx.arc(gridSize / 2, gridSize / 2, 0.8, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    return gridCanvas;
                }
            }["Canvas.Canvas.useEffect.makeGridPattern"];
            patternCacheRef.current = makeGridPattern();
            if (showGrid && patternCacheRef.current) {
                fcanvas.set("backgroundColor", new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$fabric$2f$dist$2f$index$2e$min$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Pattern"]({
                    source: patternCacheRef.current,
                    repeat: "repeat"
                }));
            }
            if (setCanvasRef) setCanvasRef(fcanvas);
            // --- Zoom with Ctrl + Scroll ---
            const wheelHandler = {
                "Canvas.Canvas.useEffect.wheelHandler": (opt)=>{
                    if (!fabricRef.current) return;
                    if (!(opt.ctrlKey || opt.metaKey)) return; // only when holding ctrl/cmd
                    opt.preventDefault();
                    let zoom = fabricRef.current.getZoom();
                    zoom *= 0.999 ** opt.deltaY; // smooth zoom
                    zoom = Math.min(Math.max(zoom, 0.2), 4); // clamp
                    const point = {
                        x: opt.offsetX,
                        y: opt.offsetY
                    };
                    setZoom(zoom, point);
                }
            }["Canvas.Canvas.useEffect.wheelHandler"];
            (_canvasElRef_current = canvasElRef.current) === null || _canvasElRef_current === void 0 ? void 0 : _canvasElRef_current.addEventListener("wheel", wheelHandler, {
                passive: false
            });
            return ({
                "Canvas.Canvas.useEffect": ()=>{
                    var _canvasElRef_current;
                    fcanvas.dispose();
                    if (setCanvasRef) setCanvasRef(null);
                    (_canvasElRef_current = canvasElRef.current) === null || _canvasElRef_current === void 0 ? void 0 : _canvasElRef_current.removeEventListener("wheel", wheelHandler);
                }
            })["Canvas.Canvas.useEffect"];
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["Canvas.Canvas.useEffect"], []);
    // update brush & mode dynamically
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Canvas.Canvas.useEffect": ()=>{
            if (fabricRef.current) fabricRef.current.isDrawingMode = isDrawingMode;
        }
    }["Canvas.Canvas.useEffect"], [
        isDrawingMode
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Canvas.Canvas.useEffect": ()=>{
            var _fabricRef_current;
            if ((_fabricRef_current = fabricRef.current) === null || _fabricRef_current === void 0 ? void 0 : _fabricRef_current.freeDrawingBrush) fabricRef.current.freeDrawingBrush.color = brushColor;
        }
    }["Canvas.Canvas.useEffect"], [
        brushColor
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Canvas.Canvas.useEffect": ()=>{
            var _fabricRef_current;
            if ((_fabricRef_current = fabricRef.current) === null || _fabricRef_current === void 0 ? void 0 : _fabricRef_current.freeDrawingBrush) fabricRef.current.freeDrawingBrush.width = brushWidth !== null && brushWidth !== void 0 ? brushWidth : 3;
        }
    }["Canvas.Canvas.useEffect"], [
        brushWidth
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Canvas.Canvas.useEffect": ()=>{
            if (!fabricRef.current) return;
            if (showGrid && patternCacheRef.current) {
                fabricRef.current.set("backgroundColor", new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$fabric$2f$dist$2f$index$2e$min$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Pattern"]({
                    source: patternCacheRef.current,
                    repeat: "repeat"
                }));
            } else {
                fabricRef.current.set("backgroundColor", "#ffffff");
            }
            fabricRef.current.renderAll();
        }
    }["Canvas.Canvas.useEffect"], [
        showGrid
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full flex justify-center items-center overflow-auto p-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
            ref: canvasElRef,
            width: width,
            height: height,
            className: "block rounded-xl border border-gray-200 shadow-inner",
            "aria-label": "drawing-canvas"
        }, void 0, false, {
            fileName: "[project]/src/components/Canvas.tsx",
            lineNumber: 165,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/Canvas.tsx",
        lineNumber: 164,
        columnNumber: 9
    }, this);
}, "e1HWBGVCSSdYSRhzl6y8lID1yQY=")), "e1HWBGVCSSdYSRhzl6y8lID1yQY=");
_c1 = Canvas;
const __TURBOPACK__default__export__ = Canvas;
var _c, _c1;
__turbopack_context__.k.register(_c, "Canvas$forwardRef");
__turbopack_context__.k.register(_c1, "Canvas");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/board/[roomId]/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Board
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Canvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Canvas.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript) <export default as Pencil>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hand$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Hand$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/hand.js [app-client] (ecmascript) <export default as Hand>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$undo$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Undo2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/undo-2.js [app-client] (ecmascript) <export default as Undo2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$redo$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Redo2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/redo-2.js [app-client] (ecmascript) <export default as Redo2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/monitor.js [app-client] (ecmascript) <export default as Monitor>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grid$2d$3x3$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Grid$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/grid-3x3.js [app-client] (ecmascript) <export default as Grid>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$in$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomIn$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zoom-in.js [app-client] (ecmascript) <export default as ZoomIn>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zoom-out.js [app-client] (ecmascript) <export default as ZoomOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function Board() {
    _s();
    const { roomId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const socketRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pcRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // UI / drawing state
    const [isStreaming, setIsStreaming] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [viewerCount, setViewerCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [aiPrompt, setAiPrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isDrawingMode, setIsDrawingMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [brushColor, setBrushColor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("#000000");
    const [brushWidth, setBrushWidth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(3);
    const [viewUrl, setViewUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(""); // set only on client
    const [showGrid, setShowGrid] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true); // Figma-style grid toggle
    const canvasComponentRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Undo / redo stacks (store Fabric objects)
    const undoStack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const redoStack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    // Pages state
    const [pages, setPages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([
        {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            name: "Page 1",
            canvasData: null
        }
    ]);
    const [activePageId, setActivePageId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(pages[0].id);
    // --- Page management handlers ---
    const handleAddPage = ()=>{
        const newPage = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            name: "Page ".concat(pages.length + 1),
            canvasData: null
        };
        setPages((prev)=>[
                ...prev,
                newPage
            ]);
        setActivePageId(newPage.id);
    };
    const handleRenamePage = (id, newName)=>{
        setPages((prev)=>prev.map((p)=>p.id === id ? {
                    ...p,
                    name: newName
                } : p));
    };
    const handleDeletePage = (id)=>{
        setPages((prev)=>prev.filter((p)=>p.id !== id));
        if (activePageId === id && pages.length > 1) {
            setActivePageId(pages.find((p)=>p.id !== id).id);
        }
    };
    // --- Safe window usage (SSR-safe) ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Board.useEffect": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                setViewUrl("".concat(window.location.origin, "/board/").concat(roomId, "/view"));
            }
        }
    }["Board.useEffect"], [
        roomId
    ]);
    // --- Socket.io setup ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Board.useEffect": ()=>{
            const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3000");
            socketRef.current = socket;
            socket.on("connect", {
                "Board.useEffect": ()=>{
                    socket.emit("joinSession", roomId);
                }
            }["Board.useEffect"]);
            socket.on("viewerCount", {
                "Board.useEffect": (count)=>{
                    setViewerCount(count);
                }
            }["Board.useEffect"]);
            return ({
                "Board.useEffect": ()=>{
                    socket.disconnect();
                }
            })["Board.useEffect"];
        }
    }["Board.useEffect"], [
        roomId
    ]);
    // --- WebRTC streaming (canvas + optional webcam) ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Board.useEffect": ()=>{
            var _getElement, _this, _socketRef_current, _socketRef_current1;
            if (!isStreaming || !canvasRef.current || !videoRef.current) return;
            const pc = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com:19302"
                    }
                ]
            });
            pcRef.current = pc;
            var // @ts-expect-error - try known properties
            _lowerCanvasEl;
            // get actual canvas element (some Fabric versions expose lowerCanvasEl)
            const canvasElement = (_lowerCanvasEl = canvasRef.current.lowerCanvasEl) !== null && _lowerCanvasEl !== void 0 ? _lowerCanvasEl : (_getElement = (_this = canvasRef.current).getElement) === null || _getElement === void 0 ? void 0 : _getElement.call(_this);
            if (!canvasElement || typeof canvasElement.captureStream !== "function") {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error("Streaming not supported: unable to capture canvas stream.");
                return;
            }
            const canvasStream = canvasElement.captureStream(30);
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then({
                "Board.useEffect": (webcamStream)=>{
                    const combined = new MediaStream();
                    canvasStream.getVideoTracks().forEach({
                        "Board.useEffect": (t)=>combined.addTrack(t)
                    }["Board.useEffect"]);
                    webcamStream.getVideoTracks().forEach({
                        "Board.useEffect": (t)=>combined.addTrack(t)
                    }["Board.useEffect"]);
                    webcamStream.getAudioTracks().forEach({
                        "Board.useEffect": (t)=>combined.addTrack(t)
                    }["Board.useEffect"]);
                    combined.getTracks().forEach({
                        "Board.useEffect": (t)=>pc.addTrack(t, combined)
                    }["Board.useEffect"]);
                    videoRef.current.srcObject = combined;
                }
            }["Board.useEffect"]).catch({
                "Board.useEffect": (err)=>{
                    console.error("webcam error", err);
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error("Could not access webcam — streaming canvas only.");
                    canvasStream.getTracks().forEach({
                        "Board.useEffect": (t)=>pc.addTrack(t, canvasStream)
                    }["Board.useEffect"]);
                }
            }["Board.useEffect"]);
            pc.onicecandidate = ({
                "Board.useEffect": (ev)=>{
                    if (ev.candidate) {
                        var _socketRef_current;
                        (_socketRef_current = socketRef.current) === null || _socketRef_current === void 0 ? void 0 : _socketRef_current.emit("ice-candidate", {
                            sessionId: roomId,
                            candidate: ev.candidate
                        });
                    }
                }
            })["Board.useEffect"];
            (_socketRef_current = socketRef.current) === null || _socketRef_current === void 0 ? void 0 : _socketRef_current.on("answer", {
                "Board.useEffect": async (answer)=>{
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                }
            }["Board.useEffect"]);
            (_socketRef_current1 = socketRef.current) === null || _socketRef_current1 === void 0 ? void 0 : _socketRef_current1.on("ice-candidate", {
                "Board.useEffect": async (candidate)=>{
                    if (pcRef.current) {
                        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                }
            }["Board.useEffect"]);
            pc.createOffer().then({
                "Board.useEffect": (offer)=>{
                    var _socketRef_current;
                    pc.setLocalDescription(offer);
                    (_socketRef_current = socketRef.current) === null || _socketRef_current === void 0 ? void 0 : _socketRef_current.emit("offer", {
                        sessionId: roomId,
                        offer
                    });
                }
            }["Board.useEffect"]);
            return ({
                "Board.useEffect": ()=>{
                    pc.close();
                    // ✅ Safe cleanup to avoid null crash
                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                    }
                }
            })["Board.useEffect"];
        }
    }["Board.useEffect"], [
        isStreaming,
        roomId
    ]);
    // --- Path created (for undo stack) ---
    const handlePathCreated = (path)=>{
        if (canvasRef.current && path) {
            undoStack.current.push(path);
            redoStack.current = [];
        }
    };
    // Undo / Redo
    const handleUndo = ()=>{
        if (!canvasRef.current) return;
        const last = undoStack.current.pop();
        if (last) {
            var _canvasRef_current_requestRenderAll, _canvasRef_current;
            redoStack.current.push(last);
            canvasRef.current.remove(last);
            (_canvasRef_current_requestRenderAll = (_canvasRef_current = canvasRef.current).requestRenderAll) === null || _canvasRef_current_requestRenderAll === void 0 ? void 0 : _canvasRef_current_requestRenderAll.call(_canvasRef_current);
        }
    };
    const handleRedo = ()=>{
        if (!canvasRef.current) return;
        const last = redoStack.current.pop();
        if (last) {
            var _canvasRef_current_requestRenderAll, _canvasRef_current;
            undoStack.current.push(last);
            canvasRef.current.add(last);
            (_canvasRef_current_requestRenderAll = (_canvasRef_current = canvasRef.current).requestRenderAll) === null || _canvasRef_current_requestRenderAll === void 0 ? void 0 : _canvasRef_current_requestRenderAll.call(_canvasRef_current);
        }
    };
    const handleEnhance = ()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].info("AI enhancement not implemented yet.");
    };
    const copyLink = ()=>{
        if (!viewUrl) return;
        navigator.clipboard.writeText(viewUrl);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success("View link copied to clipboard!");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-screen h-screen bg-neutral-100",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 bg-white/80 backdrop-blur-md border-b border-gray-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-sm font-semibold text-gray-800",
                                children: "Bezalel Board"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 201,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-500",
                                children: [
                                    "/ ",
                                    roomId
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 202,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/board/[roomId]/page.tsx",
                        lineNumber: 200,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: viewUrl,
                                readOnly: true,
                                className: "text-xs text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 w-64 focus:outline-none focus:ring-2 focus:ring-blue-400",
                                "aria-label": "view link"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 206,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: copyLink,
                                className: "inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition",
                                children: "Copy"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 213,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-600 px-2",
                                children: [
                                    "👀 ",
                                    viewerCount,
                                    " viewer",
                                    viewerCount === 1 ? "" : "s"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 220,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/board/[roomId]/page.tsx",
                        lineNumber: 205,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                lineNumber: 199,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "absolute top-14 bottom-0 left-0 right-0 flex",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 flex items-center justify-center overflow-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Canvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            ref: canvasComponentRef,
                            isDrawingMode: isDrawingMode,
                            setCanvasRef: (c)=>canvasRef.current = c,
                            onPathCreated: handlePathCreated,
                            width: 5000,
                            height: 3500,
                            brushColor: brushColor,
                            brushWidth: brushWidth,
                            showGrid: showGrid
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 230,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/board/[roomId]/page.tsx",
                        lineNumber: 229,
                        columnNumber: 17
                    }, this),
                    isStreaming && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "w-64 p-3 border-l border-gray-100 bg-white/60",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                            ref: videoRef,
                            autoPlay: true,
                            muted: true,
                            className: "w-full h-40 rounded-md object-cover"
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 246,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/board/[roomId]/page.tsx",
                        lineNumber: 245,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                lineNumber: 225,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 rounded-lg bg-white/95 backdrop-blur-md border border-gray-200 shadow-md px-2 py-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            title: isDrawingMode ? "Drawing" : "Pan",
                            onClick: ()=>setIsDrawingMode((s)=>!s),
                            className: "p-2 rounded-md hover:bg-gray-100 transition ".concat(isDrawingMode ? "bg-gray-100" : ""),
                            children: isDrawingMode ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                className: "w-4 h-4 text-gray-800"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 260,
                                columnNumber: 42
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hand$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Hand$3e$__["Hand"], {
                                className: "w-4 h-4 text-gray-800"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 260,
                                columnNumber: 89
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 255,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            title: "Brush color",
                            type: "color",
                            value: brushColor,
                            onChange: (e)=>setBrushColor(e.target.value),
                            className: "w-7 h-7 rounded-md border border-gray-200"
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 264,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            title: "Brush size",
                            type: "range",
                            min: 1,
                            max: 40,
                            value: brushWidth,
                            onChange: (e)=>setBrushWidth(Number(e.target.value)),
                            className: "w-24 accent-blue-500"
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 273,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-px h-6 bg-gray-200 mx-2"
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 283,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            title: "Undo",
                            onClick: handleUndo,
                            className: "p-2 rounded-md hover:bg-gray-100",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$undo$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Undo2$3e$__["Undo2"], {
                                className: "w-4 h-4 text-gray-800"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 287,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 286,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            title: "Redo",
                            onClick: handleRedo,
                            className: "p-2 rounded-md hover:bg-gray-100",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$redo$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Redo2$3e$__["Redo2"], {
                                className: "w-4 h-4 text-gray-800"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 290,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 289,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-px h-6 bg-gray-200 mx-2"
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 293,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            title: "Zoom Out",
                            onClick: ()=>{
                                var _canvasComponentRef_current;
                                return (_canvasComponentRef_current = canvasComponentRef.current) === null || _canvasComponentRef_current === void 0 ? void 0 : _canvasComponentRef_current.zoomOut();
                            },
                            className: "p-2 rounded-md hover:bg-gray-100",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomOut$3e$__["ZoomOut"], {
                                className: "w-4 h-4 text-gray-800"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 301,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 296,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            title: "Zoom In",
                            onClick: ()=>{
                                var _canvasComponentRef_current;
                                return (_canvasComponentRef_current = canvasComponentRef.current) === null || _canvasComponentRef_current === void 0 ? void 0 : _canvasComponentRef_current.zoomIn();
                            },
                            className: "p-2 rounded-md hover:bg-gray-100",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$in$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomIn$3e$__["ZoomIn"], {
                                className: "w-4 h-4 text-gray-800"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 308,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 303,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            title: "AI prompt",
                            placeholder: "AI prompt",
                            value: aiPrompt,
                            onChange: (e)=>setAiPrompt(e.target.value),
                            className: "text-xs text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 w-44 focus:outline-none focus:ring-1 focus:ring-green-400"
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 312,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            title: "Enhance",
                            onClick: handleEnhance,
                            className: "p-2 rounded-md hover:bg-green-50",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                className: "w-4 h-4 text-green-600"
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 320,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 319,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-px h-6 bg-gray-200 mx-2"
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 323,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            title: "Toggle grid",
                            onClick: ()=>setShowGrid((s)=>!s),
                            className: "p-2 rounded-md hover:bg-gray-100 transition ".concat(showGrid ? "bg-gray-100" : ""),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grid$2d$3x3$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Grid$3e$__["Grid"], {
                                className: "w-4 h-4 ".concat(showGrid ? "text-gray-800" : "text-gray-500")
                            }, void 0, false, {
                                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                lineNumber: 331,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 326,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-px h-6 bg-gray-200 mx-2"
                        }, void 0, false, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 334,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "flex items-center gap-2 text-xs text-gray-700 cursor-pointer",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: isStreaming,
                                    onChange: (e)=>setIsStreaming(e.target.checked),
                                    className: "w-4 h-4 accent-blue-500"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                    lineNumber: 338,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__["Monitor"], {
                                    className: "w-4 h-4 text-gray-700"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/board/[roomId]/page.tsx",
                                    lineNumber: 344,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/board/[roomId]/page.tsx",
                            lineNumber: 337,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/board/[roomId]/page.tsx",
                    lineNumber: 253,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/board/[roomId]/page.tsx",
                lineNumber: 252,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/board/[roomId]/page.tsx",
        lineNumber: 197,
        columnNumber: 9
    }, this);
}
_s(Board, "96S7PTzB8HXEVHcmsh1t3b71jmo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"]
    ];
});
_c = Board;
var _c;
__turbopack_context__.k.register(_c, "Board");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_1ae28d1e._.js.map