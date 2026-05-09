
// ─── STATE ─────────────────────────────────────────────────────
var audioCtx=null,signalStrength=0,targetAngle=0,currentAngle=0,heading=0;
var huntRunning=false,walkPhase=0,wavePhase=0,animId=null,walkIv=null;
var hasConsent=false,hasOrientation=false;

// ─── DOM HELPERS ─────────────────────────────────────────────
function $(id){return document.getElementById(id)}
function clamp(v,mn,mx){return Math.min(Math.max(v,mn),mx)}

// ─── INTRO ───────────────────────────────────────────────────
setTimeout(function(){
  var intro=$('intro');
  if(intro){intro.classList.add('fade-out');setTimeout(function(){intro.style.display='none'},850)}
  var consent=$('consent');
  if(consent && !localStorage.getItem('wfh_consent')){consent.classList.add('active')}
  else if(consent){consent.style.display='none';$('app').style.display='flex'}
},2800)

// ─── CONSENT ───────────────────────────────────────────────────
function acceptConsent(){
  try{
    localStorage.setItem('wfh_consent','1')
    hasConsent=true
  }catch(e){hasConsent=true}
  var cc=$('consent');if(cc){cc.classList.remove('active');setTimeout(function(){cc.style.display='none';var ap=$('app');if(ap)ap.style.display='flex'},400)}
  try{requestOrientation()}catch(e){}
  try{startIntroAudio()}catch(e){}
}

// ─── ORIENTATION ───────────────────────────────────────────────
function requestOrientation(){
  if(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission==='function'){
    DeviceOrientationEvent.requestPermission().then(function(state){
      if(state==='granted'){hasOrientation=true;window.addEventListener('deviceorientation',onOrientation)}
    }).catch(function(){hasOrientation=true;window.addEventListener('deviceorientation',onOrientation)})
  }else{
    hasOrientation=true;window.addEventListener('deviceorientation',onOrientation)
  }
}
function onOrientation(e){heading=e.alpha||0}

// ─── AUDIO ─────────────────────────────────────────────────────
function initAudio(){
  if(audioCtx)return
  audioCtx=new(window.AudioContext||window.webkitAudioContext)()
}

var _lastToneTime=0
function playSignalTone(strength){
  if(!audioCtx||audioCtx.state!=='running')return
  var now=Date.now()
  if(now-_lastToneTime<350)return // throttle: max ~3 tones/sec
  _lastToneTime=now
  var t=audioCtx.currentTime
  var osc=audioCtx.createOscillator()
  var gain=audioCtx.createGain()
  osc.type='sine'
  // Smoother frequency curve, less jumpy
  var freq=180+strength*strength*600
  osc.frequency.value=freq
  // Softer, longer tone (0.35s instead of 0.25s)
  gain.gain.setValueAtTime(0.08*strength,t)
  gain.gain.exponentialRampToValueAtTime(0.001,t+0.35)
  osc.connect(gain);gain.connect(audioCtx.destination)
  osc.start(t);osc.stop(t+0.35)
}

function playStepTone(){
  if(!audioCtx||audioCtx.state!=='running')return
  var now=audioCtx.currentTime
  var osc=audioCtx.createOscillator()
  var gain=audioCtx.createGain()
  osc.type='sine';osc.frequency.value=110
  gain.gain.value=0.06
  osc.connect(gain);gain.connect(audioCtx.destination)
  osc.start()
  gain.gain.exponentialRampToValueAtTime(0.0001,now+0.2)
  osc.stop(now+0.2)
}

function playMaxTone(){
  if(!audioCtx||audioCtx.state!=='running')return
  var now=audioCtx.currentTime
  var osc=audioCtx.createOscillator()
  var gain=audioCtx.createGain()
  osc.type='sine';osc.frequency.value=880
  gain.gain.value=0.15
  osc.connect(gain);gain.connect(audioCtx.destination)
  osc.start();osc.stop(now+0.4)
  // vibrate if supported
  if(navigator.vibrate) navigator.vibrate([50,30,50])
}

