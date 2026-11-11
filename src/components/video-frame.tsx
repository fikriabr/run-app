import { Linking } from "react-native";
import { WebView } from "react-native-webview";
import { embedUrl } from "./youtube-url";

// YouTube refuses embeds that arrive without a referrer, so the iframe is served from an https base URL.
function html(videoId: string): string {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;height:100%;background:#000}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style></head><body><iframe src="${embedUrl(videoId)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></body></html>`;
}

export function VideoFrame({ videoId, title }: { videoId: string; title: string }) {
  return (
    <WebView
      source={{ html: html(videoId), baseUrl: "https://langkah.app" }}
      style={{ flex: 1, backgroundColor: "#000" }}
      accessibilityLabel={title}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      onShouldStartLoadWithRequest={(req) => {
        const url = req.url;
        if (url.startsWith("about:") || url.includes("/embed/") || url.startsWith("https://langkah.app")) return true;
        // Taps on the YouTube logo or title leave the embed: send those to the YouTube app instead.
        if (/youtube\.com|youtu\.be/.test(url)) void Linking.openURL(url);
        return false;
      }}
    />
  );
}
