import { type ComponentRef, useEffect, useRef } from "react";
import { Linking } from "react-native";
import { WebView } from "react-native-webview";
import { ambientHtml, embedUrl } from "./youtube-url";

export interface VideoFrameProps {
  videoId: string;
  title: string;
  ambient?: boolean;
  muted?: boolean;
  start?: number;
  end?: number;
}

// YouTube refuses embeds that arrive without a referrer, so the page is served from an https base URL.
function plainHtml(src: string): string {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style></head><body><iframe src="${src}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></body></html>`;
}

export function VideoFrame({ videoId, title, ambient, muted = true, start, end }: VideoFrameProps) {
  const web = useRef<ComponentRef<typeof WebView>>(null);

  useEffect(() => {
    if (ambient) web.current?.injectJavaScript(`window.setMuted && window.setMuted(${muted ? "true" : "false"}); true;`);
  }, [ambient, muted]);

  const html = ambient ? ambientHtml(videoId, start, end) : plainHtml(embedUrl(videoId, { start, end }));

  return (
    <WebView
      ref={web}
      source={{ html, baseUrl: "https://langkah.app" }}
      style={{ flex: 1, backgroundColor: "#000" }}
      accessibilityLabel={title}
      scrollEnabled={false}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      onShouldStartLoadWithRequest={(req) => {
        const url = req.url;
        if (url.startsWith("about:") || url.includes("/embed/") || url.includes("iframe_api") || url.includes("www-widgetapi") || url.startsWith("https://langkah.app")) return true;
        // Taps on the YouTube logo or title leave the embed: send those to the YouTube app instead.
        if (req.isTopFrame !== false && /youtube\.com\/watch|youtu\.be/.test(url)) {
          void Linking.openURL(url);
          return false;
        }
        return req.isTopFrame === false;
      }}
    />
  );
}
