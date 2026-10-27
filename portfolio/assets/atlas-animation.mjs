import {earthLand} from './atlas-earth-data.mjs';
if(document.querySelector('#atlas-animation')){
const canvas=document.querySelector('#atlas-animation'),ctx=canvas.getContext('2d');

let time=matchMedia('(prefers-reduced-motion:reduce)').matches?35:0,last=0;
const TAU=Math.PI*2,RED='#ff102b',colors=['#42fff2','#b6f94f','#588cff','#a58cff','#f4e76e','#6bffc3','#a5faff',RED];
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},mix=(a,b,t)=>a+(b-a)*t;
const norm=v=>{let n=Math.hypot(...v);return v.map(x=>x/n)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const u=norm([.66,-.56,.72]),a=norm(cross(u,[0,1,0])),b=cross(u,a);
function point(i,theta){const angle=i*Math.PI/8,v=a.map((x,j)=>x*Math.cos(angle)+b[j]*Math.sin(angle));return u.map((x,j)=>1.35*(x*Math.cos(theta)+v[j]*Math.sin(theta)))}
function project(p,cx,cy,r){return[cx+p[0]*r,cy+p[1]*r,p[2]]}
function dot(x,y,size,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor=color;ctx.shadowBlur=size*5;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();ctx.restore()}
function stroke(points,color,width,alpha=1,glow=0){if(points.length<2)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();if(width>=3){ctx.shadowBlur=0;ctx.globalAlpha=alpha*.6;ctx.strokeStyle="#edffff";ctx.lineWidth=width*.2;ctx.stroke()}ctx.restore()}


const stars=Array.from({length:300},(_,i)=>({x:((i*263.718)%997)/997,y:((i*157.291)%991)/991,size:i%17===0?1.3:.35+(i%4)*.18,opacity:.15+(i%7)*.09}));
function starfield(w,h,cx,cy,r){ctx.save();for(const star of stars){ctx.globalAlpha=star.opacity;ctx.fillStyle='#b8ddeb';ctx.beginPath();ctx.arc(star.x*w,star.y*h,star.size,0,TAU);ctx.fill()}ctx.globalAlpha=1;
 const halo=ctx.createRadialGradient(cx,cy,r*.93,cx,cy,r*1.28);halo.addColorStop(0,'#148dc800');halo.addColorStop(.25,'#2b8ec62c');halo.addColorStop(1,'#3e78ff00');ctx.fillStyle=halo;ctx.fillRect(cx-r*1.3,cy-r*1.3,r*2.6,r*2.6);
 ctx.strokeStyle='#5aa8c94d';ctx.lineWidth=.6;ctx.setLineDash([2,10]);ctx.beginPath();ctx.arc(cx,cy,r*1.61,0,TAU);ctx.stroke();ctx.setLineDash([]);
 for(let i=0;i<48;i++){const angle=i/48*TAU,len=i%4===0?7:3;stroke([[cx+Math.cos(angle)*r*1.64,cy+Math.sin(angle)*r*1.64],[cx+Math.cos(angle)*(r*1.64+len),cy+Math.sin(angle)*(r*1.64+len)]],'#71b8d0',.6,i%4===0?.5:.22)}ctx.restore()}

function impactRays(cx,cy,r){const impact=collisionState(time);if(!impact.collided||impact.age>1)return;const age=impact.age,p=project(point(0,0),cx,cy,r),extent=r*(.2+age*3);ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<12;i++){const angle=i/12*TAU+.13;stroke([[p[0]+Math.cos(angle)*extent*.15,p[1]+Math.sin(angle)*extent*.15],[p[0]+Math.cos(angle)*extent,p[1]+Math.sin(angle)*extent]],i%2?'#ff625e':'#fff4df',i%2?1:2,(1-age)*.8,14)}ctx.restore()}
function convergence(cx,cy,r){const state=collisionState(time),p=project(point(0,0),cx,cy,r);if(time<14.7||time>=19)return;ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(time*.3);ctx.strokeStyle='#c8f9ff';ctx.globalAlpha=.35+state.gathered*.045;ctx.lineWidth=.7;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,9+i*5,time+i,time+i+Math.PI*1.3);ctx.stroke()}ctx.restore()}
function sphere(lon,lat){const p=lat*Math.PI/180,q=(lon+30-time*2.3)*Math.PI/180;return [Math.cos(p)*Math.sin(q),-Math.sin(p),Math.cos(p)*Math.cos(q)]}
const netNodes=Array.from({length:160},(_,i)=>{const z=1-2*(i+.5)/160;return [i*137.507764%360-180,Math.asin(z)*180/Math.PI]});
function globe(cx,cy,r,reveal,network){ctx.save();const g=ctx.createRadialGradient(cx-r*.4,cy-r*.5,0,cx,cy,r);g.addColorStop(0,'#18506a');g.addColorStop(.55,'#0a263c');g.addColorStop(1,'#020610');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill();ctx.clip();
 for(let lat=-60;lat<=60;lat+=30){const pts=[];for(let lon=-180;lon<=180;lon+=3){const v=sphere(lon,lat);if(v[2]>0)pts.push(project(v,cx,cy,r));else{stroke(pts,'#78b9d1',.5,.19);pts.length=0}}stroke(pts,'#78b9d1',.5,.19)}
 for(let lon=-180;lon<180;lon+=30){const pts=[];for(let lat=-90;lat<=90;lat+=3){const v=sphere(lon,lat);if(v[2]>0)pts.push(project(v,cx,cy,r));else{stroke(pts,'#78b9d1',.5,.19);pts.length=0}}stroke(pts,'#78b9d1',.5,.19)}
 if(reveal>0){ctx.globalAlpha=reveal;earthLand.forEach(ring=>{const raw=ring.map(([lon,lat])=>sphere(lon,lat)),vertices=[];for(let k=0;k<raw.length;k++){const v=raw[k],previous=raw[(k+raw.length-1)%raw.length];if((v[2]>=0)!==(previous[2]>=0)){const f=previous[2]/(previous[2]-v[2]);vertices.push(norm(previous.map((x,j)=>mix(x,v[j],f))))}if(v[2]>=0)vertices.push(v)}if(vertices.length<3)return;ctx.beginPath();vertices.forEach((v,i)=>{const p=project(v,cx,cy,r);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])});ctx.closePath();const landFill=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);landFill.addColorStop(0,'#77cbb7');landFill.addColorStop(.5,'#297b82');landFill.addColorStop(1,'#153c54');ctx.fillStyle=landFill;ctx.fill();ctx.strokeStyle='#8ae8ce';ctx.lineWidth=.7;ctx.stroke()})}
 if(network>0){const points=netNodes.map(([lon,lat])=>sphere(lon,lat));ctx.globalAlpha=network;for(let i=0;i<points.length;i++){const a=points[i];if(a[2]<.03)continue;for(let j=i+1;j<points.length;j++){const b=points[j];if(b[2]<.03||Math.hypot(...a.map((v,k)=>v-b[k]))>.63)continue;const curve=[];for(let t=0;t<=1.001;t+=.1){const v=norm(a.map((v,k)=>mix(v,b[k],t))).map(v=>v*1.012);curve.push(project(v,cx,cy,r))}stroke(curve,RED,.75,network*.65,4);if((i+j)%13===0){const progress=((time-25)*.14+i*.03)%1,signal=project(norm(a.map((v,k)=>mix(v,b[k],progress))).map(v=>v*1.015),cx,cy,r);dot(signal[0],signal[1],1.6,"#ffc3bc",network*.7)}}const p=project(a,cx,cy,r);dot(p[0],p[1],1.3+(Math.sin(time*1.3+i)*.3),RED,network)}}const night=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r*.4);night.addColorStop(0,'#00000000');night.addColorStop(.55,'#00000000');night.addColorStop(1,'#010313b3');ctx.fillStyle=night;ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.restore();stroke(Array.from({length:101},(_,i)=>[cx+r*Math.cos(i/100*TAU),cy+r*Math.sin(i/100*TAU)]),'#78f9dd',1.4,.8,13)}