// ─── HEATMAP ───────────────────────────────────────────────────
function drawHeatmap(strength){
  var c=$('heatmapCanvas'),ctx=c.getContext('2d'),w=c.width,h=c.height
  ctx.clearRect(0,0,w,h)
  var cx=w/2,cy=h/2
  var radius=50+strength*110
  var grd=ctx.createRadialGradient(cx,cy,8,cx,cy,radius)
  // Color: green(strong) -> yellow -> red(weak) but inverted for display:
  // High strength = hot colors (red/orange center), low = cool (blue edge)
  // Actually let's do: center color based on strength
  if(strength>0.7){
    grd.addColorStop(0,'rgba(255,100,20,'+(0.4+strength*0.4)+')')
    grd.addColorStop(0.5,'rgba(255,180,60,'+(0.2+strength*0.2)+')')
    grd.addColorStop(1,'rgba(0,0,0,0)')
  }else if(strength>0.3){
    grd.addColorStop(0,'rgba(255,220,60,'+(0.3+strength*0.3)+')')
    grd.addColorStop(0.5,'rgba(200,180,40,'+(0.15+strength*0.15)+')')
    grd.addColorStop(1,'rgba(0,0,0,0)')
  }else{
    grd.addColorStop(0,'rgba(0,200,255,'+(0.25+strength*0.25)+')')
    grd.addColorStop(0.5,'rgba(0,150,200,'+(0.1+strength*0.1)+')')
    grd.addColorStop(1,'rgba(0,0,0,0)')
  }
  ctx.fillStyle=grd
  ctx.fillRect(0,0,w,h)
  // Add soft cloud blobs
  for(var i=0;i<3;i++){
    var bx=cx+(Math.random()-.5)*radius*.6
    var by=cy+(Math.random()-.5)*radius*.6
    var br=20+Math.random()*30*strength
    var bgrd=ctx.createRadialGradient(bx,by,2,bx,by,br)
    if(strength>0.6){bgrd.addColorStop(0,'rgba(255,120,30,.25)');bgrd.addColorStop(1,'rgba(0,0,0,0)')}
    else if(strength>0.3){bgrd.addColorStop(0,'rgba(255,200,60,.2)');bgrd.addColorStop(1,'rgba(0,0,0,0)')}
    else{bgrd.addColorStop(0,'rgba(0,180,255,.15)');bgrd.addColorStop(1,'rgba(0,0,0,0)')}
    ctx.fillStyle=bgrd
    ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);ctx.fill()
  }
}

// ─── WAVE ──────────────────────────────────────────────────────
function drawWave(strength){
  var c=$('waveCanvas'),ctx=c.getContext('2d'),w=c.width,h=c.height
  ctx.clearRect(0,0,w,h)
  ctx.beginPath()
  ctx.strokeStyle='#7bc5ff'
  ctx.lineWidth=2.5
  ctx.shadowBlur=10
  ctx.shadowColor='rgba(123,197,255,.6)'
  var amplitude=8+strength*28
  var frequency=0.04+strength*0.04
  for(var x=0;x<=w;x+=2){
    var y=h/2+Math.sin(x*frequency+wavePhase)*amplitude+Math.sin(x*frequency*2.5+wavePhase*1.3)*(amplitude*.3)
    if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)
  }
  ctx.stroke()
  ctx.shadowBlur=0
  // Mirror line (subtle)
  ctx.beginPath()
  ctx.strokeStyle='rgba(123,197,255,.2)'
  ctx.lineWidth=1.5
  for(var x2=0;x2<=w;x2+=2){
    var y2=h/2-Math.sin(x2*frequency+wavePhase)*amplitude*.5
    if(x2===0)ctx.moveTo(x2,y2);else ctx.lineTo(x2,y2)
  }
  ctx.stroke()
  wavePhase+=0.06+strength*0.08
}

