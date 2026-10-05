/* HRRY Study Portal - Target Board | final app.js */
const API='https://studyapkmod-targetboard.vercel.app/api';
const TP={worker:'https://tb.smexfot.workers.dev',alt:'https://tb.studybeepro.site',org:'kuepke',cdn:'https://d3tphhabckqhz3.cloudfront.net',cid:'0fa5a6dd93b56a6'};
const $=s=>document.querySelector(s);
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let courses=[],cls=LS.get('cls',''),my=LS.get('my',[]),bm=LS.get('bm',{}),hist=LS.get('hist',[]),prog=LS.get('prog',{}),user=LS.get('user',null),theme=LS.get('theme','dark');
const cache={},LES={};let hls=null;
const cid=c=>String(c.id||c._id),ttl=c=>c.title||c.name||'Batch',thumb=c=>c.thumbnail||c.image||c.banner||'https://i.ibb.co/6RdmyKC0/logo.png';
const inCls=c=>!cls||new RegExp('(^|\\D)'+cls+'(th)?(\\D|$)','i').test(ttl(c)+' '+(c.category||''));
const TABS=[['home','⌂','Home'],['my','▶','My Course'],['all','▦','All Courses'],['me','★','Saved'],['dev','</>','Developer']];
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2000)}
function haptic(){navigator.vibrate&&navigator.vibrate(8)}
function drawer(o){$('#drawer').classList.toggle('on',!!o);$('#ov').classList.toggle('on',!!o)}
function sheet(o,h){const s=$('#sheet');if(h!==undefined)s.innerHTML=h;s.classList.toggle('on',!!o);$('#ov2').classList.toggle('on',!!o)}
function setTheme(t){document.documentElement.dataset.theme=t;LS.set('theme',t);document.querySelector('meta[name=theme-color]').content=t==='light'?'#fff9a6':'#0E0F13'}
function toggleTheme(){setTheme(document.documentElement.dataset.theme==='light'?'dark':'light')}
function share(){const d={title:'Target Board',url:location.origin};navigator.share?navigator.share(d).catch(()=>{}):(navigator.clipboard&&navigator.clipboard.writeText(d.url),toast('Link copied'))}
function go(h){haptic();drawer(0);location.hash=h}

/* AUTH (local profile) */
function login(){sheet(1,`<div class="box" style="margin-top:4px"><h2>Your Profile</h2><input class="in" id="un" placeholder="Apna naam" value="${esc(user?.name||'')}"><button class="b" onclick="saveUser()">Save</button></div>`)}
function saveUser(){const n=$('#un').value.trim();if(!n)return toast('Naam likhein');user={name:n};LS.set('user',user);sheet(0);drawerHTML();toast('Welcome '+n)}
function drawerHTML(){$('#drawer').innerHTML=`<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><b style="font-size:18px;font-family:Outfit">${esc(user?.name||'Student')}</b><button style="margin-left:auto" onclick="drawer(0)">✕</button></div><button class="b d" onclick="login()">✎ Edit profile</button>
<small class="g">GENERAL</small><button class="row" onclick="go('#my')">📘 My Courses<span>›</span></button><button class="row" onclick="go('#me')">★ Bookmarks & History<span>›</span></button><button class="row" onclick="go('#all')">📝 Notes / Search<span>›</span></button><button class="row" onclick="go('#dev')">&lt;/&gt; Developer Info<span>›</span></button><button class="row" onclick="toggleTheme()">🌙 Dark mode <i class="sw"></i></button>
<small class="g">COMMUNITY</small><a class="row" style="border-radius:16px" href="https://t.me/hrbseb10thallcorse" target="_blank">🌐 Social Media Links<span>›</span></a>
<small class="g">MORE</small><button class="row" onclick="share()">🔗 Share<span>›</span></button><button class="row" onclick="go('#dev')">ℹ️ About<span>›</span></button>`}

