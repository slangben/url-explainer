import { ImageResponse } from "next/og";
import { decodeBreakdown } from "../../../lib/encoding";
import { getSegmentColorHex, sortSegments } from "../../../lib/segment-colors";
import { colorizeUrl } from "../../../lib/colorize-url";
import { UrlSegment } from "../../../lib/types";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ data: string }> }
) {
  const { data } = await params;
  const breakdown = decodeBreakdown(decodeURIComponent(data));

  if (!breakdown) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fafafa",
            fontSize: 32,
            color: "#71717a",
          }}
        >
          Invalid URL breakdown
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const visible = sortSegments(breakdown.segments)
    .filter((s) => s.type !== "protocol" && s.type !== "host")
    .slice(0, 6);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fafafa",
          padding: "60px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: "32px" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#18181b", marginBottom: "12px" }}>
            URL Explainer
          </div>
          <div
            style={{
              fontSize: 24,
              fontFamily: "monospace",
              maxWidth: "1080px",
              display: "flex",
              flexWrap: "wrap",
              gap: "2px",
            }}
          >
            {colorizeUrl(breakdown.originalUrl, breakdown.segments).map((piece, i) => {
              const text = piece.text.length > 30 ? piece.text.slice(0, 30) + "…" : piece.text;
              if (!piece.segment) {
                return (
                  <span key={i} style={{ color: "#a1a1aa" }}>{text}</span>
                );
              }
              const colors = getSegmentColorHex(piece.segment, breakdown.segments);
              return (
                <span
                  key={i}
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderRadius: "4px",
                    padding: "1px 4px",
                  }}
                >
                  {text}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
          {visible.map((seg: UrlSegment, i: number) => {
            const colors = getSegmentColorHex(seg, breakdown.segments);
            const isParam = seg.type === "search-param";
            const eqIdx = seg.value.indexOf("=");
            const paramKey = isParam ? (eqIdx === -1 ? seg.value : seg.value.slice(0, eqIdx)) : "";
            const paramVal = isParam ? (eqIdx === -1 ? "" : seg.value.slice(eqIdx + 1)) : "";

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  backgroundColor: colors.bg,
                  border: `2px solid ${colors.border}`,
                  borderRadius: "12px",
                  padding: "14px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: colors.text,
                    opacity: 0.7,
                    minWidth: "80px",
                  }}
                >
                  {isParam ? "Param" : seg.label}
                </div>
                {isParam ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "monospace", fontSize: 16, color: colors.text, fontWeight: 600 }}>
                    <span>{paramKey.length > 20 ? paramKey.slice(0, 20) + "…" : paramKey}</span>
                    <span style={{ opacity: 0.5 }}>=</span>
                    <span>{paramVal.length > 30 ? paramVal.slice(0, 30) + "…" : paramVal}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 16, fontFamily: "monospace", color: colors.text, fontWeight: 600 }}>
                    {seg.value.length > 40 ? seg.value.slice(0, 40) + "…" : seg.value}
                  </div>
                )}
                {seg.description && (
                  <div style={{ fontSize: 14, color: colors.text, opacity: 0.6, marginLeft: "auto" }}>
                    {seg.description.length > 50 ? seg.description.slice(0, 50) + "…" : seg.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {visible.length < sortSegments(breakdown.segments).filter((s) => s.type !== "protocol" && s.type !== "host").length && (
          <div style={{ fontSize: 14, color: "#a1a1aa", marginTop: "8px" }}>
            +{sortSegments(breakdown.segments).filter((s) => s.type !== "protocol" && s.type !== "host").length - visible.length} more segments
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