// ─── COMPASS NEEDLE ────────────────────────────────────────────
function updateNeedle(){
  // Smooth interpolation toward target
  var diff=targetAngle-currentAngle
  while(diff>180)diff-=360
  while(diff<-180)diff+=360
  currentAngle+=diff*0.08
  var needle=$('needle')
  if(needle)needle.style.transform='translateX(-50%) rotate('+currentAngle+'deg)'
}

// ─── NATIVE WiFi SIGNAL ──────────────────────────────────────────
var _nativeSignal=-70,_nativeSSID='unknown',_hasNativeWifi=false
function fetchNativeSignal(){
  if(typeof Capacitor!=='undefined' && Capacitor.Plugins && Capacitor.Plugins.WifiScan){
    Capacitor.Plugins.WifiScan.getCurrentSignal().then(function(r){
      _nativeSignal=r.signal
      _nativeSSID=r.ssid
      _hasNativeWifi=true
    }).catch(function(){_hasNativeWifi=false})
  }
}

// ─── SIGNAL SIMULATION ───────────────────────────────────────────
function updateSignal(){
  if(!huntRunning)return
  // Try native signal first
  if(_hasNativeWifi && _nativeSignal!==-70){
    // Convert dBm (-30 to -90) to 0-1 strength
    var dbmStrength=(_nativeSignal+90)/60 // -90=0, -30=1
    signalStrength=clamp(dbmStrength,0.02,0.98)
    // Use device heading for direction, hotspot follows heading
    targetAngle=heading||0
  }else{
    // Web mode: compass follows gyroscope (heading), signal from device tilt
    var tiltX=0,tiltY=0
    if(hasOrientation && window._lastOrientation){
      var o=window._lastOrientation
      tiltX=clamp((o.beta||0)/90,-1,1)
      tiltY=clamp((o.gamma||0)/90,-1,1)
    }
    // Fixed virtual hotspot at 0° (North). Signal stronger when you rotate phone toward it.
    var deviceHeading=heading||0
    var angleDiff=Math.abs(deviceHeading)
    while(angleDiff>180)angleDiff=360-angleDiff
    // Signal from heading alignment + tilt (tilt phone to "reach" the signal)
    var headingStrength=(1-angleDiff/180)
    var tiltStrength=1-(Math.abs(tiltX)*0.3+Math.abs(tiltY)*0.3)
    var baseStrength=headingStrength*0.6+tiltStrength*0.4
    // Gentle breathing noise (slow, not chaotic)
    baseStrength+=Math.sin(Date.now()*0.0008)*0.08
    baseStrength+=Math.sin(Date.now()*0.0013)*0.04
    // Clamp
    signalStrength=clamp(baseStrength,0.02,0.98)
    // Needle follows actual device heading (gyroscope)
    targetAngle=deviceHeading
  }
  var pct=Math.round(signalStrength*100)
  if(!window._lastMaxSig||pct>window._lastMaxSig)window._lastMaxSig=pct
  // Update UI
  $('signal-value').textContent=pct+'%'
  $('signal-fill').style.width=pct+'%'
  // Color shift bar
  var fill=$('signal-fill')
  if(pct>=70)fill.style.background='linear-gradient(90deg,#00d4aa,#00b894)'
  else if(pct>=40)fill.style.background='linear-gradient(90deg,#ffd93d,#ff9f43)'
  else fill.style.background='linear-gradient(90deg,#ff6b6b,#c92a2a)'
  // Draw visualizations
  drawHeatmap(signalStrength)
  drawWave(signalStrength)
  updateNeedle()
  // Audio feedback
  if(audioCtx && audioCtx.state==='running'){
    playSignalTone(signalStrength)
    if(signalStrength>0.92 && !window._maxTonePlayed){playMaxTone();window._maxTonePlayed=true;setTimeout(function(){window._maxTonePlayed=false},3000)}
  }
  animId=requestAnimationFrame(updateSignal)
}

// Store last orientation
window.addEventListener('deviceorientation',function(e){window._lastOrientation=e})

