// Shared DOM and escaping helpers.
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let videos=[], adminVideos=[], view='home', token=localStorage.getItem('tok')||sessionStorage.getItem('tok')||'';
const defaultProfiles=[
  {id:'me',name:'Dave',avatar:'/images/avatars/avatar-red-hero.svg',audience:'For Adults'},
  {id:'chris',name:'Chris',avatar:'/images/avatars/avatar-green-alien.svg',audience:'For Adults'},
  {id:'ronnie',name:'Ronnie',avatar:'/images/avatars/avatar-zombie-kid.svg',audience:'For Teens'},
  {id:'kids',name:'Kids',avatar:'/images/avatars/avatar-blue-smile.svg',audience:'For Kids',kids:true}
];

const AVATAR_OPTIONS=[
  {name:'Red Hero',src:'/images/avatars/avatar-red-hero.svg'},
  {name:'Green Alien',src:'/images/avatars/avatar-green-alien.svg'},
  {name:'Ronnie Kid',src:'/images/avatars/avatar-zombie-kid.svg'},
  {name:'Blue Smile',src:'/images/avatars/avatar-blue-smile.svg'},
  {name:'Purple Chill',src:'/images/avatars/avatar-purple-chill.svg'},
  {name:'Spirited Away',src:'/images/spirited-away.jpg'},
  {name:'Your Name',src:'/images/your-name.jpg'},
  {name:'Suzume',src:'/images/suzume.jpg'},
  {name:'A Silent Voice',src:'/images/silent-voice.jpg'},
  {name:'Weathering With You',src:'/images/weathering-with-you.jpg'},
  {name:'Garden of Words',src:'/images/garden-of-words.jpg'}
];

const J=(k,d)=>JSON.parse(localStorage.getItem(profileStoreKey(k))||d);

let profiles=[];
try{
  const stored=JSON.parse(localStorage.getItem('profiles')||'null');
  if(Array.isArray(stored)&&stored.length)profiles=stored;
}catch(e){}

if(!profiles.length){
  profiles=defaultProfiles.map(p=>({...p}));
}else{
  profiles=profiles.map((p,idx)=>{
    let avatar=p.avatar||p.image;
    if(!avatar||avatar.startsWith('data:image/svg')||(!avatar.includes('/images/')&&!avatar.startsWith('data:image/'))){
      if(p.id==='me'||idx===0)avatar='/images/avatars/avatar-red-hero.svg';
      else if(p.id==='chris'||p.id==='guest'||idx===1)avatar='/images/avatars/avatar-green-alien.svg';
      else if(p.id==='ronnie'||p.id==='teens'||idx===2)avatar='/images/avatars/avatar-zombie-kid.svg';
      else if(p.id==='kids'||p.kids||idx===3)avatar='/images/avatars/avatar-blue-smile.svg';
      else avatar='/images/avatars/avatar-purple-chill.svg';
    }
    let name=p.name;
    if(name==='Guest')name='Chris';
    if(name==='Teens')name='Ronnie';
    const audience=p.audience==='For Everyone'?'For Adults':(p.audience||'For Adults');
    return {...p,name,avatar,audience};
  });
}

try{
  const u=JSON.parse(localStorage.getItem('nextflix_user')||'null');
  if(u&&u.username){
    const me=profiles.find(p=>p.id==='me');
    if(me&&(me.name==='Dave'||me.name==='Me'||!me.name)){
      me.name=u.username[0].toUpperCase()+u.username.slice(1);
    }
  }
}catch(e){}

localStorage.setItem('profiles',JSON.stringify(profiles));

let activeProfile=localStorage.getItem('activeProfile')||'';
let manageProfiles=false, editingProfile=null, pendingAvatar='';

let profileDialogAction=null;
function openProfileDialog(title,value,action,type='text'){
  $('#profileDialogTitle').textContent=title;$('#profileDialogInput').value=value||'';$('#profileDialogInput').type=type;$('#profileDialogInput').placeholder=type==='password'?'4-digit PIN':'';profileDialogAction=action;$('#profileDialog').hidden=false;$('#profileDialogInput').focus();
}
$('#profileDialogCancel').onclick=()=>{$('#profileDialog').hidden=true;profileDialogAction=null};
$('#profileDialogSave').onclick=()=>{const value=$('#profileDialogInput').value.trim();if(profileDialogAction)profileDialogAction(value);$('#profileDialog').hidden=true;profileDialogAction=null};

