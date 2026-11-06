/**
 * Engine bản đồ Alumni cho mobile – port 1:1 từ web
 * (alumnect-frontend/src/features/alumnimap: AlumniMapLibre.tsx + mapStyleService.ts).
 *
 * Chạy trong WebView bằng MapLibre GL JS (cùng engine với web):
 *  - Style: MapTiler (ma trận theme giống web) → fallback vector miễn phí (OpenFreeMap/CARTO GL, Esri) khi thiếu hoặc sai khóa.
 *  - Marker avatar, cluster khi zoom < 14.5, spiderfy (bán kính 32px) khi nhiều người cùng tọa độ.
 *  - flyTo khi chọn alumni (zoom 18 trong VN, 17 ngoài VN, 1200ms), click vùng trống để bỏ chọn.
 *  - Overlay Hoàng Sa / Trường Sa, nạp lại mỗi khi đổi style.
 */

export type MapTheme = 'DEFAULT' | 'MINIMAL' | 'DARK' | 'PASTEL' | 'SATELLITE'

export const MAP_THEMES: { theme: MapTheme; name: string }[] = [
  { theme: 'DEFAULT', name: 'Đường phố' },
  { theme: 'MINIMAL', name: 'Tối giản' },
  { theme: 'DARK', name: 'Đêm tối' },
  { theme: 'PASTEL', name: 'Pastel' },
  { theme: 'SATELLITE', name: 'Vệ tinh' },
]

/** Bản sao /public/vietnam-islands.geojson của web. */
const VIETNAM_ISLANDS = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { nameVi: 'Quần đảo Hoàng Sa\n(Đà Nẵng, Việt Nam)', nameEn: 'Paracel Islands (Vietnam)', type: 'archipelago' }, geometry: { type: 'Point', coordinates: [112.33, 16.53] } },
    { type: 'Feature', properties: { nameVi: 'Quần đảo Trường Sa\n(Khánh Hòa, Việt Nam)', nameEn: 'Spratly Islands (Vietnam)', type: 'archipelago' }, geometry: { type: 'Point', coordinates: [114.35, 8.88] } },
  ],
}

/** Gửi dữ liệu/lệnh vào trang bản đồ (dùng với WebView.injectJavaScript). */
export function mapCommand(cmd: Record<string, unknown>): string {
  return `window.__alumniMap && window.__alumniMap(${JSON.stringify(cmd).replace(/</g, '\\u003c')}); true;`
}

