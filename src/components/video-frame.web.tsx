import { createElement } from "react";
import { embedUrl } from "./youtube-url";

export function VideoFrame({ videoId, title }: { videoId: string; title: string }) {
  return createElement("iframe", {
    src: embedUrl(videoId),
    title,
    allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
    allowFullScreen: true,
    referrerPolicy: "strict-origin-when-cross-origin",
    style: { border: 0, width: "100%", height: "100%" },
  });
}