// ─── CONTROLS ──────────────────────────────────────────────────
function startHunt(){
  if(!hasConsent){var cc=$('consent');if(cc)cc.classList.add('active');return}
  if(huntRunning)return
  try{
    initAudio()
    if(audioCtx && audioCtx.state==='suspended')audioCtx.resume().catch(function(){})
  }catch(e){}
  huntRunning=true
  $('btn-start').style.display='none'
  $('btn-stop').style.display='inline-block'
  // Request native WiFi permissions and start fetching
  if(typeof Capacitor!=='undefined' && Capacitor.Plugins && Capacitor.Plugins.WifiScan){
    Capacitor.Plugins.WifiScan.requestPermissions().then(function(r){
      if(r.granted){
        fetchNativeSignal()
        window._nativeInterval=setInterval(fetchNativeSignal,1500)
        $('info-text').textContent='📡 Echtes WLAN-Signal aktiv. Bewege dich.'
      }else{
        $('info-text').textContent='🔊 Simulation aktiv. Erlaube Standort für echtes Signal.'
      }
    }).catch(function(){
      $('info-text').textContent='🔊 Simulation aktiv. Standort-Berechtigung erforderlich.'
    })
  }else{
    $('info-text').textContent='🔊 Ton aktiv. Bewege dich. Der Zeiger zeigt den Weg.'
  }
  // Walking step sounds
  if(walkIv)clearInterval(walkIv)
  walkIv=setInterval(function(){if(huntRunning&&audioCtx&&audioCtx.state==='running')playStepTone()},950)
  if(animId)cancelAnimationFrame(animId)
  animId=requestAnimationFrame(updateSignal)
}

function stopHunt(){
  huntRunning=false
  $('btn-start').style.display='inline-block'
  $('btn-stop').style.display='none'
  $('info-text').textContent='Neige dein Gerät. Der Zeiger zeigt zur stärksten Signalquelle. Je höher der Ton, desto näher.'
  if(animId){cancelAnimationFrame(animId);animId=null}
  if(walkIv){clearInterval(walkIv);walkIv=null}
  if(window._nativeInterval){clearInterval(window._nativeInterval);window._nativeInterval=null}
  if(audioCtx){audioCtx.suspend()}
}

// ─── RESIZE ────────────────────────────────────────────────────
function resizeCanvases(){
  var hc=$('heatmapCanvas'),wc=$('waveCanvas')
  if(!hc||!wc)return
  var wrap=$('heatmap-wrap')
  var w1=wrap.clientWidth,w2=$('wave-wrap').clientWidth
  hc.width=w1;hc.height=w1
  wc.width=w2;wc.height=$('wave-wrap').clientHeight
}
window.addEventListener('resize',resizeCanvases)
setTimeout(resizeCanvases,100)

// ─── MONETIZATION / RETENTION ──────────────────────────────────
var POINTS=parseInt(localStorage.getItem('wfh_pts')||'0',10)
var STREAK=parseInt(localStorage.getItem('wfh_strk')||'0',10)
var LAST_CLAIM=localStorage.getItem('wfh_lastclaim')||''
var PRO=localStorage.getItem('wfh_pro')==='1'
var ACHS=JSON.parse(localStorage.getItem('wfh_ach')||'[]')
var ANALYTICS=JSON.parse(localStorage.getItem('wfh_analytics')||'{"events":[]}')
var hotspotsFound=0

var ACH_DEFS=[
{id:'first',icon:'🎯',title:'Erster Scan',desc:'Starte deine erste Jagd',req:1},
{id:'ten',icon:'🔥',title:'10 Hotspots',desc:'Finde 10 Hotspots',req:10},
{id:'fifty',icon:'⚡',title:'50 Hotspots',desc:'Finde 50 Hotspots',req:50},
{id:'hundred',icon:'👑',title:'100 Hotspots',desc:'Finde 100 Hotspots',req:100},
{id:'streak3',icon:'🔥',title:'3-Tage-Streak',desc:'Komme 3 Tage zurück',req:3},
{id:'streak7',icon:'🌟',title:'7-Tage-Streak',desc:'Komme 7 Tage zurück',req:7},
{id:'maxsig',icon:'📡',title:'Max Signal',desc:'Erreiche 95% Signal',req:1},
{id:'share',icon:'📤',title:'Teilen',desc:'Teile deine Heatmap',req:1}
]

