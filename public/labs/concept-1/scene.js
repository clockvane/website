// Concept 1 — "The Movement". A raymarched precision mechanism the camera flies through.
// One world: rings of gears on a filament of light, with the vane at the centre. Each service
// transforms the same mechanism. Signed-distance fields + a single light; no meshes, no textures.
import { run, compile, makePost, bump, FULLSCREEN_VS } from '../shared/lab.js';

const FS = `
uniform vec2 uRes; uniform float uT, uZ, uSteps, uOff, uOffY, uVaneA; uniform vec2 uM;
uniform vec3 uA, uB, uAcc; out vec4 o;
#define PI 3.14159265
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float h1(float n){return fract(sin(n*127.1+.3)*43758.5453);}
float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
const float SP=2.4;
float gAx, gMat;
float gear(vec3 p,float R,float w,float th,float N,float tooth,float sq){
  float r=length(p.xy),a=atan(p.y,p.x);
  float t=tooth*smoothstep(-sq,sq,cos(a*N));
  float band=max(r-(R+w+t),(R-w)-r);
  float sa=2.*PI/5.,a2=mod(a+sa*.5,sa)-sa*.5; vec2 q=r*vec2(cos(a2),sin(a2));
  float spoke=max(max(abs(q.y)-w*.4,q.x-R),.2-q.x);
  float hub=abs(r-.2)-.035;
  return max(min(min(band,spoke),hub),abs(p.z)-th);
}
float map(vec3 p){
  float lock=uA.x,vane=uA.y,lean=uA.z,scale=uB.x,dial=uB.y,besp=uB.z;
  vec3 q=p; float sp=mix(90.,6.5,scale);
  vec2 cell=round(q.xy/sp); q.xy-=cell*sp; float cid=dot(cell,vec2(3.1,7.7));
  float id=round(q.z/SP); vec3 g=q; g.z-=id*SP;
  float hh=h1(id+cid),h2=h1(id*1.7+5.+cid),loose=1.-lock,odd=mod(abs(id),2.);
  g.xy-=loose*vec2(hh-.5,h2-.5)*1.8;
  g.yz*=rot(loose*(hh-.5)*1.5); g.xz*=rot(loose*(h2-.5)*1.2);
  float R=mix(1.45+1.35*hh,.75+mod(abs(id),6.)*.4,dial);
  float N=mix(floor(16.+hh*26.),9.,besp);
  float ang=mix(uT*(hh-.5)*1.6,uT*(odd*2.-1.)*5./N,lock)+cid;
  g.xy*=rot(ang);
  float cut=lean*odd;
  float w=mix(.085,.045,lean)*(1.-cut*.9)*(1.-dial*.5);
  float th=(mix(.07,.03,lean)*(1.-cut)+.004)*(1.-dial*.7);
  float d=gear(g,R,w,th,N,mix(.13,.24,besp),mix(.35,.05,besp))+cut*.8;
  gAx=length(q.xy)-.035; d=min(d,gAx); gMat=1.;
  vec3 v=p-vec3(0,0,uZ-4.6); v.xy*=rot(-uVaneA); v.xz*=rot(.25*sin(uT*.7));
  float sz=.75+vane*.85;
  float blade=sdBox(v-vec3(sz*.3,0,0),vec3(sz*.95,.016,.012));
  vec3 hd=v-vec3(sz*1.22,0,0); hd.x=-hd.x;
  vec3 ha=hd; ha.xy*=rot(.55); vec3 hb=hd; hb.xy*=rot(-.55);
  float head=min(sdBox(ha-vec3(.11*sz,0,0),vec3(.13*sz,.012,.012)),sdBox(hb-vec3(.11*sz,0,0),vec3(.13*sz,.012,.012)));
  float fin=sdBox(v+vec3(sz*.5,0,0),vec3(.2*sz,.15*sz,.006));
  float ring=length(vec2(length(v.xy)-.12,v.z))-.014;
  float dv=min(min(blade,head),min(fin,ring));
  if(dv<d){d=dv;gMat=2.;}
  return d;
}
vec3 nrm(vec3 p){vec2 e=vec2(.0015,-.0015);return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y; uv.x-=uOff; uv.y-=uOffY;
  vec3 ro=vec3(1.05+uM.x*.45,.55+uM.y*.3,uZ), ta=vec3(-.25,-.1,uZ-6.);
  vec3 cw=normalize(ta-ro),cu=normalize(cross(cw,vec3(sin(uZ*.05),cos(uZ*.05),0))),cv=cross(cu,cw);
  vec3 rd=normalize(uv.x*cu+uv.y*cv+1.5*cw);
  float t=.1,glow=0.,m=0.; bool hit=false;
  for(int i=0;i<128;i++){
    if(float(i)>=uSteps)break;
    vec3 p=ro+rd*t; float d=map(p);
    float pulse=.55+.45*sin(p.z*1.3+uT*5.);
    glow+=pulse*min(d,.3)*.0025/(gAx*gAx+.0004);
    if(d<.0012*t){hit=true;m=gMat;break;}
    t+=d*.72; if(t>42.)break;
  }
  vec3 bg=vec3(.006,.008,.012)+uAcc*.035*exp(-dot(uv,uv)*2.2);
  vec3 col=bg;
  if(hit){
    vec3 p=ro+rd*t,n=nrm(p),lp=vec3(0,0,uZ-4.6),l=lp-p; float ld=length(l); l/=ld;
    float att=1./(1.+ld*ld*.07);
    float dif=max(dot(n,l),0.),sp=pow(max(dot(reflect(rd,n),l),0.),48.);
    vec3 k=normalize(vec3(-.6,.8,.4)); float sk=pow(max(dot(reflect(rd,n),k),0.),24.);
    float fr=pow(1.+dot(rd,n),4.);
    if(m<1.5) col=vec3(.5,.52,.56)*dif*att*.6+uAcc*sp*att*2.2+vec3(1.,.95,.88)*sk*.35+fr*uAcc*.18+.012;
    else col=uAcc*(.55+uA.y*.9)+vec3(1.)*sp*1.5+fr*.4;
    col=mix(col,bg,1.-exp(-t*.075));
  }
  col+=uAcc*glow*(1.+uA.y*.8);
  col=col/(1.+col*.6);
  o=vec4(pow(col,vec3(.4545)),1.);
}`;