const profileStoreKey=k=>`${k}:${activeProfile||'guest'}`;
const prog=()=>J('prog','{}'), mylist=()=>J('mylist','[]');
const activeAudience=()=>profiles.find(p=>p.id===activeProfile)?.audience||'For Adults';
const activeAge=()=>activeAudience()==='For Kids'?'kids':activeAudience()==='For Teens'?'teens':'adults';
const mediaPath=file=>'/media/'+String(file).split(/[\\/]/).map(encodeURIComponent).join('/');
const youtubeId=url=>{try{const u=new URL(url);if(u.hostname.includes('youtu.be'))return u.pathname.slice(1).split('/')[0];if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)?.[1]}catch{}return null};
const isYoutube=v=>Boolean(youtubeId(v.video_url||''));
const videoSource=v=>v.video_url||mediaPath(v.file);
const poster=v=>v.poster?mediaPath(v.poster):(isYoutube(v)?`https://i.ytimg.com/vi/${encodeURIComponent(youtubeId(v.video_url))}/hqdefault.jpg`:'');
const seriesList=list=>{const groups=new Map();list.forEach(v=>{const key=v.series||`__${v.id}`;if(!groups.has(key))groups.set(key,{...v,episodes:v.series?[]:null});if(v.series)groups.get(key).episodes.push(v)});return [...groups.values()].map(v=>{if(v.episodes)v.episodes.sort((a,b)=>(a.episode||999)-(b.episode||999));return v})};
addEventListener('scroll',()=>$('#nav').classList.toggle('solid',scrollY>40));

function updateProfileBtn(){
  const btn=$('#profileBtn');if(!btn)return;
  const p=profiles.find(item=>item.id===activeProfile)||profiles[0];
  if(p&&(p.avatar||p.image)){
    btn.style.backgroundImage=`url('${p.avatar||p.image}')`;
    btn.style.backgroundSize='cover';
    btn.style.backgroundPosition='center';
    btn.textContent='';
    btn.setAttribute('aria-label',`Profile: ${p.name}`);
  }else{
    btn.style.backgroundImage='none';
    btn.textContent=(p?.name||'A')[0].toUpperCase();
  }
}

function renderProfiles(){
  const profilesEl=$('#profiles'), titleEl=$('#profileTitle'), manageBtn=$('#manageProfilesBtn');
  if(manageProfiles){
    profilesEl.classList.add('manage-mode');
    titleEl.textContent='Manage Profiles:';
    manageBtn.textContent='DONE';
    manageBtn.classList.add('done-mode');
  }else{
    profilesEl.classList.remove('manage-mode');
    titleEl.textContent="Who's watching?";
    manageBtn.textContent='MANAGE PROFILES';
    manageBtn.classList.remove('done-mode');
  }

  const items=profiles.map(p=>`
    <div class="profile-wrap">
      <button class="profile ${p.locked?'is-locked':''}" data-profile="${esc(p.id)}" type="button" aria-label="${esc(p.name)}">
        <span class="profile-avatar" style="background-image:url('${esc(p.avatar||p.image||'/images/avatars/avatar-red-hero.svg')}')"></span>
        <strong>${esc(p.name)}</strong>
      </button>
    </div>
  `).join('');

  const addCard=`
    <div class="profile-wrap">
      <button class="profile add-profile" id="addProfileBtn" type="button" aria-label="Add Profile">
        <div class="add-profile-box">
          <svg class="add-circle-icon" viewBox="0 0 100 100" width="88" height="88" aria-hidden="true">
            <circle cx="50" cy="50" r="48" fill="currentColor"/>
            <path d="M 44 26 H 56 V 44 H 74 V 56 H 56 V 74 H 44 V 56 H 26 V 44 H 44 Z" fill="#141414"/>
          </svg>
        </div>
        <strong>Add Profile</strong>
      </button>
    </div>
  `;

  $('#profileGrid').innerHTML=items+addCard;
}

function openProfiles(pushHistory=true){
  manageProfiles=false;
  renderProfiles();
  $('#profiles').classList.add('on');
  document.body.classList.add('profiles-open');
  if(pushHistory&&window.history){
    if(!history.state||!history.state.profilesOpen){
      try{history.pushState({profilesOpen:true},'','#profiles')}catch(e){}
    }
  }
}

function closeProfiles(cleanUrl=true){
  $('#profiles').classList.remove('on');
  document.body.classList.remove('profiles-open');
  if(cleanUrl&&location.hash==='#profiles'){
    try{history.replaceState(null,'',window.location.pathname+window.location.search)}catch(e){}
  }
}

function handleReturnHome(){
  if(!activeProfile||!profiles.some(p=>p.id===activeProfile)){
    activeProfile=profiles[0]?.id||'me';
    localStorage.setItem('activeProfile',activeProfile);
    updateProfileBtn();
  }
  closeProfiles();
  load();
}