/* COURSE API + SUBJECT/CHAPTER/LECTURE normalisation */
async function loadCourses(){try{const j=await (await fetch(API+'/courses')).json();courses=Array.isArray(j)?j:(j.courses||j.data||[])}catch(e){courses=LS.get('coursesCache',[])}if(courses.length)LS.set('coursesCache',courses)}
function lesson(l,i,fid){const s=l.source||l,pdf=s.pdf?.url||l.pdf?.url||s.pdfUrl||(/\.pdf(\?|$)/i.test(s.url||'')?s.url:null);const asset=s.tpAssetId||s.video?.assetId||s.assetId||'';const o={id:String(l._id||l.id||s._id||fid+'-'+i),title:s.title||s.name||l.title||'Lesson '+(i+1),type:pdf&&!asset?'pdf':'video',pdf,asset,hls:s.hlsUrl||s.videoUrl||s.video_url||'',date:s.startTime||s.createdAt||l.createdAt||'',teacher:(s.description||'').replace(/^\s*by\s*[-:]?\s*/i,'').slice(0,40),seq:l.sequence??i};LES[o.id]=o;return o}
function folder(f,i){const id=String(f.id||f._id||'f'+i);const ls=(f.lessons||[]).filter(x=>x&&(x.source||x.title)).map((l,k)=>lesson(l,k,id)).sort((a,b)=>a.seq-b.seq);(f.contents||[]).filter(x=>x&&(x.pdf?.url||x.type==='pdf')).forEach((x,k)=>ls.push(lesson(x,100+k,id)));[f.videos,f.pdfs].forEach(a=>Array.isArray(a)&&a.forEach((x,k)=>ls.push(lesson(x,200+k,id))));const sub=f.subfolders||f.children||[];return{id,name:f.name||f.title||'Section',lessons:ls,sub:sub.map(folder)}}
async function content(id){if(cache[id])return cache[id];const j=await (await fetch(`${API}/course-content?id=${encodeURIComponent(id)}`,{cache:'no-store'})).json();const raw=j.folders||j.data?.folders||(Array.isArray(j)?j:[]);return cache[id]={title:j.title||j.courseTitle||'',folders:raw.map(folder)}}
const count=f=>f.lessons.length+f.sub.reduce((a,s)=>a+count(s),0);
const flat=f=>[...f.lessons,...f.sub.flatMap(flat)];
const at=(root,p)=>p.reduce((n,i)=>n&&(n.sub?n.sub[i]:n.folders?.[i]),{sub:root.folders});

/* UI blocks */
function card(c){const id=cid(c),e=my.includes(id);return `<div class="card"><img class="th" loading="lazy" src="${esc(thumb(c))}" alt=""><h3>${esc(ttl(c))}</h3><div class="fr">FREE <em>100% free access</em></div><div class="btns"><a class="b" href="#course/${id}">${e?"▶ Let's Study":'DETAILS'}</a><button class="b ${e?'ok':'d'}" onclick="enroll('${id}')">${e?'ENROLLED':'ENROLL'}</button></div></div>`}
function enroll(id){if(!my.includes(id)){my.push(id);LS.set('my',my);toast('Enrolled ✓')}else toast('Already enrolled');haptic();render()}
function pct(cid_,data){const ids=data.folders.flatMap(flat).map(l=>l.id);if(!ids.length)return 0;return Math.round(ids.filter(i=>prog[i]?.done).length/ids.length*100)}
function lesRow(l){const b=!!bm[l.id],d=prog[l.id]?.done;return `<div class="les"><button class="ic" onclick="play('${l.id}')">${l.type==='pdf'?'📄':'▶'}</button><div class="tx" onclick="play('${l.id}')">${esc(l.title)}${d?' ✓':''}<small>${l.type==='pdf'?'PDF Notes':'Recorded Lecture'}${l.teacher?' · '+esc(l.teacher):''}</small></div><button class="bm ${b?'on':''}" onclick="mark('${l.id}','${cur.cid}')">${b?'★':'☆'}</button></div>`}
let cur={cid:'',path:[]};
function mark(id,c){if(bm[id])delete bm[id];else bm[id]={c,t:Date.now()};LS.set('bm',bm);haptic();render()}
function pickClass(){sheet(1,`<div class="box" style="margin-top:4px"><div style="font-size:34px">🎓</div><h2>Choose Your Class</h2><select id="cs"><option value="">All Classes</option>${[9,10,11,12].map(n=>`<option value="${n}" ${cls==n?'selected':''}>Class ${n}</option>`).join('')}</select><button class="b" onclick="setCls($('#cs').value)">Show Batches</button></div>`)}
function setCls(v){cls=v;LS.set('cls',v);$('#clsLbl').textContent=v?'Class - '+v:'Select class';sheet(0);render()}

/* SEARCH API (client side: courses + loaded lessons) */
function search(q){q=q.trim().toLowerCase();const r=$('#res');if(!r)return;if(!q){r.innerHTML=courses.filter(inCls).map(card).join('');return}let h=courses.filter(c=>ttl(c).toLowerCase().includes(q)).map(card).join('');Object.values(LES).filter(l=>l.title.toLowerCase().includes(q)).slice(0,20).forEach(l=>h+=lesRow(l));r.innerHTML=h||'<div class="empty">Kuch nahi mila.</div>'}

