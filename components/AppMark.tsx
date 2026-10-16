/** The Rad.Clo app icon artwork (rendered to PNG with next/og). */
export function AppMark({ px }: { px: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111111",
        color: "#d4ff3a",
        fontSize: px * 0.56,
        fontWeight: 900,
        letterSpacing: -px * 0.03,
      }}
    >
      R<span style={{ color: "#2f6bff" }}>.</span>
    </div>
  );
}