function satellites(cx,cy,r,front){if(time<23)return;for(let n=0;n<6;n++){const theta=(time-23)*TAU/(100+n*7)+n*TAU/6,p=project(point(n,theta).map(v=>v*(1.08+(n%3)*.035)),cx,cy,r);if((p[2]>=0)!==front)continue;ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(-.24);const z=Math.max(.28,r/310);ctx.scale(z,z);ctx.globalAlpha=front?1:.4;ctx.shadowColor='#79dfff';ctx.shadowBlur=9;ctx.fillStyle='#2a7bbf';ctx.strokeStyle='#8adfff';ctx.lineWidth=.8;for(const x of [-18,6]){ctx.fillRect(x,-6,12,12);ctx.strokeRect(x,-6,12,12);ctx.beginPath();ctx.moveTo(x+6,-6);ctx.lineTo(x+6,6);ctx.moveTo(x,0);ctx.lineTo(x+12,0);ctx.stroke()}ctx.fillStyle='#e2f6ff';ctx.fillRect(-5,-5,10,10);ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(0,-11);ctx.stroke();dot(0,-12,1.8,n?RED:'#afffff');ctx.restore()}}
// One continuous passage from each distinct source to the shared crossing.
// A signal disappears on arrival; its neon trail remains until the red signal triggers the burst.
const flights=colors.map((_,i)=>{const start=i*.6,arrival=i===7?19:14.7+i*.3,oldPeriod=i===7?5.8:5,origin=TAU*2-(arrival-start)*TAU/oldPeriod,lapEnd=arrival-.55,period=lapEnd-start;return {start,arrival,period,origin,lapEnd}});
function collisionState(t){const heads=flights.map(f=>({arrived:t>=f.arrival,arrival:f.arrival}));const collided=heads.every(h=>h.arrived);return {collided,age:collided?t-Math.max(...heads.map(h=>h.arrival)):0,gathered:heads.slice(0,7).filter(h=>h.arrived).length}}