/* PLAYER: VIDEO API + YOUTUBE + PDF VIEWER + progress/history */
async function token(a){for(const b of [TP.worker,TP.alt])try{const c=new AbortController;setTimeout(()=>c.abort(),7000);const r=await fetch(`${b}/api/v1/tpstreams/token/${encodeURIComponent(a)}`,{method:'POST',signal:c.signal});if(!r.ok)continue;const j=await r.json();const t=j.code||j.token||j.access_token;if(t)return t}catch(e){}return null}
function yt(u){const m=(u||'').match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);return m?m[1]:null}
function closePlayer(){const v=$('#player video');if(v){prog[v.dataset.id]={...prog[v.dataset.id],t:v.currentTime};LS.set('prog',prog)}hls&&hls.destroy();hls=null;$('#player').classList.remove('on');setTimeout(()=>$('#player').innerHTML='',500)}
async function play(id){const l=LES[id];if(!l)return;const p=$('#player');hist=[{id,t:Date.now()},...hist.filter(h=>h.id!==id)].slice(0,40);LS.set('hist',hist);
 p.innerHTML=`<div class="bar"><button style="color:#fff;font-size:20px" onclick="closePlayer()">✕</button><span>${esc(l.title)}</span></div><div class="msg" id="pm">Loading...</div>`;p.classList.add('on');
 if(l.type==='pdf'){const u=l.pdf;p.innerHTML=`<div class="bar"><button style="color:#fff;font-size:20px" onclick="closePlayer()">✕</button><span>${esc(l.title)}</span><a style="margin-left:auto;color:var(--ac)" href="${esc(u)}" target="_blank" download>⬇</a></div><iframe class="pdf" src="https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(u)}"></iframe>`;prog[id]={...prog[id],done:true};LS.set('prog',prog);return}
 const y=yt(l.hls);if(y){p.innerHTML+=`<iframe allowfullscreen src="https://www.youtube.com/embed/${y}?autoplay=1"></iframe>`;$('#pm')?.remove();return}
 let src=l.hls,tk=null;if(l.asset){tk=await token(l.asset);src=`${TP.cdn}/${TP.cid}/transcoded/${l.asset}/video.m3u8`;if(tk)try{const j=await (await fetch(`https://app.tpstreams.com/api/v1/${TP.org}/assets/${l.asset}/?access_token=${tk}`)).json();src=j.video?.playback_url||src}catch(e){}}
 if(!src){$('#pm').textContent='Video source nahi mila.';return}
 p.innerHTML=`<div class="bar"><button style="color:#fff;font-size:20px" onclick="closePlayer()">✕</button><span>${esc(l.title)}</span></div><video id="vd" data-id="${id}" controls playsinline autoplay></video><div class="ctl">${[0.75,1,1.25,1.5,2].map(s=>`<button onclick="$('#vd').playbackRate=${s}">${s}x</button>`).join('')}<button onclick="$('#vd').requestFullscreen&&$('#vd').requestFullscreen()">⛶</button></div><div class="msg" id="pm"></div>`;
 const v=$('#vd'),fail=()=>{$('#pm').innerHTML=`Is video ka direct play nahi hua. <a style="color:var(--ac)" target="_blank" href="https://targetboard-studyapkmod.vercel.app/player?type=video&title=${encodeURIComponent(l.title)}&assetId=${encodeURIComponent(l.asset)}&id=${encodeURIComponent(l.asset)}&url=${encodeURIComponent(src)}">Original player kholein ↗</a>`};
 if(Hls.isSupported()){hls=new Hls;hls.loadSource(src);hls.attachMedia(v);hls.on(Hls.Events.ERROR,(e,d)=>d.fatal&&fail())}else{v.src=src;v.onerror=fail}
 v.onloadedmetadata=()=>{if(prog[id]?.t)v.currentTime=prog[id].t};v.ontimeupdate=()=>{if(v.duration&&v.currentTime/v.duration>.9&&!prog[id]?.done){prog[id]={...prog[id],done:true};LS.set('prog',prog)}};v.onpause=()=>{prog[id]={...prog[id],t:v.currentTime};LS.set('prog',prog)}}

