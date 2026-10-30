// Concept 2 — "The Vane Field". One body of GPU particles: wind made of light.
// Every particle computes its own target for each chapter in the vertex shader, so the same
// particles re-form for each service (no CPU work per frame, no buffers to upload). Morphs are
// staggered per particle, with turbulence during the hand-over, like wind changing direction.
import { run, compile, makePost } from '../shared/lab.js';

const VS = `
uniform float uT, uS, uAsp, uOff, uOffY, uVaneA, uSize, uN; uniform vec2 uM;
out vec3 vC; out float vA;
#define PI 3.14159265
float h(float n){return fract(sin(n)*43758.5453123);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 vane(float u,float v,float w,float z){
  vec3 p;
  if(u<.13) p=vec3(mix(-2.1,2.2,v),(w-.5)*.06,(z-.5)*.06);
  else if(u<.21){float x=mix(2.2,3.,v);p=vec3(x,(w-.5)*(3.-x)*1.1,(z-.5)*.05);}
  else if(u<.3) p=vec3(-2.1+v*.85,(w-.5)*(1.5-v*.6),(z-.5)*.04);
  else{float r=.18+v*.05,a=w*2.*PI;p=vec3(cos(a)*r,sin(a)*r,(z-.5)*.05);}
  p.xy*=rot(uVaneA); p.xz*=rot(.35*sin(uT*.4));
  return p;
}
vec3 F(int k,float u,float v,float w,float z){
  float T=uT;
  if(k==0||k==7){
    if(u<.34) return vane(u,v,w,z)*(k==7?1.1:1.55);
    float x=fract(v+T*.035*(.6+w))*16.-8.;
    float y=(w-.5)*9.+sin(x*.5+w*31.+T*.6)*.45;
    vec2 d=vec2(x,y); float r=length(d); d*=1.+.9/(r*r+.6); // wind parts around the vane
    return vec3(d,(z-.5)*7.);
  }
  if(k==1){ // business process automation: scattered motes fall into lanes, all moving together
    float lane=floor(w*7.); float x=fract(v+T*.06)*16.-8.;
    return vec3(x,(lane-3.)*.62+(z-.5)*.03,(u-.5)*.25);
  }
  if(k==2){ // AI automation: the stream is read; the unclear few lift out to a holding orbit (a person checks)
    float x=fract(v+T*.05)*16.-8.;
    if(z<.08){float a=x*.6+T;float lift=smoothstep(-1.,1.5,x);return vec3(mix(x,1.6+cos(a)*.8,lift),mix((w-.5)*1.4,2.6+sin(a)*.35,lift),(u-.5)*.4);}
    return vec3(x,(w-.5)*mix(3.2,.35,smoothstep(-3.,0.,x)),(u-.5)*mix(2.,.3,smoothstep(-3.,0.,x)));
  }
  if(k==3){ // AI cost optimization: the same flow, in far less volume — one fine ring
    float a=v*2.*PI+T*.25; vec3 p=vec3(cos(a),sin(a),0.)*(2.7+(w-.5)*.05); p.z=(z-.5)*.05;
    p.yz*=rot(1.1); p.xy*=rot(.4); return p;
  }
  if(k==4){ // cloud and DevOps: identical stacks in tiers; a release wave rises through them
    vec3 g=floor(vec3(u*9.,w*4.,v*9.));
    vec3 p=(g-vec3(4.,1.5,4.))*vec3(.62,.9,.62);
    p.y+=.22*smoothstep(.6,1.,sin(T*1.6-g.x*.5-g.z*.3));
    p+=(vec3(h(u*91.),h(v*37.),h(w*53.))-.5)*.07;
    p.xz*=rot(.6+T*.05); p.yz*=rot(.32); return p;
  }
  if(k==5){ // websites and apps: the wind settles into one clear, flat page
    float x=(floor(u*160.)/160.-.5)*6.4,y=(floor(v*100.)/100.-.5)*4.;
    if(w<.12){float e=z*4.;y=e<1.?-2.:e<2.?2.:y;x=e<2.?x:e<3.?-3.2:3.2;}
    return vec3(x,y,.1*sin(x*1.2-T*1.3)*(1.-smoothstep(1.5,2.,abs(y))));
  }
  // custom software: one strand wound to fit, two parts that interlock
  float t=v*14.-7.,s=step(.5,w),a=t*1.25+T*.7+s*PI;
  vec3 p=vec3(t*.62,cos(a)*1.15,sin(a)*1.15);
  if(z<.16){float a2=floor(t*2.)/2.*1.25+T*.7;float m=u;p=vec3(floor(t*2.)/2.*.62,mix(cos(a2),cos(a2+PI),m)*1.15,mix(sin(a2),sin(a2+PI),m)*1.15);}
  return p;
}
void main(){
  float i=float(gl_VertexID),u=h(i*.731+.1),v=h(i*1.379+.2),w=h(i*2.113+.3),z=h(i*3.917+.4);
  float s=clamp(uS,0.,7.); int a=int(floor(s)); float f=s-float(a);
  float m=smoothstep(0.,1.,clamp((f-.25-u*.3)/.42,0.,1.));
  vec3 p=mix(F(a,u,v,w,z),F(min(a+1,7),u,v,w,z),m);
  float turb=sin(PI*m)*1.3;
  p+=turb*vec3(sin(p.y*1.7+uT*1.3+u*6.),sin(p.z*1.3+uT*1.1+v*6.),sin(p.x*1.5+uT*.9+w*6.));
  p.xz*=rot(uM.x*.22); p.yz*=rot(-uM.y*.14);
  vec3 c=p-vec3(0.,0.,9.5); float fl=1.9*min(1.,uAsp*1.7);
  gl_Position=vec4(c.x*fl/uAsp+uOff*-c.z,c.y*fl+uOffY*-c.z,0.,-c.z);
  gl_PointSize=uSize*(.6+z*.9)/-c.z;
  vC=mix(vec3(1.,.54,.32),vec3(1.,.9,.78),step(.82,w)); vA=.55+.45*sin(uT*2.+i);
}`;

