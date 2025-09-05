export interface ExtendedFabricCanvas extends fabric.Canvas {
  undo?: () => void;
  redo?: () => void;
}