export function buildAlumniMapHtml(opts: { maptilerKey?: string }): string {
  const key = (opts.maptilerKey ?? '').trim()
  const validKey = key && !key.toLowerCase().includes('your_') ? key : ''
  const config = JSON.stringify({ key: validKey, islands: VIETNAM_ISLANDS }).replace(/</g, '\\u003c')

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.css"/>
<style>
:root{--primary:#CE4A09;--primary-soft:#FDF0E7;--on-primary:#FFFFFF;--surface:#FFFFFF;--border:#E6E8EB}
html,body,#map{height:100%;margin:0;background:#EEF0F2;font-family:-apple-system,Roboto,'Segoe UI',sans-serif;-webkit-tap-highlight-color:transparent}
.maplibregl-ctrl-bottom-right{margin-bottom:4px}
.am{display:flex;flex-direction:column;align-items:center;cursor:pointer}
.am .ring{width:44px;height:44px;border-radius:50%;background:#fff;border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:transform .25s,box-shadow .25s}
.am .ring.sel{box-shadow:0 0 0 4px var(--primary),0 4px 14px rgba(0,0,0,.3);transform:scale(1.1);border-color:transparent}
.am .face{width:36px;height:36px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;position:relative}
.am .face img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.am .arrow{width:10px;height:10px;transform:rotate(45deg);margin-top:-6px;background:var(--surface);border-right:1px solid var(--border);border-bottom:1px solid var(--border)}
.am .arrow.sel{background:var(--primary);border-color:var(--primary)}
.am .badge,.cl .badge{position:absolute;right:-10px;top:-8px;min-width:20px;height:20px;padding:0 5px;box-sizing:border-box;border-radius:10px;background:var(--primary);color:var(--on-primary);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px var(--surface)}
.cl{display:flex;flex-direction:column;align-items:center;cursor:pointer}
.cl .disc{width:56px;height:56px;border-radius:50%;border:4px solid #fff;background:var(--surface);box-shadow:0 4px 14px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;box-sizing:border-box}
.cl .in{width:44px;height:44px;border-radius:50%;background:var(--primary-soft);color:var(--primary);display:flex;align-items:center;justify-content:center}
.cl .badge{right:-4px;top:-4px;min-width:24px;height:24px;border-radius:12px;font-size:12px}
.cl .arrow{width:12px;height:12px;transform:rotate(45deg);margin-top:-7px;background:var(--surface);border-right:1px solid #fff;border-bottom:1px solid #fff}
</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.js"></script>
<script>
(function(){
var CFG=${config};
var CLUSTER_ZOOM=14.5;
var THEME_IDS={DEFAULT:'streets-v4',MINIMAL:'basic-v2',DARK:'dataviz-dark',PASTEL:'pastel',SATELLITE:'hybrid'};
var FREE={DEFAULT:'https://tiles.openfreemap.org/styles/liberty',MINIMAL:'https://tiles.openfreemap.org/styles/positron',DARK:'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',PASTEL:'https://tiles.openfreemap.org/styles/bright'};

function post(m){try{window.ReactNativeWebView.postMessage(JSON.stringify(m))}catch(e){}}
function inVN(lng,lat){return lat>=8.18&&lat<=23.39&&lng>=102.14&&lng<=109.46}

/* ---------- Style (mapStyleService.ts) ---------- */
/* Fallback khi không có/sai khóa MapTiler. Raster CARTO hiện watermark "API KEY REQUIRED" nên dùng
   style vector miễn phí không cần khóa (OpenFreeMap, CARTO GL) và ảnh vệ tinh Esri. */
function esriStyle(){
  return {version:8,sources:{'satellite-raster':{type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,maxzoom:19,attribution:'Tiles © Esri — Source: Esri, GIS User Community'}},layers:[{id:'satellite-layer',type:'raster',source:'satellite-raster',minzoom:0,maxzoom:22}]};
}
var useMapTiler=!!CFG.key;
function resolveStyle(theme){
  if(useMapTiler)return 'https://api.maptiler.com/maps/'+THEME_IDS[theme]+'/style.json?key='+CFG.key;
  return theme==='SATELLITE'?esriStyle():FREE[theme];
}

var theme='DEFAULT';
var points=[];            /* AlumniMapItem[] */
var byId={};
var selectedId=null;
var flying=false;
var markers={};           /* key -> {marker, el, kind} */
var switchTimer=null;

var map=new maplibregl.Map({container:'map',style:resolveStyle(theme),center:[108.2022,16.0544],zoom:5.5,attributionControl:{compact:true}});
map.addControl(new maplibregl.NavigationControl({showCompass:true}),'bottom-right');

/* Khóa MapTiler sai/bị giới hạn domain → tự chuyển sang nền miễn phí như khi thiếu khóa */
map.on('error',function(e){
  var err=e&&e.error;if(!err)return;
  var url=String(err.url||'');
  if(useMapTiler&&(err.status===401||err.status===403)&&url.indexOf('maptiler.com')>-1){
    useMapTiler=false;startSwitch();map.setStyle(resolveStyle(theme),{diff:false});
  }
});

function startSwitch(){
  post({type:'switching',value:true});
  clearTimeout(switchTimer);
  switchTimer=setTimeout(function(){post({type:'switching',value:false})},8000);
}
function endSwitch(){clearTimeout(switchTimer);post({type:'switching',value:false})}

/* ---------- Vietnam islands overlay ---------- */
function ensureIslands(){
  try{
    if(map.getSource('vietnam-islands'))return;
    map.addSource('vietnam-islands',{type:'geojson',data:CFG.islands});
    map.addLayer({id:'vietnam-islands-points',type:'circle',source:'vietnam-islands',paint:{'circle-radius':5,'circle-color':'#f43f5e','circle-stroke-width':1.5,'circle-stroke-color':'#ffffff'}});
    var font=null;((map.getStyle()||{}).layers||[]).some(function(l){var f=l.layout&&l.layout['text-font'];if(f){font=f;return true}return false});
    var lay={'text-field':['get','nameVi'],'text-size':11,'text-offset':[0,0.9],'text-anchor':'top'};
    if(font)lay['text-font']=font;
    map.addLayer({id:'vietnam-islands-labels',type:'symbol',source:'vietnam-islands',minzoom:3,layout:lay,paint:{'text-color':'#be123c','text-halo-color':'#ffffff','text-halo-width':1.5}});
  }catch(e){}
}
map.on('style.load',function(){ensureIslands();endSwitch()});

/* ---------- Markers ---------- */
var PAIRS=[['#E4ECE8','#315B46'],['#E5EBF4','#3E577C'],['#F4E9DC','#795733'],['#F2E3E7','#794452']];
function hash(s){var h=0;for(var i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))>>>0}return h}
function initials(name){var p=String(name||'?').trim().split(/\\s+/);return p.slice(-2).map(function(x){return x.charAt(0)}).join('').toUpperCase()}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

function faceHtml(a){
  var pr=PAIRS[hash(a.displayName||'?')%PAIRS.length];
  var img=a.avatarUrl?'<img src="'+esc(a.avatarUrl)+'" onerror="this.remove()" alt="">':'';
  return '<div class="face" style="background:'+pr[0]+';color:'+pr[1]+'">'+esc(initials(a.displayName))+img+'</div>';
}
function avatarEl(a,sel,badge){
  var el=document.createElement('div');el.className='am';
  el.innerHTML='<div class="ring'+(sel?' sel':'')+'">'+faceHtml(a)+'</div>'+(badge>1?'<span class="badge">'+badge+'</span>':'')+'<div class="arrow'+(sel?' sel':'')+'"></div>';
  el.addEventListener('click',function(ev){ev.stopPropagation();select(a.alumniId,true)});
  return el;
}
var USERS='<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
function clusterEl(group){
  var el=document.createElement('div');el.className='cl';
  el.innerHTML='<div class="disc"><div class="in">'+USERS+'</div></div><span class="badge">'+group.length+'</span><div class="arrow"></div>';
  el.addEventListener('click',function(ev){
    ev.stopPropagation();
    var f=group[0];
    map.easeTo({center:[f.longitude,f.latitude],zoom:Math.min(map.getMaxZoom(),Math.max(map.getZoom()+3,CLUSTER_ZOOM+0.5)),duration:550,essential:true});
  });
  return el;
}

function groupsOf(){
  var g={};
  points.forEach(function(a){var k=a.latitude.toFixed(6)+':'+a.longitude.toFixed(6);(g[k]=g[k]||[]).push(a)});
  return Object.keys(g).map(function(k){return g[k]});
}

var rafId=0;
function schedule(){if(rafId)return;rafId=requestAnimationFrame(function(){rafId=0;renderMarkers()})}

function renderMarkers(){
  var zoom=map.getZoom();
  var clustered=zoom<CLUSTER_ZOOM;
  var want={};   /* key -> {kind, group|alumni, lngLat, sel, badge} */
  groupsOf().forEach(function(group){
    var first=group[0];
    if(clustered){
      if(group.length>1)want['c:'+first.alumniId]={kind:'cluster',group:group,ll:[first.longitude,first.latitude]};
      else want['a:'+first.alumniId]={kind:'avatar',a:first,ll:[first.longitude,first.latitude],badge:1};
    }else if(group.length===1){
      want['a:'+first.alumniId]={kind:'avatar',a:first,ll:[first.longitude,first.latitude],badge:1};
    }else{
      var c=map.project([first.longitude,first.latitude]);
      group.forEach(function(a,i){
        var ang=-Math.PI/2+2*Math.PI*i/group.length;
        var p=map.unproject([c.x+Math.cos(ang)*32,c.y+Math.sin(ang)*32]);
        want['a:'+a.alumniId]={kind:'avatar',a:a,ll:[p.lng,p.lat],badge:i===0?group.length:1};
      });
    }
  });
  Object.keys(markers).forEach(function(k){
    var m=markers[k],w=want[k];
    var sel=w&&w.kind==='avatar'&&w.a.alumniId===selectedId;
    if(!w||m.kind!==w.kind||(w.kind==='avatar'&&(m.sel!==sel||m.badge!==w.badge))){m.marker.remove();delete markers[k]}
  });
  Object.keys(want).forEach(function(k){
    var w=want[k],m=markers[k];
    if(m){m.marker.setLngLat(w.ll);return}
    var sel=w.kind==='avatar'&&w.a.alumniId===selectedId;
    var el=w.kind==='cluster'?clusterEl(w.group):avatarEl(w.a,sel,w.badge);
    if(sel)el.style.zIndex=5;
    var marker=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat(w.ll).addTo(map);
    markers[k]={marker:marker,kind:w.kind,sel:sel,badge:w.badge};
  });
}
map.on('zoom',schedule);map.on('resize',schedule);

/* ---------- Chọn alumni / flyTo ---------- */
function select(id,fromUser){
  var a=id==null?null:byId[id];
  selectedId=a?a.alumniId:null;
  renderMarkers();
  if(fromUser)post({type:'selected',id:selectedId});
  if(!a)return;
  var target=Math.min(map.getMaxZoom(),inVN(a.longitude,a.latitude)?18:17);
  var c=map.getCenter();
  var dist=Math.hypot(c.lng-a.longitude,c.lat-a.latitude);
  if(dist<0.001&&Math.abs(map.getZoom()-target)<0.15)return;
  map.stop();
  flying=true;
  map.once('moveend',function(){flying=false});
  map.flyTo({center:[a.longitude,a.latitude],zoom:target,duration:1200,essential:true});
}
/* Click vùng trống → bỏ chọn (dừng camera tại chỗ trước, như web) */
map.on('click',function(){
  if(selectedId==null)return;
  map.stop();flying=false;
  select(null,true);
});
/* Zoom ra tới mức cluster → đóng thẻ (web: isClustered && selected → onCloseAlumni) */
map.on('zoomend',function(){
  if(!flying&&selectedId!=null&&map.getZoom()<CLUSTER_ZOOM)select(null,true);
});

/* ---------- Lệnh từ React Native ---------- */
function applyColors(c){
  if(!c)return;var s=document.documentElement.style;
  s.setProperty('--primary',c.primary);s.setProperty('--primary-soft',c.primarySoft);
  s.setProperty('--on-primary',c.onPrimary);s.setProperty('--surface',c.surface);s.setProperty('--border',c.border);
}
window.__alumniMap=function(cmd){
  if(!cmd)return;
  if(cmd.type==='data'){
    applyColors(cmd.colors);
    points=cmd.points||[];byId={};points.forEach(function(a){byId[a.alumniId]=a});
    if(selectedId!=null&&!byId[selectedId]){selectedId=null;post({type:'selected',id:null})}
    if(cmd.center&&!window.__centered&&points.length){window.__centered=true;map.jumpTo({center:cmd.center})}
    renderMarkers();
  }else if(cmd.type==='theme'){
    if(cmd.theme===theme)return;
    theme=cmd.theme;startSwitch();map.setStyle(resolveStyle(theme),{diff:false});
  }else if(cmd.type==='select'){
    select(cmd.id,false);
  }
};
window.addEventListener('resize',function(){map.resize()});
post({type:'ready'});
})();
</script></body></html>`
}