const accent = [0.36, 0.88, 1.0]; // #5CE1FF ion

run({
  init(gl, T) {
    const prog = compile(gl, FULLSCREEN_VS, FS),
      post = makePost(gl),
      vao = gl.createVertexArray();
    let steps = T.steps,
      w = 1,
      h = 1,
      vane = 0.4;
    return {
      setTier(nT) {
        steps = nT.steps;
      },
      resize(nw, nh) {
        w = nw;
        h = nh;
        post.resize(w, h);
      },
      frame(st) {
        const s = st.p;
        // Cumulative lock (process automation), then one transformation per service chapter.
        const lock = Math.min(1, Math.max(0, (s - 0.35) / 0.6));
        const A = [lock, bump(s, 2), bump(s, 3)],
          B = [bump(s, 4), bump(s, 5), bump(s, 6)];
        const target = Math.atan2(
          st.my + 0.15,
          st.mx + (Math.abs(st.mx) < 0.02 ? 0.6 : 0),
        );
        let dv = target - vane;
        dv = Math.atan2(Math.sin(dv), Math.cos(dv));
        vane += dv * 0.06;
        post.begin();
        gl.useProgram(prog.p);
        gl.bindVertexArray(vao);
        const u = prog.u;
        gl.uniform2f(u.uRes, w, h);
        gl.uniform1f(u.uT, st.t);
        gl.uniform1f(u.uZ, 6 - s * 7.2 - st.t * 0.12);
        gl.uniform1f(u.uSteps, steps);
        gl.uniform1f(u.uOff, w / h > 1.2 ? 0.42 : 0);
        gl.uniform1f(u.uOffY, w / h < 0.8 ? 0.28 : 0);
        gl.uniform1f(u.uVaneA, vane);
        gl.uniform2f(u.uM, st.mx, st.my);
        gl.uniform3fv(u.uA, A);
        gl.uniform3fv(u.uB, B);
        gl.uniform3fv(u.uAcc, accent);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        post.end(st.t, 0.004 + Math.min(0.05, Math.abs(st.vel) * 0.03), 0.8);
      },
    };
  },
  // Optional sound: a soft escapement tick locked to the mechanism, plus a low hum. Off by default.
  voice(ctx, out) {
    const hum = ctx.createOscillator(),
      hg = ctx.createGain();
    hum.frequency.value = 55;
    hg.gain.value = 0.05;
    hum.connect(hg).connect(out);
    hum.start();
    let next = 0;
    return (st) => {
      const now = ctx.currentTime;
      if (now < next) return;
      next = now + 0.5 - Math.min(0.3, Math.abs(st.vel) * 0.2);
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 1800 + Math.random() * 200;
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      o.connect(g).connect(out);
      o.start(now);
      o.stop(now + 0.05);
    };
  },
});