if($('#profilesBackBtn'))$('#profilesBackBtn').onclick=handleReturnHome;
if($('#profilesLogo'))$('#profilesLogo').onclick=e=>{e.preventDefault();handleReturnHome()};

window.addEventListener('popstate',e=>{
  if($('#profiles')&&$('#profiles').classList.contains('on')){
    closeProfiles(false);
    if(!activeProfile||!profiles.some(p=>p.id===activeProfile)){
      activeProfile=profiles[0]?.id||'me';
      localStorage.setItem('activeProfile',activeProfile);
      updateProfileBtn();
    }
    load();
  }
});

function selectProfile(id){
  const selected=profiles.find(p=>p.id===id);
  if(!selected)return;
  if(manageProfiles)return;
  if(selected.locked){
    openProfileDialog(`Enter PIN for ${selected.name}`,'',pin=>{
      if(pin===selected.pin)finishSelect(id);
      else alert('Incorrect PIN.');
    },'password');
    return;
  }
  finishSelect(id);
}

function finishSelect(id){
  activeProfile=id;
  localStorage.setItem('activeProfile',id);
  updateProfileBtn();
  closeProfiles();
  load();
}

$('#manageProfilesBtn').onclick=()=>{manageProfiles=!manageProfiles;renderProfiles()};

$('#profileGrid').onclick=e=>{
  if(e.target.closest('#addProfileBtn')){openEditProfileModal(null);return}
  const card=e.target.closest('[data-profile]');
  if(card){
    const id=card.dataset.profile;
    if(manageProfiles){
      const p=profiles.find(item=>item.id===id);
      if(p)openEditProfileModal(p);
    }else{
      selectProfile(id);
    }
  }
};

function openEditProfileModal(profile){
  editingProfile=profile;
  const isNew=!profile;
  $('#editModalHeading').textContent=isNew?'Add Profile':'Edit Profile';

  if(isNew){
    const used=new Set(profiles.map(p=>p.avatar));
    const nextUnused=AVATAR_OPTIONS.find(a=>!used.has(a.src))||AVATAR_OPTIONS[profiles.length%AVATAR_OPTIONS.length];
    pendingAvatar=nextUnused.src;
  }else{
    pendingAvatar=profile.avatar||profile.image||'/images/avatars/avatar-red-hero.svg';
  }

  $('#editAvatarPreview').style.backgroundImage=`url('${pendingAvatar}')`;
  $('#editProfileNameInput').value=isNew?'':(profile.name||'');
  $('#editProfileAudience').value=isNew?'For Adults':(profile.audience||'For Adults');
  $('#editProfilePin').value=(profile&&profile.pin)?profile.pin:'';
  $('#btnDeleteProfile').style.display=(!isNew&&profiles.length>1)?'inline-block':'none';

  $('#profileEditModal').hidden=false;
  $('#editProfileNameInput').focus();
}

function closeEditProfileModal(){
  $('#profileEditModal').hidden=true;
  editingProfile=null;
  pendingAvatar='';
}

$('#btnCancelProfile').onclick=closeEditProfileModal;

$('#btnSaveProfile').onclick=()=>{
  const name=$('#editProfileNameInput').value.trim();
  if(!name){alert('Please enter a profile name.');$('#editProfileNameInput').focus();return}
  const cleanName=name.slice(0,20);
  const audience=$('#editProfileAudience').value;
  const pin=$('#editProfilePin').value.trim();
  if(pin&&!/^\d{4}$/.test(pin)){alert('PIN must be exactly 4 digits (or leave blank for no PIN).');$('#editProfilePin').focus();return}

  if(editingProfile){
    editingProfile.name=cleanName;
    editingProfile.avatar=pendingAvatar;
    editingProfile.audience=audience;
    editingProfile.kids=(audience==='For Kids');
    if(pin){editingProfile.locked=true;editingProfile.pin=pin}
    else{delete editingProfile.locked;delete editingProfile.pin}
  }else{
    const id='profile-'+Date.now();
    const newProfile={id,name:cleanName,avatar:pendingAvatar,audience,kids:(audience==='For Kids')};
    if(pin){newProfile.locked=true;newProfile.pin=pin}
    profiles.push(newProfile);
  }

  localStorage.setItem('profiles',JSON.stringify(profiles));
  closeEditProfileModal();
  renderProfiles();
  updateProfileBtn();
};

