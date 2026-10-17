import { ImageResponse } from "next/og";

// The preview card shown when a link is shared on Facebook, WhatsApp, Viber etc.
export const alt = "Rad.Clo — Custom t-shirt printing in Nepal with live 3D preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111111",
          color: "#ffffff",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 900, color: "#d4ff3a" }}>
          Rad<span style={{ color: "#2f6bff" }}>.</span>Clo
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 96, fontWeight: 900, lineHeight: 0.95, letterSpacing: -3 }}>
          <span>CUSTOM T-SHIRTS</span>
          <span style={{ color: "#d4ff3a" }}>PRINTED IN NEPAL.</span>
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.65)" }}>
          Design in 3D · No minimum order · Bulk pricing · Delivery across Nepal
        </div>
      </div>
    ),
    size,
  );
}
