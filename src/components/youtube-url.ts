export interface EmbedOptions {
  /** Muted, looping, chrome-free demo playback instead of a normal player the runner started. */
  ambient?: boolean;
  start?: number;
  end?: number;
}

export function embedUrl(videoId: string, options: EmbedOptions = {}): string {
  const params = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0", enablejsapi: "1" });
  if (options.start) params.set("start", String(Math.floor(options.start)));
  if (options.end) params.set("end", String(Math.floor(options.end)));
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

/**
 * Looping demo page for the native WebView. The embed's own loop restarts at 0:00, so the
 * IFrame API seeks back to `start` whenever playback reaches `end`. If the API script cannot
 * load, it falls back to a plain embed that still honours start and end.
 */
export function ambientHtml(videoId: string, start = 0, end?: number): string {
  const fallback = embedUrl(videoId, { ambient: true, start, end });
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#p,iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style></head><body><div id="p"></div><script>
var START=${Math.floor(start)},END=${end ? Math.floor(end) : 0},player=null,muted=true,ready=false;
function fallback(){if(ready)return;ready=true;document.getElementById('p').outerHTML='<iframe src="${fallback}" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>';}
function loopBack(){player.seekTo(START,true);player.playVideo();}
window.onYouTubeIframeAPIReady=function(){if(ready)return;ready=true;var vars={autoplay:1,mute:1,controls:0,playsinline:1,rel:0,disablekb:1,iv_load_policy:3,start:START,origin:location.origin};if(END)vars.end=END;
player=new YT.Player('p',{videoId:'${videoId}',host:'https://www.youtube-nocookie.com',playerVars:vars,events:{onReady:function(e){e.target.mute();e.target.playVideo();},onStateChange:function(e){if(e.data===0)loopBack();}}});
if(END)setInterval(function(){try{if(player.getCurrentTime&&player.getCurrentTime()>=END)loopBack();}catch(x){}},250);};
window.setMuted=function(m){muted=m;if(player&&player.mute){m?player.mute():player.unMute();}else{var f=document.querySelector('iframe');if(f)f.contentWindow.postMessage(JSON.stringify({event:'command',func:m?'mute':'unMute',args:[]}),'*');}};
var s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=fallback;document.head.appendChild(s);setTimeout(fallback,5000);
</script></body></html>`;
}
