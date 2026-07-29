import * as React from "react";

export type ShirtDecalConfig = {
  src: string;
  scale?: number;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
  side?: "front" | "back";
};

export type TShirtViewerProps = {
  color: string;
  decal?: ShirtDecalConfig | null;
  autoRotate?: boolean;
};

declare const TShirtViewer: React.FC<TShirtViewerProps>;
export default TShirtViewer;