$('#btnDeleteProfile').onclick=()=>{
  if(!editingProfile)return;
  if(profiles.length<=1){alert('You cannot delete the only remaining profile.');return}
  if(!confirm(`Delete profile "${editingProfile.name}"? This cannot be undone.`))return;

  const deletedId=editingProfile.id;
  profiles=profiles.filter(p=>p.id!==deletedId);
  if(activeProfile===deletedId){activeProfile=profiles[0].id;localStorage.setItem('activeProfile',activeProfile)}
  localStorage.setItem('profiles',JSON.stringify(profiles));
  closeEditProfileModal();
  renderProfiles();
  updateProfileBtn();
};

$('#btnChangeAvatar').onclick=()=>{
  $('#avatarPickerGrid').innerHTML=AVATAR_OPTIONS.map(a=>`
    <button type="button" class="avatar-choice-btn ${pendingAvatar===a.src?'is-selected':''}" data-avatar-src="${esc(a.src)}" style="background-image:url('${esc(a.src)}')" title="${esc(a.name)}" aria-label="${esc(a.name)}"></button>
  `).join('');
  $('#avatarPickerModal').hidden=false;
};

$('#avatarPickerGrid').onclick=e=>{
  const btn=e.target.closest('[data-avatar-src]');
  if(btn){
    pendingAvatar=btn.dataset.avatarSrc;
    $('#editAvatarPreview').style.backgroundImage=`url('${pendingAvatar}')`;
    $('#avatarPickerModal').hidden=true;
  }
};

$('#btnCancelAvatar').onclick=()=>{$('#avatarPickerModal').hidden=true};
$('#btnUploadCustom').onclick=()=>{$('#profileImage').click()};

$('#profileImage').onchange=e=>{
  const file=e.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    pendingAvatar=reader.result;
    $('#editAvatarPreview').style.backgroundImage=`url('${pendingAvatar}')`;
    $('#avatarPickerModal').hidden=true;
  };
  reader.readAsDataURL(file);
  e.target.value='';
};

$('#profileBtn').onclick=openProfiles;

// Load and render the public video catalogue.
async function load(){
  try {
    const res = await fetch('/api/videos?audience='+activeAge()+'&q='+encodeURIComponent($('#q').value.trim()));
    if (res.ok) {
      videos = await res.json();
    } else {
      console.warn('API error fetching videos:', res.status);
    }
  } catch (err) {
    console.error('Error in load():', err);
  }
  render();
}
async function loadAdminLibrary(){
  if(!token)return;
  const r=await fetch('/api/admin/videos?q='+encodeURIComponent($('#q').value.trim()),{headers:{'x-token':token}});
  if(!r.ok)return;
  adminVideos=await r.json();
  renderLib();
}
$('#episodes').onclick=e=>{const button=e.target.closest('[data-episode]');if(button)play(+button.dataset.episode)};
$('#tools').onclick=e=>{const button=e.target.closest('[data-skip]');if(button)vid.currentTime=Math.max(0,vid.currentTime+Number(button.dataset.skip))};
$('#speed').onchange=e=>{vid.playbackRate=Number(e.target.value)};
function card(v,i,removeProgress=false){
  const displayTitle=v.series||v.title, episodeText=v.series?`${v.episodes.length} episode${v.episodes.length===1?'':'s'}`:'';
  const p=prog()[v.id], pct=p&&p.d?Math.min(100,p.t/p.d*100):0, inList=mylist().includes(v.id);
  const body=`<div class="th" style="${poster(v)?`background-image:url(${poster(v)})`:''}">${!poster(v)&&videoSource(v)&&!isYoutube(v)?`<video src="${videoSource(v)}#t=2" muted preload="metadata"></video>`:''}${pct>2?`<i style="width:${pct}%"></i>`:''}<em>${esc(displayTitle)}</em></div>
    <div class="inf"><div class="ib"><span data-id="${v.id}" title="Play">▶</span><span data-add="${v.id}" title="My List">${inList?'✓':'+'}</span><span data-info="${v.id}" title="More info" style="margin-left:auto">⌄</span></div>
    ${removeProgress?`<button class="remove-progress" data-remove-progress="${v.id}" title="Remove from Continue Watching" aria-label="Remove ${esc(displayTitle)} from Continue Watching">× Remove</button>`:''}<b>${90+v.id%9}% Match</b> <small>${v.year||''} · HD</small><br><small>${esc(v.category)} · ${episodeText||v.views+' views'}</small></div>`;
  return i===undefined?`<div class="card" tabindex="0" data-id="${v.id}">${body}</div>`
    :`<div class="card" tabindex="0" data-id="${v.id}"><div class="n">${i+1}</div><div class="bx">${body}</div></div>`;
}
const row=(title,list,cls='',removeProgress=false)=>list.length?`<section class="row ${cls}"><h2>${esc(title)}</h2><div class="wrap"><button class="arr l" data-s="-1">‹</button><div class="track">${list.map((v,i)=>card(v,cls?i:undefined,removeProgress)).join('')}</div><button class="arr rt" data-s="1">›</button></div></section>`:'';

