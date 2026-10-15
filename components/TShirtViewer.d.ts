import * as React from "react";
import type { PrintView } from "@/lib/print-locations";
import type { PrintPlacement } from "@/lib/types";

export type ViewerPrint = {
  /** Stable key when a piece has several prints */
  id?: string;
  /** Print location id from lib/print-locations */
  location: string;
  /** Image URL or data URL */
  src: string;
  /** Position on the piece (see lib/print-locations) */
  placement?: PrintPlacement;
};

export type TShirtViewerProps = {
  color: string;
  prints?: ViewerPrint[];
  view?: PrintView | null;
  /** Change to re-focus the same view */
  viewNonce?: number;
  autoRotate?: boolean;
};

declare const TShirtViewer: React.FC<TShirtViewerProps>;
export default TShirtViewer;