function orbit(i,cx,cy,r,front){const f=flights[i];if(time<f.start||time>=19)return;const traveled=Math.min((time-f.start)*TAU/f.period,TAU),theta=f.origin+traveled,color=colors[i];let segment=[];
 const trailLength=Math.min(traveled,TAU);for(let j=0;j<=300;j++){const angle=f.origin+j/300*trailLength,v=project(point(i,angle),cx,cy,r);if((v[2]>=0)===front)segment.push(v);else{stroke(segment,color,i===7?6.2:3.2,front?1:.48,i===7?46:26);segment=[]}}
 stroke(segment,color,i===7?5.4:2.9,front?1:.48,i===7?32:20);
 // The moving head travels once to the crossing, without further laps or waiting.
 const source=point(i,theta),jointPosition=point(i,0),merge=smooth((time-f.lapEnd)/.55),head=project(source.map((v,k)=>mix(v,jointPosition[k],merge)),cx,cy,r);if((head[2]>=0)===front){dot(head[0],head[1],i===7?7.4:4.2,color);dot(head[0],head[1],i===7?2.3:1.3,'#ffffff',.85)}
 const origin=project(point(i,f.origin),cx,cy,r);if((origin[2]>=0)===front)dot(origin[0],origin[1],2.5,color,.65);
 const arrivalPulse=Math.exp(-(((time-f.arrival)/.15)**2));if(front&&arrivalPulse>.01){const joint=project(point(i,0),cx,cy,r);dot(joint[0],joint[1],5,color,arrivalPulse)}
}
function word(cx,cy,r){if(time<30)return;const size=r*.49,spacing=size*.79,width=spacing*4+size*.78,x=cx-width/2,y=cy+size*.36,fade=1-smooth((time-40)/2),wholeFlash=Math.exp(-(((time-36.2)/.2)**2));ctx.save();ctx.globalAlpha=fade;ctx.font='900 '+size+'px "Arial Black", "Segoe UI", sans-serif';ctx.textAlign='left';ctx.textBaseline='alphabetic';
 [...'ATLAS'].forEach((letter,i)=>{const age=time-30-i*.85;if(age<0)return;const flash=Math.exp(-((age/.18)**2));ctx.shadowColor=RED;ctx.shadowBlur=18+35*flash+25*wholeFlash;ctx.fillStyle=RED;ctx.fillText(letter,x+i*spacing,y);ctx.strokeStyle='#ff6a72';ctx.lineWidth=.7+flash;ctx.strokeText(letter,x+i*spacing,y);if(flash>.1||wholeFlash>.1){ctx.globalAlpha=fade*Math.max(flash,wholeFlash)*.7;ctx.fillStyle='#fff4f3';ctx.fillText(letter,x+i*spacing,y);ctx.globalAlpha=fade}});ctx.restore()}