/* ROUTER */
async function render(){const h=(location.hash||'#home').slice(1),[pg,a,...rest]=h.split('/');const m=$('#main');let html='';
 $('#nav').innerHTML=TABS.map(([k,i,l])=>`<button class="${pg===k||(pg==='course'&&k==='all')?'a':''}" onclick="go('#${k}')"><i>${i}</i><span>${l}</span>${k==='my'&&my.length?`<sup>${my.length}</sup>`:''}</button>`).join('');
 if(pg==='home'){const L=courses.filter(inCls);html=`${courses.length?`<div class="ban">${courses.slice(0,6).map(c=>`<img src="${esc(thumb(c))}" alt="">`).join('')}</div>`:''}<div class="q"><button onclick="go('#all')"><span style="background:#2a2d36">📖</span>All Courses</button><button onclick="go('#my')"><span style="background:#ef4444">📡</span>Live Class</button><button onclick="go('#me')"><span style="background:#06b6d4">📝</span>Notes</button></div><h2 class="t">Latest Courses <a class="sm" href="#all">See all ›</a></h2>${L.slice(0,4).map(card).join('')||'<div class="empty">Loading...</div>'}`}
 else if(pg==='my'){html=`<h2 class="t">My Courses</h2>${courses.filter(c=>my.includes(cid(c))).map(card).join('')||'<div class="empty">Abhi koi batch enroll nahi hai.</div>'}`}
 else if(pg==='all'){html=`<h2 class="t">All Courses <button class="sm" onclick="pickClass()">Select class</button></h2><input class="srch" placeholder="🔍 Search batch ya lecture" oninput="search(this.value)"><div id="res">${courses.filter(inCls).map(card).join('')||'<div class="empty">Koi batch nahi mila.</div>'}</div>`}
 else if(pg==='me'){const bl=Object.keys(bm).filter(i=>LES[i]).map(i=>lesRow(LES[i])).join(''),hl=hist.filter(x=>LES[x.id]).map(x=>lesRow(LES[x.id])).join('');html=`<h2 class="t">Bookmarks</h2>${bl||'<div class="empty">Koi bookmark nahi. Lecture kholne ke baad ☆ dabayein.</div>'}<h2 class="t">History <button class="sm" onclick="hist=[];LS.set('hist',[]);render()">Clear</button></h2>${hl||'<div class="empty">History khali hai.</div>'}`}
 else if(pg==='course'){m.innerHTML='<section><div class="empty">Loading subjects and chapters...</div></section>';try{const d=await content(a);const c=courses.find(x=>cid(x)===a)||{};const path=rest.map(Number);cur={cid:a,path};const n=path.length?at(d,path):null;const list=n?n.sub:d.folders;const base=`#course/${a}`;let p='';html=`<div class="crumb"><a href="${base}">${esc(ttl(c)||d.title||'Course')}</a>${path.map((x,i)=>{p+='/'+x;const nn=at(d,path.slice(0,i+1));return ` › <a href="${base}${p}">${esc(nn?.name)}</a>`}).join('')}</div>`;
  if(!path.length){const pc=pct(a,d);html+=`<h2 class="t">${esc(ttl(c)||d.title)}</h2><div class="pb"><i style="width:${pc}%"></i></div><small style="color:var(--mut)">${pc}% complete</small><h2 class="t">Subjects</h2>`}
  html+=list.map((f,i)=>`<a class="fold" href="${base}${path.length?'/'+path.join('/'):''}/${i}">📁 ${esc(f.name)}<small>${count(f)} items ›</small></a>`).join('');
  if(n&&n.lessons.length)html+=`<h2 class="t">Lectures & Notes</h2>`+n.lessons.map(lesRow).join('');
  if(!list.length&&!(n&&n.lessons.length))html+='<div class="empty">Content abhi available nahi hai.</div>'}catch(e){html='<div class="empty">Content load nahi hua. Internet check karke dobara try karein.</div>'}}
 else html=`<div style="text-align:center;margin-top:16px"><h1 style="font-size:30px">Developer Info</h1><p style="color:var(--mut);font-size:13px;margin:10px 0">Ashraf CyberX digital learning ecosystem ke developer.</p><div class="card" style="padding:24px"><img src="https://i.ibb.co/6RdmyKC0/logo.png" style="width:100px;height:100px;border-radius:50%;border:3px solid var(--ac)" alt=""><h2 style="margin-top:10px">Ashraf Ali</h2><p style="color:var(--mut);font-size:13px">Developer & Designer · Champaran, Bihar</p></div><div class="btns"><a class="b" href="https://t.me/hrbseb10thallcorse" target="_blank">Telegram</a><a class="b d" href="https://whatsapp.com/channel/0029VbF7oDdLo4hdnj39Cw17" target="_blank">WhatsApp</a></div></div>`;
 m.innerHTML=`<section>${html}</section>`;m.scrollTop=0}

(async function boot(){setTheme(theme);drawerHTML();if(cls)$('#clsLbl').textContent='Class - '+cls;const t0=Date.now();await loadCourses();
 await Promise.all(my.slice(0,6).map(i=>content(i).catch(()=>0)));render();
 setTimeout(()=>{$('#splash').classList.add('out');$('#app').classList.add('on');setTimeout(()=>$('#splash').remove(),700)},Math.max(0,1700-(Date.now()-t0)));
 addEventListener('hashchange',render);
 if('serviceWorker' in navigator&&0)navigator.serviceWorker.register('sw.js')})();