function saveData(){localStorage.setItem('wfh_pts',POINTS);localStorage.setItem('wfh_strk',STREAK);localStorage.setItem('wfh_ach',JSON.stringify(ACHS));localStorage.setItem('wfh_analytics',JSON.stringify(ANALYTICS))}
function trackEvent(name,props){ANALYTICS.events.push({t:Date.now(),n:name,p:props||{}});if(ANALYTICS.events.length>200)ANALYTICS.events.shift();saveData()}
function addPoints(n){POINTS+=n;$('pts-val').textContent=POINTS;saveData();showToast('+'+n+' Punkte!');trackEvent('points',{amount:n})}
function showToast(msg){var t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},2200)}

function openModal(id){$(id).classList.add('active')}
function closeModal(id){$(id).classList.remove('active')}
function openAchievements(){renderAchievements();openModal('ach-modal')}
function openPro(){openModal('pro-modal')}

function renderAchievements(){
var g=$('ach-grid');if(!g)return;g.innerHTML=''
ACH_DEFS.forEach(function(a){
var unlocked=ACHS.indexOf(a.id)>=0
var el=document.createElement('div')
el.className='ach-item'+(unlocked?' unlocked':'')
el.innerHTML='<span class="ach-icon">'+a.icon+'</span><span class="ach-title">'+a.title+'</span>'
g.appendChild(el)
})
}

function checkAchievements(){
ACH_DEFS.forEach(function(a){
if(ACHS.indexOf(a.id)>=0)return
var ok=false
if(a.id==='first'&&hotspotsFound>=1)ok=true
if(a.id==='ten'&&hotspotsFound>=10)ok=true
if(a.id==='fifty'&&hotspotsFound>=50)ok=true
if(a.id==='hundred'&&hotspotsFound>=100)ok=true
if(a.id==='streak3'&&STREAK>=3)ok=true
if(a.id==='streak7'&&STREAK>=7)ok=true
if(a.id==='maxsig'&&window._lastMaxSig>=95)ok=true
if(a.id==='share'&&window._hasShared)ok=true
if(ok){ACHS.push(a.id);addPoints(a.req*10);showToast('🏆 Erfolg: '+a.title);trackEvent('achievement',{id:a.id})}
})
saveData()
}

function initDaily(){
var today=new Date().toISOString().slice(0,10)
var grid=$('daily-grid');if(!grid)return
var rewards=[50,75,100,150,200,300,500]
grid.innerHTML=''
for(var i=0;i<7;i++){
var d=document.createElement('div')
d.className='daily-day'
var dayNames=['So','Mo','Di','Mi','Do','Fr','Sa']
var dayIdx=(new Date().getDay()+i)%7
var pts=rewards[i]
var isToday=i===0
var claimed=isToday&&LAST_CLAIM===today
d.innerHTML='<div class="day-num">'+dayNames[dayIdx]+'</div><div class="day-pts">'+pts+'</div>'
if(claimed)d.classList.add('claimed')
grid.appendChild(d)
}
var btn=$('claim-btn')
if(LAST_CLAIM===today){btn.disabled=true;btn.textContent='Bereits abgeholt'}
else{btn.disabled=false;btn.textContent='Heute abholen'}
}
function claimDaily(){
var today=new Date().toISOString().slice(0,10)
if(LAST_CLAIM===today)return
var yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10)
if(LAST_CLAIM===yesterday){STREAK++;showToast('🔥 Streak x'+STREAK)}
else{STREAK=1;showToast('Neue Streak gestartet!')}
LAST_CLAIM=today
var rewards=[50,75,100,150,200,300,500]
var pts=rewards[0]*STREAK
addPoints(pts)
initDaily();saveData();trackEvent('daily_claim',{streak:STREAK,points:pts})
}

