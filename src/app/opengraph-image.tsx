import { ImageResponse } from "next/og";
export const dynamic = "force-static";
import { site } from "@/content/site";

export const alt = `${site.name} - ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fbf3e6 0%, #fffcf7 60%, #f4e6d0 100%)",
          color: "#3e2416",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 999,
            background: "#5c3a21",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fffcf7",
            fontSize: 96,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          C
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -1 }}>{site.name}</div>
        <div style={{ fontSize: 34, marginTop: 12, color: "#7a4d2b" }}>{site.tagline}</div>
        <div style={{ fontSize: 26, marginTop: 28, color: "#e85d8a", fontWeight: 700 }}>
          Orange County & Rockland County, NY
        </div>
      </div>
    ),
    { ...size }
  );
}
