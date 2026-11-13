import { useEffect, useRef, useState } from "react";
import type { VideoFrameProps } from "./video-frame";
import { embedUrl, playerCommand } from "./youtube-url";

interface YTPlayer {
  seekTo: (s: number, allow: boolean) => void;
  playVideo: () => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  destroy: () => void;
}
type YTNamespace = { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };

let apiPromise: Promise<YTNamespace> | null = null;

/** Loads the IFrame API once per page; rejects if the script is blocked or slow. */
function loadApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const w = window as unknown as { YT?: YTNamespace & { loaded?: number }; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) return resolve(w.YT);
    w.onYouTubeIframeAPIReady = () => resolve(w.YT!);
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => reject(new Error("iframe_api blocked"));
    document.head.appendChild(script);
    setTimeout(() => reject(new Error("iframe_api timeout")), 5000);
  });
  apiPromise.catch(() => (apiPromise = null));
  return apiPromise;
}

export function VideoFrame({ videoId, title, ambient, muted = true, start = 0, end }: VideoFrameProps) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [useFallback, setUseFallback] = useState(!ambient);

  useEffect(() => {
    if (!ambient) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const loopBack = () => {
      player.current?.seekTo(start, true);
      player.current?.playVideo();
    };
    loadApi()
      .then((YT) => {
        if (cancelled || !host.current) return;
        const target = document.createElement("div");
        host.current.replaceChildren(target);
        player.current = new YT.Player(target, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, mute: 1, controls: 0, playsinline: 1, rel: 0, disablekb: 1, iv_load_policy: 3, start, ...(end ? { end } : {}), origin: location.origin },
          events: {
            onReady: (e: { target: YTPlayer }) => {
              e.target.mute();
              e.target.playVideo();
            },
            // State 0 is ENDED, which also fires at `end`; the embed's own loop would restart at 0:00.
            onStateChange: (e: { data: number }) => e.data === 0 && loopBack(),
          },
        });
        if (end) timer = setInterval(() => (player.current?.getCurrentTime?.() ?? 0) >= end && loopBack(), 250);
      })
      .catch(() => !cancelled && setUseFallback(true));
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      player.current?.destroy?.();
      player.current = null;
    };
  }, [ambient, videoId, start, end]);

  useEffect(() => {
    if (!ambient) return;
    const p = player.current;
    if (p) {
      if (muted) p.mute();
      else p.unMute();
    } else {
      frame.current?.contentWindow?.postMessage(playerCommand(muted ? "mute" : "unMute"), "*");
    }
  }, [ambient, muted]);

  if (useFallback) {
    return (
      <iframe
        ref={frame}
        src={embedUrl(videoId, { ambient, start, end })}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ border: 0, width: "100%", height: "100%", pointerEvents: ambient ? "none" : "auto" }}
      />
    );
  }
  return <div ref={host} title={title} style={{ width: "100%", height: "100%", pointerEvents: "none" }} />;
}
