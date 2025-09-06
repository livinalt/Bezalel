// utils/canvasTools.ts
import * as fabric from "fabric";

export type ToolType =
  | "select"
  | "pencil"
  | "eraser"
  | "pan"
  | "rectangle"
  | "circle"
  | "line"
  | "triangle"
  | "arrow";

// Add a rectangle
export function addRectangle(
  canvas: fabric.Canvas,
  color: string,
  width: number
) {
  canvas.isDrawingMode = false;
  const rect = new fabric.Rect({
    left: 100,
    top: 100,
    width: 120,
    height: 80,
    fill: "transparent",
    stroke: color,
    strokeWidth: width,
    selectable: true,
  });
  canvas.add(rect);
  canvas.setActiveObject(rect);
}

// Add a circle
export function addCircle(canvas: fabric.Canvas, color: string, width: number) {
  canvas.isDrawingMode = false;
  const circle = new fabric.Circle({
    left: 150,
    top: 150,
    radius: 50,
    fill: "transparent",
    stroke: color,
    strokeWidth: width,
    selectable: true,
  });
  canvas.add(circle);
  canvas.setActiveObject(circle);
}

// Add a line
export function addLine(canvas: fabric.Canvas, color: string, width: number) {
  canvas.isDrawingMode = false;
  const line = new fabric.Line([50, 50, 200, 200], {
    stroke: color,
    strokeWidth: width,
    selectable: true,
  });
  canvas.add(line);
  canvas.setActiveObject(line);
}

// Add a triangle
export function addTriangle(
  canvas: fabric.Canvas,
  color: string,
  width: number
) {
  canvas.isDrawingMode = false;
  const triangle = new fabric.Triangle({
    left: 100,
    top: 100,
    width: 100,
    height: 100,
    fill: "transparent",
    stroke: color,
    strokeWidth: width,
    selectable: true,
  });
  canvas.add(triangle);
  canvas.setActiveObject(triangle);
}

// Add an arrow (simple line + triangle marker)
export function addArrow(canvas: fabric.Canvas, color: string, width: number) {
  canvas.isDrawingMode = false;
  const line = new fabric.Line([50, 50, 200, 200], {
    stroke: color,
    strokeWidth: width,
    selectable: true,
  });

  const head = new fabric.Triangle({
    left: 200,
    top: 200,
    originX: "center",
    originY: "center",
    angle: 90,
    width: 15,
    height: 20,
    fill: color,
    selectable: true,
  });

  const group = new fabric.Group([line, head], { selectable: true });
  canvas.add(group);
  canvas.setActiveObject(group);
}
