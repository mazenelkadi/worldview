import {mountPlayer} from './players.js';
const $ = id => document.getElementById(id);
const keys = ['country','region','category','type'];
const labels = {SNAPSHOT:'Snapshot',HLS:'HLS video',VIDEO_LOOP:'Recorded clip'};
const countries = new Intl.DisplayNames(['en'],{type:'region'});
let records=[], page=1, releases=[];
const initial=new URLSearchParams(location.search);
const selected=Object.fromEntries(keys.map(k=>[k,initial.get(k)||'']));
$('q').value=initial.get('q')||'';
function countryName(code){try{return countries.of(code)||code;}catch{return code;}}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
function card(c){
 const article=el('article','camera-card'),player=el('div','player');
 if(c.status==='placeholder') player.append(el('p','player-notice','Authorization required · Placeholder only. No source is published and no provider is contacted.'));
 else {
  const button=el('button','preview','▶ Play '+(labels[c.type]||'media'));button.type='button';button.setAttribute('aria-label','Watch '+c.name);
  button.addEventListener('click',()=>{player.replaceChildren();releases.push(mountPlayer(player,c));},{once:true});player.append(button);
 }
 const body=el('div','camera-body'),meta=el('div','camera-meta');
 meta.append(el('span','country',countryName(c.country)),el('span','badge',(c.status==='placeholder'?'Placeholder · ':'')+labels[c.type]));
 body.append(meta,el('h3','',c.name),el('p','location',[c.city,c.region].filter(Boolean).join(' · ')),el('span','scene',c.category));
 if(c.attribution)body.append(el('p','location',c.attribution));
 article.append(player,body);return article;
}
function render(){
 releases.forEach(f=>f());releases=[];
 const query=$('q').value.trim().toLocaleLowerCase();
 const filtered=records.filter(c=>keys.every(k=>!selected[k]||c[k]===selected[k])&&(!query||[c.name,c.city,c.region,c.country,c.category,countryName(c.country)].join(' ').toLocaleLowerCase().includes(query)));
 const pages=Math.max(1,Math.ceil(filtered.length/12));page=Math.min(page,pages);
 $('camera-grid').replaceChildren(...filtered.slice((page-1)*12,page*12).map(card));
 $('camera-grid').setAttribute('aria-busy','false');$('count').textContent=`(${filtered.length})`;$('collection-count').textContent=records.length;
 $('empty').hidden=filtered.length>0;
 $('empty-title').textContent=records.length?'No cameras match your filters':'Your next perspective starts here';
 $('empty-text').textContent=records.length?'Try another place or clear your filters.':'No cameras have been published. Add permitted sources to json/cameras.json to begin exploring.';
 $('pages').textContent=`Page ${page} of ${pages}`;$('previous').disabled=page<=1;$('next').disabled=page>=pages;
 const params=new URLSearchParams();if(query)params.set('q',$('q').value.trim());for(const k of keys)if(selected[k])params.set(k,selected[k]);
 if(page>1)params.set('page',page);history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));
 for(const k of keys){
  const select=$(k),values=[...new Set(records.filter(c=>k!=='region'||!selected.country||c.country===selected.country).map(c=>c[k]))].sort();
  select.replaceChildren(new Option({country:'All countries',region:'All regions',category:'All scenes',type:'All types'}[k],''));
  for(const value of values)select.add(new Option(k==='country'?countryName(value):k==='type'?labels[value]:value,value));
  if(selected[k]&&!values.includes(selected[k]))select.add(new Option(selected[k],selected[k]));select.value=selected[k];
 }
}
export function validate(data){
 if(!Array.isArray(data))throw Error('Camera JSON must be an array.');
 const ids=new Set();return data.map(c=>{
  if(!c||typeof c!=='object'||!['id','name','country','region','city','category','type','status','playback_url','attribution'].every(k=>typeof c[k]==='string'))throw Error('Invalid camera record.');
  if(!c.id||ids.has(c.id)||!labels[c.type]||!['placeholder','published'].includes(c.status)||!c.name||!c.country)throw Error('Invalid camera identity, type or status.');
  ids.add(c.id);
  if(c.status==='placeholder'&&c.playback_url!=='')throw Error('Placeholders cannot contain playback URLs.');
  if(c.status==='published'){
   const u=new URL(c.playback_url,location.href);
   if(!c.playback_url||u.username||u.password||!(u.protocol==='https:'||(u.origin===location.origin&&['http:','https:'].includes(u.protocol))))throw Error('Use HTTPS media or a same-origin asset.');
  }
  return c;
 });
}
$('filters').addEventListener('submit',e=>{e.preventDefault();page=1;render();});
for(const k of keys)$(k).addEventListener('change',()=>{selected[k]=$(k).value;if(k==='country')selected.region='';page=1;render();});
$('reset').addEventListener('click',()=>{keys.forEach(k=>selected[k]='');$('q').value='';page=1;render();});
$('previous').addEventListener('click',()=>{page--;render();});$('next').addEventListener('click',()=>{page++;render();});
window.addEventListener('pagehide',()=>releases.forEach(f=>f()));
$('demo-note').hidden=document.body.dataset.demo!=='true';
try{
 const response=await fetch('./json/cameras.json',{credentials:'omit'});if(!response.ok)throw Error('Camera file could not be loaded.');
 records=validate(await response.json());render();
}catch(error){$('camera-grid').setAttribute('aria-busy','false');$('empty').hidden=true;$('message').hidden=false;$('message').textContent=location.protocol==='file:'?'Open this folder with a static HTTP preview server. Browsers block JSON/modules when index.html is double-clicked.':'Unable to load the camera collection. Check json/cameras.json and reload. '+error.message;}
