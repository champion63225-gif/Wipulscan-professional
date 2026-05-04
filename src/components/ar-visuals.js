// ─── AR / VISUALIZATION ENGINE ─────────────────────────────
// Heatmap, directional arrow, softness field computation
// Cobra Dynamics 2026

function computeSoftnessField(){
  if(!GEO.current||GEO.trail.length<4) return null;
  var cur=latLngToXY(GEO.origin.lat,GEO.origin.lng,GEO.current.lat,GEO.current.lng);
  var N=8, secs=[];
  for(var i=0;i<N;i++) secs.push({sum:0,sum2:0,cnt:0,avg:0,stability:0,softness:0});
  GEO.trail.forEach(function(p){
    var dx=p.dx-cur.dx, dy=p.dy-cur.dy;
    if(Math.sqrt(dx*dx+dy*dy)<4) return;
    var ang=(Math.atan2(dy,dx)+Math.PI/2+Math.PI*2)%(Math.PI*2);
    var si=Math.floor(ang/(Math.PI*2/N))%N;
    secs[si].sum+=p.sig; secs[si].sum2+=p.sig*p.sig; secs[si].cnt++;
  });
  secs.forEach(function(s){
    if(s.cnt<2){return;}
    s.avg=s.sum/s.cnt;
    var variance=(s.sum2/s.cnt)-(s.avg*s.avg);
    s.stability=1/(1+variance/300);
    s.softness=s.avg*s.stability;
  });
  return secs;
}
function currentSoftness(){
  if(GEO.trail.length<4) return null;
  var pts=GEO.trail.slice(-8), n=pts.length;
  var avg=pts.reduce(function(a,p){return a+p.sig;},0)/n;
  var v=pts.reduce(function(a,p){return a+(p.sig-avg)*(p.sig-avg);},0)/n;
  var stab=1/(1+v/300);
  return {avg:avg,stability:stab,score:avg*stab};
}
function softnessCol(score,alpha){
  var t=Math.min(1,score/75), r,g,b;
  if(t<0.45){var u=t/0.45; r=Math.round(70*(1-u)); g=Math.round(10+60*u); b=Math.round(110+90*u);}
  else{var u=(t-0.45)/0.55; r=Math.round(212*u); g=Math.round(70+105*u); b=Math.round(200*(1-u)+55*u);}
  return 'rgba('+r+','+g+','+b+','+(alpha||0.42)+')';
}
function signalTrend(){
  if(GEO.trail.length<6) return 0;
  var n=Math.min(10,GEO.trail.length), pts=GEO.trail.slice(-n), h=Math.floor(n/2);
  var a1=pts.slice(0,h).reduce(function(s,p){return s+p.sig;},0)/h;
  var a2=pts.slice(h).reduce(function(s,p){return s+p.sig;},0)/(n-h);
  return a2-a1;
}

