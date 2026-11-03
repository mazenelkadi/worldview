"""Optional development verification. Requires Python, Playwright, Chrome and ffmpeg;
none are application/runtime dependencies. Run from any working directory.
Only writes generated samples, screenshots and results in this verification folder.
"""
from pathlib import Path
import functools, hashlib, http.server, json, shutil, subprocess, tempfile, threading
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'verification'
MEDIA=OUT/'media'
MEDIA.mkdir(exist_ok=True)
ffmpeg=shutil.which('ffmpeg') or 'C:/ffmpeg/bin/ffmpeg.exe'
def generate(*args):
    subprocess.run([ffmpeg,'-y','-hide_banner','-loglevel','error',*args],check=True,timeout=40)
generate('-f','lavfi','-i','testsrc2=size=320x180:rate=10','-t','4','-c:v','libx264','-preset','ultrafast','-g','10','-pix_fmt','yuv420p',str(MEDIA/'recorded.mp4'))
generate('-i',str(MEDIA/'recorded.mp4'),'-frames:v','1',str(MEDIA/'snapshot.png'))
generate('-i',str(MEDIA/'recorded.mp4'),'-c','copy','-hls_time','1','-hls_list_size','0',str(MEDIA/'sample.m3u8'))

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.m3u8':'application/vnd.apple.mpegurl','.ts':'video/mp2t'}
    def log_message(self,*args): pass

checks=[]
def passed(name): checks.append(name);print('PASS',name,flush=True)
original=json.loads((ROOT/'json/cameras.json').read_text())
assert len(original)==(24 if ROOT.name.endswith('24-demo') else 0)
assert all(c['status']=='placeholder' and not c['playback_url'] for c in original)
passed('release camera count and placeholder-only URLs')

with tempfile.TemporaryDirectory(prefix='worldview-independent-') as td:
    # Serve a complete relocated copy, proving no parent-project dependency.
    copied=Path(td)/'nested-site';shutil.copytree(ROOT,copied)
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=td))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    origin=f'http://127.0.0.1:{server.server_port}'
    url=origin+'/nested-site/'
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(channel='chrome',headless=True)
            page=browser.new_page(viewport={'width':1440,'height':1000})
            errors=[];requests=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('request',lambda r:requests.append(r.url))
            page.goto(url);expect(page.locator('#camera-grid')).to_have_attribute('aria-busy','false')
            expect(page.locator('#collection-count')).to_have_text(str(len(original)))
            assert all(u.startswith(origin) for u in requests)
            if original:
                expect(page.locator('.camera-card')).to_have_count(12)
                expect(page.locator('#demo-note')).to_be_visible()
                page.locator('#next').click();expect(page.locator('#pages')).to_have_text('Page 2 of 2')
                page.locator('#q').fill('placeholder 24');page.locator('#filters').evaluate('(f)=>f.requestSubmit()')
                expect(page.locator('.camera-card')).to_have_count(1)
                page.locator('#reset').click()
                for field,value,count in [('country','NZ',6),('region','Iowa',6),('category','Coast',6),('type','HLS',8)]:
                    page.locator('#'+field).select_option(value);expect(page.locator('.camera-card')).to_have_count(count);page.locator('#reset').click()
                passed('search, all four filters, clear and pagination')
            else:
                expect(page.locator('#empty')).to_be_visible();expect(page.locator('.camera-card')).to_have_count(0)
                passed('professional zero-camera empty state')
            page.locator('#q').fill('no-such-place');page.locator('#filters').evaluate('(f)=>f.requestSubmit()');expect(page.locator('#empty')).to_be_visible();page.locator('#reset').click()
            page.screenshot(path=str(OUT/'desktop.png'),full_page=True)
            page.set_viewport_size({'width':390,'height':844});page.reload();expect(page.locator('#camera-grid')).to_have_attribute('aria-busy','false')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if original:
                assert page.locator('#camera-grid').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ").length')==1
                assert page.locator('.player-notice').first.evaluate('e=>e.scrollWidth<=e.clientWidth')
            page.screenshot(path=str(OUT/'mobile.png'),full_page=True);passed('relocated independent copy, relative subpath, mobile layout, no external requests')
            page.set_viewport_size({'width':1440,'height':1000})
            def fixture(kind,path):
                return dict(id='generated-test',name='Generated test pattern',country='CA',region='Synthetic',city='Not a real camera',category='Generated QA only',type=kind,status='published',playback_url=path,attribution='Generated test pattern; not live')
            for kind,path in [('SNAPSHOT','snapshot.png'),('HLS','sample.m3u8'),('VIDEO_LOOP','recorded.mp4')]:
                page.route('**/json/cameras.json',lambda route,request,k=kind,f=path:route.fulfill(json=[fixture(k,'./verification/media/'+f)]))
                page.goto(url);page.get_by_role('button',name='Watch Generated test pattern').click()
                if kind=='SNAPSHOT':page.wait_for_function('document.querySelector(".player img")?.naturalWidth>0')
                else:
                    page.locator('video').evaluate('(v)=>v.play()')
                    page.wait_for_function('(()=>{let v=document.querySelector("video");return v&&v.readyState>=2&&v.currentTime>0.4&&v.getVideoPlaybackQuality().totalVideoFrames>0})()',timeout=20000)
                passed(kind+' actual generated-media decode'+(' and advancing playback' if kind!='SNAPSHOT' else ''))
                page.unroute('**/json/cameras.json')
            page.route('**/json/cameras.json',lambda r:r.fulfill(json=[fixture('HLS','./verification/media/blocked.m3u8')]))
            page.route('**/blocked.m3u8',lambda r:r.fulfill(status=403,body='Denied'))
            page.goto(url);page.get_by_role('button',name='Watch Generated test pattern').click()
            expect(page.locator('.player-notice')).to_contain_text('Playback unavailable',timeout=15000)
            passed('HTTP 403 meaningful failure message; no bypass')
            page.unroute('**/json/cameras.json')
            page.route('**/json/cameras.json',lambda r:r.fulfill(json=[fixture('VIDEO_LOOP','javascript:alert(1)')]))
            page.goto(url);expect(page.locator('#message')).to_be_visible();expect(page.locator('video')).to_have_count(0)
            passed('unsafe media URL rejected')
            assert errors==[],errors
            browser.close()
    finally:server.shutdown();server.server_close()
(OUT/'results.json').write_text(json.dumps({'checks':checks,'passed':len(checks),'real_feed_playback_verified':0,'generated_media_only':True},indent=2)+'\n')
print('ALL',len(checks),'CHECKS PASSED')
