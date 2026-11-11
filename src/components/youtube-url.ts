export interface EmbedOptions {
  /** Muted, looping, chrome-free demo playback instead of a normal player the runner started. */
  ambient?: boolean;
}

export function embedUrl(videoId: string, options: EmbedOptions = {}): string {
  const params = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0", enablejsapi: "1" });
  if (options.ambient) {
    // Browsers and WebViews only allow autoplay when muted; loop needs the video listed as its own playlist.
    params.set("mute", "1");
    params.set("loop", "1");
    params.set("playlist", videoId);
    params.set("controls", "0");
    params.set("disablekb", "1");
    params.set("iv_load_policy", "3");
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/** IFrame API command, sent with postMessage to an embed that has enablejsapi=1. */
export function playerCommand(func: "mute" | "unMute" | "playVideo" | "pauseVideo"): string {
  return JSON.stringify({ event: "command", func, args: [] });
}
