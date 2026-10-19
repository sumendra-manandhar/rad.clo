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
  /** Built onto the garment but not shown (e.g. the next design, ready for an instant swap) */
  hidden?: boolean;
  /** Artwork width ÷ height; when given, a design scaled past its area is cropped to it */
  aspect?: number;
};

export type TShirtViewerProps = {
  /** 3D model to show: "tee" (default) or "hoodie" */
  model?: "tee" | "hoodie";
  /**
   * Customize page: stage lighting (spotlight and rim lights), and close zoom
   * — the view glides up to the chest as the customer zooms in
   */
  studio?: boolean;
  /**
   * Plays the 10-second cinematic camera move round the garment once when set
   * to a new number above 0; 0 stops it and hands the camera back.
   */
  showcase?: number;
  /** Called when the showcase has played through */
  onShowcaseEnd?: () => void;
  /** Resting angle in degrees: the garment faces the viewer turned this much (spins end here too) */
  slant?: number;
  /** Resting camera distance (default view ≈ 3.3) */
  restDistance?: number;
  /** Called with a print's id once its artwork is loaded and built onto the garment */
  onPrintLoaded?: (id: string) => void;
  /** Camera distance mid-spin (default ≈ 3.3); closer zooms in during the turn, then back to rest */
  spinDistance?: number;
  color: string;
  prints?: ViewerPrint[];
  view?: PrintView | null;
  /** Change to re-focus the same view */
  viewNonce?: number;
  autoRotate?: boolean;
  /** Called once the shirt and every print's artwork are loaded and drawn */
  onReady?: () => void;
  /** Change this number to spin the shirt one full turn */
  spin?: number;
  /** Called mid-spin, when the back faces the camera */
  onSpinHalfway?: () => void;
  /** Called with a print's id when the customer taps it on the shirt */
  onSelectPrint?: (id: string) => void;
};

declare const TShirtViewer: React.FC<TShirtViewerProps>;
export default TShirtViewer;