function render(){
  const m=$('#main');
  if(view==='list'||view==='pop'){
    const l=view==='list'?videos.filter(v=>mylist().includes(v.id)):[...videos].sort((a,b)=>b.views-a.views);
    m.innerHTML=`<div class="gridv"><h2>${view==='list'?'My List':'New & Popular'}</h2>${l.map(v=>card(v)).join('')||'<p style="color:#b3b3b3">Nothing here yet. Hit + on any title to add it.</p>'}</div>`;return;
  }
  if(!videos.length){
    m.innerHTML=`<div class="empty"><h1>${$('#q').value?'No matches found':'No titles in this section'}</h1><p>${$('#q').value?'Try another title or genre.':'Try switching to another profile or clearing your search.'}</p>${$('#q').value?'<button class="b g" onclick="$(\'#q\').value=\'\';load()">Clear Search</button>':'<button class="b g" onclick="openProfiles()">Switch Profile</button>'}</div>`;return;
  }
  const displayVideos=seriesList(videos), selected=videos.find(v=>v.featured)||videos[0], f=selected, pr=prog(), cont=displayVideos.filter(v=>v.episodes?v.episodes.some(e=>pr[e.id]&&pr[e.id].t>5&&pr[e.id].t<pr[e.id].d-5):pr[v.id]&&pr[v.id].t>5&&pr[v.id].t<pr[v.id].d-5);
  const cats=[...new Set(displayVideos.map(v=>v.category))], top=[...displayVideos].sort((a,b)=>b.views-a.views).slice(0,10);
  m.innerHTML=`<section class="hero">${poster(f)?`<div class="bg" style="background:url(${poster(f)}) center/cover"></div>`:''}
    ${!isYoutube(f)?`<video id="hv" src="${videoSource(f)}" muted loop autoplay playsinline></video>`:''}
    <div class="c"><div class="badge"><b>N</b> ${esc(activeAudience()).toUpperCase()}</div><h1>${esc(f.title)}</h1><p>${esc(f.description)||'Now streaming on NEXTFLIX.'}</p>
    <div class="acts"><button class="b w" data-id="${f.id}">▶ Play</button><button class="b g" data-info="${f.id}">ⓘ More Info</button></div></div>
    <button class="mute" id="mt" aria-label="Unmute preview"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"></path><path d="m18 9 3 3-3 3"></path><path d="m21 9-3 6"></path></svg></button></section>`+
    row('Continue Watching',cont,'',true)+row('Top 10 on NEXTFLIX Today',top,'t10')+row('Trending Now',[...displayVideos].sort((a,b)=>b.views-a.views))+
    row('My List',displayVideos.filter(v=>mylist().includes(v.id)))+cats.map(c=>row(c,displayVideos.filter(v=>v.category===c))).join('');
}
$('#main').addEventListener('click',e=>{
  const remove=e.target.closest('[data-remove-progress]');
  if(remove){const p=prog();delete p[remove.dataset.removeProgress];localStorage.setItem(profileStoreKey('prog'),JSON.stringify(p));render();return}
  const s=e.target.closest('[data-s]');
  if(s){const t=s.parentElement.querySelector('.track');t.scrollBy({left:s.dataset.s*t.clientWidth*.9});return}
  if(e.target.closest('#mt')){const button=e.target.closest('#mt'),v=$('#hv');v.muted=!v.muted;if(!v.muted)v.play();button.setAttribute('aria-label',v.muted?'Unmute preview':'Mute preview');button.innerHTML=v.muted?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"></path><path d="m18 9 3 3-3 3"></path><path d="m21 9-3 6"></path></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"></path><path d="M17 9.5a4 4 0 0 1 0 5"></path><path d="M19.5 7a8 8 0 0 1 0 10"></path></svg>';return}
  const a=e.target.closest('[data-add]');if(a){toggle(+a.dataset.add);return}
  const i=e.target.closest('[data-info]');if(i){play(+i.dataset.info,true);return}
  const b=e.target.closest('[data-id]');if(b)play(+b.dataset.id);
});
function toggle(id){const l=mylist(),i=l.indexOf(id);i<0?l.push(id):l.splice(i,1);localStorage.setItem(profileStoreKey('mylist'),JSON.stringify(l));render()}
// hover preview: after a short delay the card plays a muted clip
let hv;
$('#main').addEventListener('mouseover',e=>{const c=e.target.closest('.card');if(!c||c.dataset.p)return;
  hv=setTimeout(()=>{const v=videos.find(x=>x.id==c.dataset.id),th=c.querySelector('.th');if(!v||!th||!c.matches(':hover'))return;
    c.dataset.p=1;const el=document.createElement('video');el.src=videoSource(v);el.muted=true;el.autoplay=true;el.loop=true;th.prepend(el)},700)});
$('#main').addEventListener('mouseout',e=>{const c=e.target.closest('.card');if(!c||c.contains(e.relatedTarget))return;clearTimeout(hv);
  const el=c.querySelector('.th video');if(el){el.remove();delete c.dataset.p}});

// Player controls and playback progress.
const vid=$('#vid'); let cur=null,last=0;
function play(id,infoOnly){
  cur=videos.find(v=>v.id===id); if(!cur)return;
  stopPlayback();
  vid.style.display='block';$('#aud').style.display='none';$('#pic').style.display='none';$('#doc').style.display='none';$('#pl').style.display='inline-flex';
  const seriesEpisodes=cur.series?videos.filter(v=>v.series===cur.series).sort((a,b)=>(a.episode||999)-(b.episode||999)):[];
  $('#pt').textContent=cur.series||cur.title; $('#pm').innerHTML=`${90+cur.id%9}% Match <span>${cur.year||''} · ${esc(cur.category)} · ${cur.series?seriesEpisodes.length+' episodes':'HD'}</span>`; $('#pd').textContent=cur.description;
  $('#episodes').innerHTML=seriesEpisodes.length?`<div class="eps">${seriesEpisodes.map((episode,index)=>`<button class="${episode.id===cur.id?'on':''}" data-episode="${episode.id}">Episode ${episode.episode||index+1}</button>`).join('')}</div>`:'';
  const lb=$('#pl'), sync=()=>lb.textContent=mylist().includes(cur.id)?'✓ In My List':'+ My List';
  sync(); lb.onclick=()=>{toggle(cur.id);sync()};
  const yt=youtubeId(cur.video_url||'');$('#pic').style.display='none';$('#doc').style.display='none';$('#yt').style.display=yt?'block':'none';$('#tools').style.display=yt?'none':'flex';vid.style.display=yt?'none':'block';vid.muted=false;vid.src=yt?'':'/'+videoSource(cur).replace(/^\/+/,''); if(!yt)vid.src=videoSource(cur); vid.poster=poster(cur);
  if(yt)$('#yt').src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?autoplay=1&controls=1&rel=0&playsinline=1`;
  $('#trailer').style.display=cur.trailer_url?'inline-flex':'none';$('#trailer').href=cur.trailer_url||'#';
  const p=prog()[id]; vid.onloadedmetadata=()=>{if(p&&p.t<vid.duration-5)vid.currentTime=p.t};
  $('#modal').classList.add('on'); $('#modal').scrollTop=0;
  if(!yt)vid.play().catch(()=>{}); fetch(`/api/videos/${id}/view`,{method:'POST'});
}
vid.ontimeupdate=()=>{if(!cur||Date.now()-last<2000)return;last=Date.now();
  const p=prog();p[cur.id]={t:vid.currentTime,d:vid.duration};localStorage.setItem(profileStoreKey('prog'),JSON.stringify(p))};
function stopPlayback(){
  [vid,$('#aud')].forEach(el=>{el.pause();el.removeAttribute('src');el.load()});
  $('#yt').removeAttribute('src');
  document.querySelectorAll('.th video').forEach(el=>{el.pause();el.remove()});
  document.querySelectorAll('.card[data-p]').forEach(el=>delete el.dataset.p);
}
function closePlayer(){stopPlayback();$('#pic').removeAttribute('src');$('#doc').removeAttribute('src');$('#modal').classList.remove('on');cur=null;load()}
$('#folderUp').onsubmit=async e=>{e.preventDefault();const form=e.target,msg=$('#fmsg'),fd=new FormData(form);const r=await fetch('/api/import-folder',{method:'POST',headers:{'x-token':token},body:fd});const d=await r.json();if(!r.ok){msg.textContent=d.error||'Could not import folder';return}msg.textContent=`Imported ${d.imported} item${d.imported===1?'':'s'}.`;form.reset();form.recursive.checked=true;load()};
$('#close').onclick=closePlayer;
$('#modal').onclick=e=>{if(e.target.id==='modal')closePlayer()};
addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if($('#profileEditModal')&&!$('#profileEditModal').hidden){closeEditProfileModal();return}
    if($('#avatarPickerModal')&&!$('#avatarPickerModal').hidden){$('#avatarPickerModal').hidden=true;return}
    if($('#profiles')&&$('#profiles').classList.contains('on')){handleReturnHome();return}
    if($('#modal').classList.contains('on'))closePlayer();
    else $('#admin').classList.remove('on');
  }
});

document.querySelectorAll('nav [data-v]').forEach(a=>a.onclick=()=>{view=a.dataset.v;
  document.querySelectorAll('nav [data-v]').forEach(x=>x.classList.toggle('on',x===a));scrollTo(0,0);render()});
$('#logo').onclick=()=>document.querySelector('[data-v=home]').click();
$('#si').onclick=()=>{$('#sb').classList.toggle('open');$('#q').focus()};
let t;$('#q').oninput=()=>{clearTimeout(t);t=setTimeout(()=>{if(view!=='home')document.querySelector('[data-v=home]').click();load()},250)};

// Admin authentication and session persistence.
function showPanel(){$('#login').hidden=!!token;$('#panel').hidden=!token}
function setToken(nextToken){
  token=nextToken||'';
  if(token){
    localStorage.setItem('tok',token);
    sessionStorage.setItem('tok',token);
    return;
  }
  localStorage.removeItem('tok');
  sessionStorage.removeItem('tok');
}
async function ensureSession(){
  if(!token)return false;
  const r=await fetch('/api/session',{headers:{'x-token':token}});
  if(r.ok)return true;
  setToken('');
  return false;
}
async function openAdmin(){
  $('#admin').classList.add('on');
  if(token){
    try{await ensureSession()}catch{}
  }
  showPanel();
  if(token)loadAdminLibrary();
}
$('#adminBtn').onclick=()=>{window.location.href='/admin'};$('#aclose').onclick=()=>$('#admin').classList.remove('on');
$('#logout').onclick=()=>{setToken('');$('#panel').hidden=true;$('#login').hidden=false;$('#pw').value='';};
$('#login').onsubmit=async e=>{e.preventDefault();
  const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#pw').value})});
  const d=await r.json();if(!r.ok){$('#lmsg').textContent=d.error;return}
  setToken(d.token);$('#lmsg').textContent='';showPanel();loadAdminLibrary()};

// Upload and library management.
function grabFrame(file){return new Promise(res=>{
  const v=document.createElement('video');v.muted=true;v.preload='metadata';v.src=URL.createObjectURL(file);
  v.onloadedmetadata=()=>v.currentTime=Math.min(2,v.duration/3);
  v.onseeked=()=>{const c=document.createElement('canvas');c.width=1280;c.height=720;c.getContext('2d').drawImage(v,0,0,1280,720);
    c.toBlob(b=>{URL.revokeObjectURL(v.src);res(b)},'image/jpeg',.85)};
  v.onerror=()=>res(null)})}
$('#up').onsubmit=async e=>{e.preventDefault();
  const form=e.target,fd=new FormData(form),msg=$('#umsg'),bar=$('#bar');
  if(!fd.get('video').size&&!fd.get('videoUrl').trim()){msg.textContent='Choose a video file or enter a direct video link';return}
  if(!fd.get('video').size&&!fd.get('poster').size)fd.delete('poster');
  else if(!fd.get('poster').size){const b=await grabFrame(fd.get('video'));if(b)fd.set('poster',b,'poster.jpg');else fd.delete('poster')}
  bar.style.display='block';msg.textContent='Uploading…';
  const x=new XMLHttpRequest();x.open('POST','/api/videos');x.setRequestHeader('x-token',token);
  x.upload.onprogress=ev=>bar.firstChild.style.width=(ev.loaded/ev.total*100)+'%';
  x.onload=()=>{bar.style.display='none';bar.firstChild.style.width=0;
    if(x.status===200){msg.textContent='Published. It is live on the home page.';form.reset();load()}
    else{msg.textContent=JSON.parse(x.responseText).error||'Upload failed';if(x.status===401){setToken('');showPanel()}}};
  x.onerror=()=>{msg.textContent='Network error during upload'};x.send(fd)};
let selectedLibraryId=null;
function renderLib(){$('#lib').innerHTML=adminVideos.length?`<div class="library-grid">${adminVideos.map(v=>`<div class="li"><div class="library-card" data-library-action="${v.id}" role="button" tabindex="0" aria-label="Manage ${esc(v.title)}"><div class="library-thumb" style="${poster(v)?`background-image:url(${poster(v)})`:''}">${poster(v)?'':'▶'}</div><div class="library-info"><strong>${esc(v.title)}${v.hidden?' (Hidden)':''}</strong><small>${esc(v.category)} · ${v.year||'—'} · ${v.views} views</small></div></div><div class="edit" data-edit="${v.id}" hidden><button class="edit-close" data-close-edit="${v.id}" type="button" aria-label="Close editor">✕</button>
  <input data-field="title" data-id="${v.id}" value="${esc(v.title)}" aria-label="Title">
  <textarea data-field="description" data-id="${v.id}" rows="2" aria-label="Description">${esc(v.description)}</textarea>
  <div class="two"><input data-field="category" data-id="${v.id}" value="${esc(v.category)}" aria-label="Category">
  <input data-field="year" data-id="${v.id}" type="number" value="${v.year||''}" aria-label="Year"></div>
  <label class="age-label">Age rating<select data-field="ageRating" data-id="${v.id}" aria-label="Age rating"><option value="adults" ${v.age_rating==='adults'?'selected':''}>Adults</option><option value="teens" ${v.age_rating==='teens'?'selected':''}>Teens</option><option value="kids" ${v.age_rating==='kids'?'selected':''}>Kids</option></select></label>
  <label>Replace video (optional)<input data-file="video" type="file" accept="video/*"></label>
  <input data-field="videoUrl" type="url" value="${esc(v.video_url||'')}" placeholder="Direct video link (optional)">
  <input data-field="trailerUrl" type="url" value="${esc(v.trailer_url||'')}" placeholder="Trailer link (optional)">
  <label><input data-field="featured" type="checkbox" value="1" ${v.featured?'checked':''}> Use as homepage banner</label>
  <label><input data-field="hidden" type="checkbox" value="1" ${v.hidden?'checked':''}> Hide from the home page</label>
  <label>Replace poster (optional)<input data-file="poster" type="file" accept="image/*"></label>
  <small>${v.views} views · ${esc(v.file)}</small><button data-save="${v.id}">Save changes</button><button class="edit-delete" data-del="${v.id}" type="button">Delete video</button></div></div>`).join('')}</div>`:'<small>No videos yet.</small>'}
$('#lib').onclick=async e=>{
  const close=e.target.closest('[data-close-edit]')?.dataset.closeEdit;
  if(close){const editor=document.querySelector(`[data-edit="${close}"]`);editor.hidden=true;editor.classList.remove('edit-popup');return}
  const action=e.target.closest('[data-library-action]')?.dataset.libraryAction;
  if(action){const video=videos.find(v=>String(v.id)===action);selectedLibraryId=action;$('#libraryActionTitle').textContent=video?.title||'Manage video';$('#libraryActions').hidden=false;return}
  const id=e.target.dataset.del;
  if(id){if(!confirm('Delete this video permanently?'))return;
    await fetch('/api/videos/'+id,{method:'DELETE',headers:{'x-token':token}});load();loadAdminLibrary();return}
  const save=e.target.dataset.save;if(!save)return;
  const row=document.querySelector(`[data-edit="${save}"]`),fd=new FormData();
  row.querySelectorAll('[data-field]').forEach(el=>fd.append(el.dataset.field,el.type==='checkbox'?(el.checked?'1':'0'):el.value));
  row.querySelectorAll('[data-file]').forEach(el=>{if(el.files[0])fd.append(el.dataset.file,el.files[0])});
  e.target.disabled=true;
  const r=await fetch('/api/videos/'+save,{method:'PUT',headers:{'x-token':token},body:fd});
  e.target.disabled=false;
  const d=await r.json(); if(!r.ok){alert(d.error||'Could not save video');return} load();loadAdminLibrary()};
 $('#libraryActions').onclick=async e=>{
   if(e.target.closest('[data-action-close]')){$('#libraryActions').hidden=true;return}
   if(e.target.closest('[data-action-edit]')){const editor=document.querySelector(`[data-edit="${selectedLibraryId}"]`);$('#libraryActions').hidden=true;editor.hidden=false;editor.classList.add('edit-popup');return}
   if(e.target.closest('[data-action-delete]')){if(!confirm('Delete this video permanently?'))return;await fetch('/api/videos/'+selectedLibraryId,{method:'DELETE',headers:{'x-token':token}});$('#libraryActions').hidden=true;load();loadAdminLibrary()}
 };
load();
renderProfiles();
updateProfileBtn();
if(activeProfile&&profiles.some(p=>p.id===activeProfile)){
  // valid active profile
}else{
  openProfiles(false);
}