const FS = `
in vec3 vC; in float vA; out vec4 o;
void main(){ vec2 q=gl_PointCoord-.5; float d=dot(q,q); float a=exp(-d*22.)*vA; o=vec4(vC*a*.85,1.); }`;

run({
  init(gl, T) {
    const prog = compile(gl, VS, FS), post = makePost(gl), vao = gl.createVertexArray();
    let n = T.particles, w = 1, h = 1, vane = 0.3;
    return {
      setTier(nT) { n = nT.particles; },
      resize(nw, nh) { w = nw; h = nh; post.resize(w, h); },
      frame(st) {
        const target = Math.atan2(st.my + 0.12, st.mx + (Math.abs(st.mx) < 0.02 ? 0.6 : 0));
        let dv = target - vane; dv = Math.atan2(Math.sin(dv), Math.cos(dv)); vane += dv * 0.05;
        post.begin();
        gl.clearColor(0.012, 0.01, 0.01, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(prog.p); gl.bindVertexArray(vao);
        const u = prog.u, asp = w / h;
        gl.uniform1f(u.uT, st.t); gl.uniform1f(u.uS, st.p); gl.uniform1f(u.uAsp, asp);
        gl.uniform1f(u.uOff, asp > 1.2 ? 0.34 : 0); gl.uniform1f(u.uOffY, asp < 0.8 ? 0.42 : 0); gl.uniform1f(u.uVaneA, vane);
        gl.uniform1f(u.uSize, (h / 900) * 22 * Math.sqrt(120000 / n)); gl.uniform2f(u.uM, st.mx, st.my);
        gl.drawArrays(gl.POINTS, 0, n);
        post.end(st.t, 0.003 + Math.min(0.05, Math.abs(st.vel) * 0.03), 1.4);
      },
    };
  },
  // Optional sound: filtered noise as wind; its pitch follows scroll speed. Off by default.
  voice(ctx, out) {
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.value = 400;
    const g = ctx.createGain(); g.gain.value = 0.25; src.connect(bp).connect(g).connect(out); src.start();
    return (st) => { bp.frequency.setTargetAtTime(300 + Math.min(1500, Math.abs(st.vel) * 900) + st.mx * 80, ctx.currentTime, 0.15); };
  },
});
