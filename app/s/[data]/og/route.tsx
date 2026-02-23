import { ImageResponse } from "next/og";
import { decodeBreakdown } from "../../../lib/encoding";

export const runtime = "edge";

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  protocol: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  host: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  port: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  pathname: { bg: "#f3e8ff", text: "#6b21a8", border: "#d8b4fe" },
  "search-param": { bg: "#ffedd5", text: "#9a3412", border: "#fdba74" },
  hash: { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  custom: { bg: "#f4f4f5", text: "#3f3f46", border: "#d4d4d8" },
};

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

  const segments = breakdown.segments.slice(0, 6);

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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#18181b",
              marginBottom: "12px",
            }}
          >
            URL Explainer
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#71717a",
              fontFamily: "monospace",
              wordBreak: "break-all",
              maxWidth: "1080px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {breakdown.originalUrl.length > 100
              ? breakdown.originalUrl.slice(0, 100) + "…"
              : breakdown.originalUrl}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flex: 1,
          }}
        >
          {segments.map((seg, i) => {
            const colors = TYPE_COLORS[seg.type] || TYPE_COLORS.custom;
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
                    minWidth: "100px",
                  }}
                >
                  {seg.label}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontFamily: "monospace",
                    color: colors.text,
                    fontWeight: 600,
                  }}
                >
                  {seg.value.length > 40 ? seg.value.slice(0, 40) + "…" : seg.value}
                </div>
                {seg.description && (
                  <div
                    style={{
                      fontSize: 14,
                      color: colors.text,
                      opacity: 0.6,
                      marginLeft: "auto",
                    }}
                  >
                    {seg.description.length > 50
                      ? seg.description.slice(0, 50) + "…"
                      : seg.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {breakdown.segments.length > 6 && (
          <div style={{ fontSize: 14, color: "#a1a1aa", marginTop: "8px" }}>
            +{breakdown.segments.length - 6} more segments
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
