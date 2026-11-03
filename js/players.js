// Direct browser playback only. No proxy, credentials, rewriting or access-control bypass.
export function mountPlayer(host,camera){
 let active=true,hls,timer,timeout;
 const note=document.createElement('p');note.className='player-notice';note.setAttribute('role','status');host.append(note);
 const message=text=>{if(active)note.textContent=text;};
 const failure=()=>message('Playback unavailable. The provider may be offline or restrict embedding, authentication, CORS, or this media format. Browser errors cannot always distinguish these causes; inspect Chrome Network/Console. No restriction was bypassed.');
 const url=new URL(camera.playback_url,location.href).href;
 let media;
 if(camera.type==='SNAPSHOT'){
  media=document.createElement('img');media.alt=camera.name+' — snapshot';media.referrerPolicy='no-referrer';
  const refresh=document.createElement('button');refresh.type='button';refresh.className='media-button';refresh.textContent='Refresh snapshot';
  function load(){message('Loading snapshot…');clearTimeout(timeout);timeout=setTimeout(failure,20000);media.src=url;}
  media.onload=()=>{clearTimeout(timeout);message('Snapshot loaded · '+new Date().toLocaleTimeString()+'. This is a still image, not live video.');};media.onerror=()=>{clearTimeout(timeout);failure();};
  refresh.onclick=load;host.prepend(media);host.append(refresh);load();
 }else{
  media=document.createElement('video');media.controls=true;media.playsInline=true;media.muted=true;media.preload='metadata';media.loop=camera.type==='VIDEO_LOOP';
  host.prepend(media);message(camera.type==='VIDEO_LOOP'?'Recorded footage · not live. Press Play.':'HLS stream · press Play. Live status and freshness are provider-dependent.');
  media.onerror=failure;media.addEventListener('playing',()=>message(camera.type==='VIDEO_LOOP'?'Playing recorded footage · not live.':'Playing HLS video · freshness is not independently verified.'));
  if(camera.type==='HLS'){
   if(media.canPlayType('application/vnd.apple.mpegurl'))media.src=url;
   else if(window.Hls?.isSupported()){
    hls=new Hls({maxBufferLength:20,maxMaxBufferLength:40,manifestLoadingMaxRetry:1,levelLoadingMaxRetry:1,fragLoadingMaxRetry:1});
    hls.on(Hls.Events.ERROR,(_event,data)=>{if(data.fatal){failure();hls.destroy();hls=null;}});hls.loadSource(url);hls.attachMedia(media);
   }else message('HLS playback is unsupported by this browser. Try current Chrome or Safari.');
  }else media.src=url;
 }
 return()=>{active=false;clearInterval(timer);clearTimeout(timeout);hls?.destroy();media.onload=media.onerror=null;if(media instanceof HTMLVideoElement){media.pause();media.removeAttribute('src');media.load();}else media.removeAttribute('src');};
}
