import type { Activity, RoutePoint } from "./types";

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function toGpx(activity: Activity, points: RoutePoint[], name: string): string {
  const trkpts = points
    .map(([lat, lon, t, alt]) => {
      const ele = alt == null ? "" : `<ele>${alt.toFixed(1)}</ele>`;
      return `      <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}">${ele}<time>${new Date(t).toISOString()}</time></trkpt>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Langkah" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><time>${new Date(activity.startedAt).toISOString()}</time></metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <type>running</type>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}
