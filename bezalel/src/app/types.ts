// src/types.ts
import { Canvas as FabricJSCanvas } from "fabric";

export type CanvasData = Record<string, unknown>;

export type PageData = {
  id: string;
  name: string;
  canvasData: CanvasData | null;
};

export interface ExtendedFabricCanvas extends FabricJSCanvas {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toJSON: () => Record<string, unknown> | undefined;
  loadFromJSON: (
    json: string | Record<string, unknown>
  ) => Promise<ExtendedFabricCanvas>;
  clone(properties: string[]): Promise<ExtendedFabricCanvas>;
  cloneWithoutData(): ExtendedFabricCanvas;
}
