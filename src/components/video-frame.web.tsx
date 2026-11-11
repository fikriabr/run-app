import { createElement, useEffect, useRef } from "react";
import type { VideoFrameProps } from "./video-frame";
import { embedUrl, playerCommand } from "./youtube-url";

export function VideoFrame({ videoId, title, ambient, muted = true }: VideoFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!ambient) return;
    frame.current?.contentWindow?.postMessage(playerCommand(muted ? "mute" : "unMute"), "*");
  }, [ambient, muted]);

  return createElement("iframe", {
    ref: frame,
    src: embedUrl(videoId, { ambient }),
    title,
    allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
    allowFullScreen: true,
    referrerPolicy: "strict-origin-when-cross-origin",
    style: { border: 0, width: "100%", height: "100%", pointerEvents: ambient ? "none" : "auto" },
  });
}