function drawHeatmap(){
  if(!GEO.current||GEO.trail.length<2)return;
  var cur=latLngToXY(GEO.origin.lat,GEO.origin.lng,GEO.current.lat,GEO.current.lng);
  var scl=24,now=Date.now();
  ctx.save();
  GEO.trail.forEach(function(p){
    var px=W*0.5+(p.dx-cur.dx)*scl,py=H*0.5+(p.dy-cur.dy)*scl;
    var age=(now-p.ts)/60000;
    var alpha=Math.max(0.18,0.72-age*0.35);
    var radius=65+110*(p.sig/100);
    var grd=ctx.createRadialGradient(px,py,0,px,py,radius);
    var col=sigColRGB(p.sig);
    grd.addColorStop(0,'rgba('+col+','+(alpha*0.55)+')');
    grd.addColorStop(0.35,'rgba('+col+','+(alpha*0.28)+')');
    grd.addColorStop(1,'rgba('+col+',0)');
    ctx.fillStyle=grd;
    ctx.beginPath();ctx.arc(px,py,radius,0,Math.PI*2);ctx.fill();
    if(p.sig>60){
      var coreR=radius*0.28;
      var cgrd=ctx.createRadialGradient(px,py,0,px,py,coreR);
      cgrd.addColorStop(0,'rgba('+col+','+(alpha*0.38)+')');
      cgrd.addColorStop(1,'rgba('+col+',0)');
      ctx.fillStyle=cgrd;
      ctx.beginPath();ctx.arc(px,py,coreR,0,Math.PI*2);ctx.fill();
    }
  });
  for(var i=0;i<GEO.trail.length-1;i++){
    var p1=GEO.trail[i],p2=GEO.trail[i+1];
    var ddx=p2.dx-p1.dx,ddy=p2.dy-p1.dy,dist=Math.sqrt(ddx*ddx+ddy*ddy);
    if(dist>8)continue;
    var steps=Math.floor(dist*scl/14)+2;
    for(var s=1;s<steps;s++){
      var t=s/steps,ix=p1.dx+ddx*t,iy=p1.dy+ddy*t,isig=p1.sig+(p2.sig-p1.sig)*t;
      var ipx=W*0.5+(ix-cur.dx)*scl,ipy=H*0.5+(iy-cur.dy)*scl;
      var ir=48+85*(isig/100);
      var iAlpha=Math.max(0.10,0.35-Math.abs(t-0.5)*0.3);
      var igrd=ctx.createRadialGradient(ipx,ipy,0,ipx,ipy,ir);
      var ic=sigColRGB(isig);
      igrd.addColorStop(0,'rgba('+ic+','+iAlpha+')');
      igrd.addColorStop(1,'rgba('+ic+',0)');
      ctx.fillStyle=igrd;
      ctx.beginPath();ctx.arc(ipx,ipy,ir,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}

function drawARDirection(){
  var secs=_softnessCache||computeSoftnessField();
  var bestIdx=-1,bestScore=0;
  var hasGps=!!secs;
  if(hasGps){
    secs.forEach(function(s,i){if(s.softness>bestScore){bestScore=s.softness;bestIdx=i;}});
  }
  if(bestIdx<0||bestScore<15){
    var tr=signalTrend();
    if(Math.abs(tr)<2) return;
    bestIdx=0; bestScore=50;
  }
  var ang=-Math.PI/2+(bestIdx+0.5)/8*Math.PI*2;
  var cx=W*0.5,cy=H*0.55;
  var len=Math.min(W,H)*0.36;
  var pulse=0.78+0.22*Math.sin(Date.now()*0.0035);
  var aLen=len*pulse;
  ctx.save();
  var ringR=22+8*Math.sin(Date.now()*0.005);
  ctx.beginPath();ctx.arc(cx,cy,ringR,0,Math.PI*2);
  ctx.strokeStyle='rgba(212,175,55,0.50)';ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,ringR-8,0,Math.PI*2);
  ctx.strokeStyle='rgba(212,175,55,0.25)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.strokeStyle='rgba(212,175,55,0.25)';ctx.lineWidth=18;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ang)*aLen,cy+Math.sin(ang)*aLen);ctx.stroke();
  var grd=ctx.createLinearGradient(cx,cy,cx+Math.cos(ang)*aLen,cy+Math.sin(ang)*aLen);
  grd.addColorStop(0,'rgba(212,175,55,0.15)');
  grd.addColorStop(0.35,'rgba(212,175,55,0.75)');
  grd.addColorStop(1,'rgba(255,235,140,0.98)');
  ctx.strokeStyle=grd;ctx.lineWidth=10;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ang)*aLen,cy+Math.sin(ang)*aLen);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.70)';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ang)*aLen,cy+Math.sin(ang)*aLen);ctx.stroke();
  var ax=cx+Math.cos(ang)*aLen,ay=cy+Math.sin(ang)*aLen;
  var head=28;
  ctx.fillStyle='rgba(255,235,140,0.98)';
  ctx.shadowColor='rgba(212,175,55,0.85)';ctx.shadowBlur=24;
  ctx.beginPath();
  ctx.moveTo(ax,ay);
  ctx.lineTo(ax+Math.cos(ang-2.6)*head,ay+Math.sin(ang-2.6)*head);
  ctx.lineTo(ax+Math.cos(ang+2.6)*head,ay+Math.sin(ang+2.6)*head);
  ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;
  ctx.font='700 18px "Space Grotesk",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(255,255,255,0.98)';
  ctx.shadowColor='rgba(0,0,0,0.8)';ctx.shadowBlur=12;
  var dirTxt=['N','NO','O','SO','S','SW','W','NW'][bestIdx];
  ctx.fillText(dirTxt,cx+Math.cos(ang)*(aLen+46),cy+Math.sin(ang)*(aLen+46));
  ctx.shadowBlur=0;
  ctx.font='700 14px "Space Mono",monospace';
  ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillStyle='rgba(212,175,55,0.90)';
  ctx.fillText('▼ Signal verfolgen',cx,cy+50);
  var tr=signalTrend();
  if(Math.abs(tr)>2){
    ctx.font='700 18px "Space Mono",monospace';
    ctx.textAlign='center';ctx.textBaseline='top';
    var tCol=tr>0?'rgba(0,255,136,0.95)':'rgba(255,72,50,0.90)';
    ctx.fillStyle=tCol;
    ctx.shadowColor='rgba(0,0,0,0.6)';ctx.shadowBlur=8;
    ctx.fillText(tr>0?'▲ '+Math.round(Math.abs(tr))+'%':'▼ '+Math.round(Math.abs(tr))+'%',cx,cy+aLen*0.30+28);
    ctx.shadowBlur=0;
  }
  ctx.restore();
}
