import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { MISSIONS, isMissionKey } from "@/lib/missions";
import { fmtDelta } from "@/lib/format";

// Renders a shareable before/after swap card as a PNG. The user shares this
// image outward (Web Share / download) — recipients get the image, so nothing
// member-private is exposed; the card just nudges them toward the landing page.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const original = (sp.get("o") ?? "your pick").slice(0, 60);
  const swap = (sp.get("s") ?? "a better pick").slice(0, 60);
  const mRaw = sp.get("m") ?? "calories";
  const mission = MISSIONS[isMissionKey(mRaw) ? mRaw : "calories"];
  const delta = fmtDelta(mission.key, Number(sp.get("d") ?? "0"));

  const CREAM = "#fbf7ef";
  const INK = "#1a2420";
  const SOFT = "#51605a";
  const BRAND = "#1f9d57";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: CREAM,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800, color: INK }}>
            <div
              style={{
                display: "flex",
                width: 44,
                height: 44,
                backgroundColor: BRAND,
                borderRadius: 14,
                marginRight: 16,
              }}
            />
            Swap
            <span style={{ color: BRAND }}>This</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#e4f4e9",
              color: "#15793f",
              fontSize: 26,
              fontWeight: 700,
              padding: "10px 22px",
              borderRadius: 999,
            }}
          >
            {mission.emoji} {mission.label}
          </div>
        </div>

        {/* body */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 30, color: SOFT, marginBottom: 18 }}>I swapped</div>
          <div
            style={{
              display: "flex",
              fontSize: 46,
              color: SOFT,
              textDecoration: "line-through",
              marginBottom: 10,
            }}
          >
            {original}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: BRAND, marginRight: 18 }}>
              →
            </div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: INK }}>{swap}</div>
          </div>
        </div>

        {/* delta + footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              backgroundColor: BRAND,
              color: "white",
              fontSize: 52,
              fontWeight: 800,
              padding: "16px 40px",
              borderRadius: 999,
            }}
          >
            {delta}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: SOFT }}>
            Find your better swap → swapthis
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