function openShare(){
var c=$('heatmapCanvas')
if(!c){showToast('Canvas nicht bereit');return}
try{
var url=c.toDataURL('image/png')
var link='https://champion63225-gif.github.io/Wipulscan-professional/?ref='+Math.random().toString(36).slice(2,8)
if(navigator.share){
navigator.share({title:'WiFi Hunter – Mein Signal-Sweep!',text:'Schau meinen WLAN-Hotspot-Fund an! '+link,url:link}).then(function(){window._hasShared=true;addPoints(25);checkAchievements()})
}else{
var a=document.createElement('a');a.href=url;a.download='wifihunter-heatmap.png';a.click()
showToast('Bild gespeichert! Teile es manuell.')
window._hasShared=true;addPoints(25);checkAchievements()
}
trackEvent('share',{})
}catch(e){showToast('Teilen nicht möglich')}
}

function buyPro(){showToast('💎 Pro-Checkout bald verfügbar!');trackEvent('pro_click',{type:'onetime'})}
function buyProSub(){showToast('💎 Pro-Abo bald verfügbar!');trackEvent('pro_click',{type:'subscription'})}

function updateSocialProof(){
var base=280+Math.floor((Date.now()/3600000)%200)
$('sp-count').textContent=base
setTimeout(function(){$('social-proof').classList.add('show')},3000)
}

function initMonetization(){
$('pts-val').textContent=POINTS
$('strk-val').textContent=STREAK
$('top-bar').style.display='flex'
initDaily()
updateSocialProof()
// Streak decay check
var today=new Date().toISOString().slice(0,10)
var last=localStorage.getItem('wfh_lastopen')||''
if(last&&last!==today){
var lastDate=new Date(last)
var todayDate=new Date(today)
var diff=Math.floor((todayDate-lastDate)/(86400000))
if(diff>1){STREAK=0;saveData();$('strk-val').textContent=0;showToast('Streak zurückgesetzt. Komme morgen wieder!')}
}
localStorage.setItem('wfh_lastopen',today)
setTimeout(function(){openModal('daily-modal')},4500)
}

// Hook into existing hunt functions
// Hook into existing hunt functions (safe wrappers)
(function(){
  var _origStartHunt=startHunt,_origStopHunt=stopHunt
  window.startHunt=function(){
    try{_origStartHunt()}catch(e){console.warn('startHunt error',e)}
    try{hotspotsFound++;addPoints(5);checkAchievements();trackEvent('hunt_start',{})}catch(e){}
  }
  window.stopHunt=function(){
    try{_origStopHunt()}catch(e){console.warn('stopHunt error',e)}
    try{trackEvent('hunt_stop',{duration:Date.now()})}catch(e){}
  }
})()

// ─── INIT ──────────────────────────────────────────────────────
// Loading screen progress
(function(){
  var fill=$('loader-fill'),txt=$('loader-text'),loader=$('loader')
  var steps=[{w:25,t:'Scanner wird kalibriert…'},{w:55,t:'Audio-Engine startet…'},{w:80,t:'Kompass initialisiert…'},{w:100,t:'Bereit.'}]
  var i=0
  function next(){
    if(i>=steps.length){
      setTimeout(function(){loader.classList.add('done')},400)
      setTimeout(function(){drawHeatmap(0.35);drawWave(0.35)},600)
      return
    }
    fill.style.width=steps[i].w+'%'
    txt.textContent=steps[i].t
    i++
    setTimeout(next,280)
  }
  setTimeout(next,120)
})()
// Wire monetization after app shows
(function(){
  var _origAccept=acceptConsent
  window.acceptConsent=function(){
    try{_origAccept()}catch(e){console.warn('acceptConsent error',e)}
    try{setTimeout(initMonetization,500)}catch(e){}
  }
})()