function draw(){const dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const backdrop=ctx.createLinearGradient(0,0,w,h);backdrop.addColorStop(0,'#030711');backdrop.addColorStop(.5,'#071622');backdrop.addColorStop(1,'#090b1b');ctx.fillStyle=backdrop;ctx.fillRect(0,0,w,h);const cx=w/2,cy=h*.47,r=Math.min(w*.235,h*.305);const fadeEarth=time<20.1?1:smooth((time-22)/6);const reveal=smooth((time-23)/5),network=smooth((time-25)/4)*(1-smooth((time-37)/3)*.3);
 const ambient=ctx.createRadialGradient(cx,cy,0,cx,cy,r*2.3);ambient.addColorStop(0,'#0f60795c');ambient.addColorStop(.5,'#20174c25');ambient.addColorStop(1,'#070e1900');ctx.fillStyle=ambient;ctx.fillRect(0,0,w,h);
 starfield(w,h,cx,cy,r);
 ctx.save();ctx.globalAlpha=fadeEarth;for(let i=0;i<8;i++)orbit(i,cx,cy,r,false);satellites(cx,cy,r,false);globe(cx,cy,r,reveal,network);satellites(cx,cy,r,true);for(let i=0;i<8;i++)orbit(i,cx,cy,r,true);ctx.restore();
 const joint=project(point(0,0),cx,cy,r);


 // The burst uses exactly the same projected crossing as every arrival pulse.

 const impact=collisionState(time);if(impact.collided&&impact.age<9){const age=impact.age,fade=1-smooth((age-1.1)/7.9),radius=mix(5,Math.hypot(w,h),smooth(age/1.1));ctx.save();ctx.globalAlpha=fade;const blast=ctx.createRadialGradient(joint[0],joint[1],0,joint[0],joint[1],Math.max(6,radius));blast.addColorStop(0,'#ffffff');blast.addColorStop(.35,'#ffffff');blast.addColorStop(.68,'#fff3f4');blast.addColorStop(1,'#ff193000');ctx.fillStyle=blast;ctx.beginPath();ctx.arc(joint[0],joint[1],radius,0,TAU);ctx.fill();ctx.restore();if(age>=.8){ctx.save();ctx.globalAlpha=smooth((age-.8)/.3)*fade;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.restore()}}

 impactRays(cx,cy,r);convergence(cx,cy,r);word(cx,cy,r);ctx.fillStyle='#8eb2bf';ctx.font=`${Math.max(9,w*.012)}px system-ui`;ctx.textAlign='center';
}

function frame(now){const stopped=document.hidden||document.querySelector('#home')?.hidden||document.body.dataset.motion==='paused'||matchMedia('(prefers-reduced-motion:reduce)').matches;if(last&&!stopped)time=(time+Math.min((now-last)/1000,.1))%42;last=now;draw();requestAnimationFrame(frame)}
requestAnimationFrame(frame);

}
