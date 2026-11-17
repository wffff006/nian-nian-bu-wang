/* Minimal dependency-free GLB viewer (WebGL2, WebGL1 fallback).
   Supports: single/multiple meshes, node TRS, baseColor + normal + metallicRoughness textures,
   orbit (drag), zoom (wheel / pinch), double-click reset, auto-rotate. */
(function(){
'use strict';

function mat4(){return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);}
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;}
function perspective(fovy,aspect,n,f){const t=1/Math.tan(fovy/2),o=new Float32Array(16);o[0]=t/aspect;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o;}
function lookAt(e,c,u){let z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]];let l=Math.hypot(...z);z=z.map(v=>v/l);
  let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];l=Math.hypot(...x);x=x.map(v=>v/l);
  const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
  return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]);}
function trs(n){
  if(n.matrix) return new Float32Array(n.matrix);
  const t=n.translation||[0,0,0],q=n.rotation||[0,0,0,1],s=n.scale||[1,1,1];
  const [x,y,z,w]=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  return new Float32Array([(1-(yy+zz))*s[0],(xy+wz)*s[0],(xz-wy)*s[0],0,(xy-wz)*s[1],(1-(xx+zz))*s[1],(yz+wx)*s[1],0,(xz+wy)*s[2],(yz-wx)*s[2],(1-(xx+yy))*s[2],0,t[0],t[1],t[2],1]);
}
function xform(m,p){return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];}

const VS2=`#version 300 es
in vec3 aPos;in vec3 aNor;in vec2 aUv;uniform mat4 uMVP,uModel;out vec3 vN;out vec3 vW;out vec2 vUv;
void main(){vec4 w=uModel*vec4(aPos,1.);vW=w.xyz;vN=mat3(uModel)*aNor;vUv=aUv;gl_Position=uMVP*vec4(aPos,1.);}`;
const FS2=`#version 300 es
precision highp float;in vec3 vN;in vec3 vW;in vec2 vUv;out vec4 o;
uniform sampler2D uBase,uNorm,uMR;uniform vec4 uBaseF;uniform float uHasBase,uHasNorm,uHasMR;uniform vec3 uEye;
vec3 perturb(vec3 N,vec3 V,vec2 uv){vec3 mapN=texture(uNorm,uv).xyz*2.-1.;
 vec3 dp1=dFdx(-V),dp2=dFdy(-V);vec2 du1=dFdx(uv),du2=dFdy(uv);
 vec3 dp2p=cross(dp2,N),dp1p=cross(N,dp1);vec3 T=dp2p*du1.x+dp1p*du2.x;vec3 B=dp2p*du1.y+dp1p*du2.y;
 float inv=inversesqrt(max(dot(T,T),dot(B,B))+1e-12);return normalize(mat3(T*inv,B*inv,N)*mapN);}
void main(){vec3 V=normalize(uEye-vW);vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;
 if(uHasNorm>.5)N=perturb(N,uEye-vW,vUv);
 vec4 bc=uBaseF;if(uHasBase>.5){vec4 t=texture(uBase,vUv);bc*=vec4(pow(t.rgb,vec3(2.2)),t.a);}
 float rough=.75;if(uHasMR>.5)rough=clamp(texture(uMR,vUv).g,.25,1.);
 vec3 L1=normalize(vec3(.5,.8,.6)),L2=normalize(vec3(-.7,.3,-.5));
 float d1=max(dot(N,L1),0.),d2=max(dot(N,L2),0.);
 float hemi=.5+.5*N.y;vec3 amb=mix(vec3(.30,.28,.26),vec3(.62,.64,.70),hemi);
 vec3 H=normalize(L1+V);float sp=pow(max(dot(N,H),0.),mix(80.,6.,rough))*(1.-rough)*.6;
 float rim=pow(1.-max(dot(N,V),0.),3.)*.18;
 vec3 c=bc.rgb*(amb+vec3(1.,.97,.92)*d1*1.05+vec3(.55,.62,.75)*d2*.35)+sp+rim;
 c=c/(c+.85)*1.55;o=vec4(pow(c,vec3(1./2.2)),1.);}`;
const VS1=`attribute vec3 aPos;attribute vec3 aNor;attribute vec2 aUv;uniform mat4 uMVP,uModel;varying vec3 vN;varying vec3 vW;varying vec2 vUv;
void main(){vec4 w=uModel*vec4(aPos,1.);vW=w.xyz;vN=mat3(uModel[0].xyz,uModel[1].xyz,uModel[2].xyz)*aNor;vUv=aUv;gl_Position=uMVP*vec4(aPos,1.);}`;
const FS1=`precision mediump float;varying vec3 vN;varying vec3 vW;varying vec2 vUv;uniform sampler2D uBase;uniform vec4 uBaseF;uniform float uHasBase;uniform vec3 uEye;
void main(){vec3 N=normalize(vN);vec3 V=normalize(uEye-vW);if(dot(N,V)<0.)N=-N;vec4 bc=uBaseF;if(uHasBase>.5){vec4 t=texture2D(uBase,vUv);bc*=vec4(pow(t.rgb,vec3(2.2)),t.a);}
 vec3 L1=normalize(vec3(.5,.8,.6));float d1=max(dot(N,L1),0.);float hemi=.5+.5*N.y;vec3 amb=mix(vec3(.30,.28,.26),vec3(.62,.64,.70),hemi);
 vec3 c=bc.rgb*(amb+vec3(1.,.97,.92)*d1*1.05);c=c/(c+.85)*1.55;gl_FragColor=vec4(pow(c,vec3(1./2.2)),1.);}`;

function Viewer(canvas){
  this.canvas=canvas;
  let gl=canvas.getContext('webgl2',{antialias:true,alpha:true,premultipliedAlpha:true});
  this.v2=!!gl;
  if(!gl){gl=canvas.getContext('webgl',{antialias:true,alpha:true})||canvas.getContext('experimental-webgl');if(gl)this.u32=gl.getExtension('OES_element_index_uint');}
  if(!gl) throw new Error('WebGL not supported');
  this.gl=gl;
  this.prog=this._program(this.v2?VS2:VS1,this.v2?FS2:FS1);
  this.draws=[];this.yaw=0.6;this.pitch=0.25;this.dist=3;this.spin=true;this.target=[0,0,0];this.radius=1;
  this._bind();this._raf=null;this._dirty=true;this.loop=this.loop.bind(this);
}
Viewer.prototype._program=function(vs,fs){const gl=this.gl;const mk=(t,s)=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh;};
  const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,vs));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fs));gl.bindAttribLocation(p,0,'aPos');gl.bindAttribLocation(p,1,'aNor');gl.bindAttribLocation(p,2,'aUv');gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  const u={};['uMVP','uModel','uBase','uNorm','uMR','uBaseF','uHasBase','uHasNorm','uHasMR','uEye'].forEach(n=>u[n]=gl.getUniformLocation(p,n));p.u=u;return p;};

function loadGLBScript(url,onProgress){return new Promise((ok,no)=>{
  const key=url;window.__GLB=window.__GLB||{};
  const done=()=>{const b64=window.__GLB[key];if(!b64)return no(new Error('模型文件缺失'));
    setTimeout(()=>{try{const bin=atob(b64);const n=bin.length,u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=bin.charCodeAt(i);delete window.__GLB[key];if(onProgress)onProgress(1,n);ok(u.buffer);}catch(e){no(e);}},30);};
  if(window.__GLB[key])return done();
  if(onProgress)onProgress(0.15,0);
  const sc=document.createElement('script');sc.src=url+'.js';sc.async=true;sc.onload=()=>{sc.remove();done();};sc.onerror=()=>{sc.remove();no(new Error('无法读取模型文件'));};document.head.appendChild(sc);});}
Viewer.prototype.load=async function(url,onProgress){
  // 双击 index.html（file://）时浏览器禁止 fetch，改用 <script> 载入同名 .glb.js
  if(location.protocol==='file:'){await this._parse(await loadGLBScript(url,onProgress));return;}
  let res;try{res=await fetch(url);}catch(e){await this._parse(await loadGLBScript(url,onProgress));return;}
  if(!res.ok)throw new Error('HTTP '+res.status);
  const total=+res.headers.get('content-length')||0;let buf;
  if(res.body&&res.body.getReader&&onProgress){const rd=res.body.getReader();const chunks=[];let got=0;
    for(;;){const {done,value}=await rd.read();if(done)break;chunks.push(value);got+=value.length;onProgress(total?got/total:0,got);}
    buf=new Uint8Array(got);let o=0;for(const c of chunks){buf.set(c,o);o+=c.length;}buf=buf.buffer;
  } else buf=await res.arrayBuffer();
  await this._parse(buf);
};
Viewer.prototype._parse=async function(ab){
  const gl=this.gl,dv=new DataView(ab);if(dv.getUint32(0,true)!==0x46546C67)throw new Error('Not a GLB');
  let off=12,json=null,bin=null;
  while(off<ab.byteLength){const len=dv.getUint32(off,true),type=dv.getUint32(off+4,true);
    if(type===0x4E4F534A)json=JSON.parse(new TextDecoder().decode(new Uint8Array(ab,off+8,len)));else if(type===0x004E4942)bin=new Uint8Array(ab,off+8,len);off+=8+len;}
  const J=json;const CT={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};const NC={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
  const acc=i=>{const a=J.accessors[i],bv=J.bufferViews[a.bufferView],T=CT[a.componentType],n=NC[a.type];
    const start=bin.byteOffset+(bv.byteOffset||0)+(a.byteOffset||0);const stride=bv.byteStride||0,es=T.BYTES_PER_ELEMENT;
    let arr;if(!stride||stride===n*es){if(start%es===0)arr=new T(bin.buffer,start,a.count*n);else arr=new T(bin.buffer.slice(start,start+a.count*n*es));}
    else{arr=new T(a.count*n);const src=new DataView(bin.buffer);for(let k=0;k<a.count;k++)for(let c=0;c<n;c++){const p=start+k*stride+c*es;arr[k*n+c]=es===4?(T===Float32Array?src.getFloat32(p,true):src.getUint32(p,true)):es===2?(T===Int16Array?src.getInt16(p,true):src.getUint16(p,true)):(T===Int8Array?src.getInt8(p):src.getUint8(p));}}
    if(a.normalized&&T!==Float32Array){const f=new Float32Array(arr.length),d=T===Uint8Array?255:T===Int8Array?127:T===Uint16Array?65535:32767;for(let k=0;k<arr.length;k++)f[k]=Math.max(arr[k]/d,-1);return f;}
    return arr;};
  // textures
  const texCache={};
  const tex=async(ti,srgb)=>{if(ti==null)return null;const key=ti;if(texCache[key])return texCache[key];
    const t=J.textures[ti],img=J.images[t.source];const bv=J.bufferViews[img.bufferView];
    const blob=new Blob([new Uint8Array(bin.buffer,bin.byteOffset+(bv.byteOffset||0),bv.byteLength)],{type:img.mimeType});
    let bmp;try{bmp=await createImageBitmap(blob);}catch(e){bmp=await new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=URL.createObjectURL(blob);});}
    const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bmp);
    const pot=v=>(v&(v-1))===0;if(this.v2||(pot(bmp.width)&&pot(bmp.height))){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}
    else{gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
    const an=gl.getExtension('EXT_texture_filter_anisotropic');if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,8);
    if(bmp.close)bmp.close();texCache[key]=tx;return tx;};
  const min=[1e9,1e9,1e9],max=[-1e9,-1e9,-1e9];
  const draws=[];
  const visit=async(ni,parent)=>{const n=J.nodes[ni];const m=mul(parent,trs(n));
    if(n.mesh!=null){for(const p of J.meshes[n.mesh].primitives){
      if(p.mode!=null&&p.mode!==4)continue;
      const pos=acc(p.attributes.POSITION);const nor=p.attributes.NORMAL!=null?acc(p.attributes.NORMAL):null;const uv=p.attributes.TEXCOORD_0!=null?acc(p.attributes.TEXCOORD_0):null;
      let idx=p.indices!=null?acc(p.indices):null;
      if(idx instanceof Uint32Array&&!this.v2&&!this.u32){throw new Error('Device lacks 32-bit index support');}
      const pa=J.accessors[p.attributes.POSITION];
      if(pa.min&&pa.max){for(let cx=0;cx<8;cx++){const c=[cx&1?pa.max[0]:pa.min[0],cx&2?pa.max[1]:pa.min[1],cx&4?pa.max[2]:pa.min[2]];const w=xform(m,c);for(let k=0;k<3;k++){min[k]=Math.min(min[k],w[k]);max[k]=Math.max(max[k],w[k]);}}}
      const mk=(data,loc,size)=>{if(!data){gl.disableVertexAttribArray(loc);return null;}const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data instanceof Float32Array?data:new Float32Array(data),gl.STATIC_DRAW);return {b,size};};
      const d={model:m,pos:mk(pos,0,3),nor:mk(nor,1,3),uv:mk(uv,2,2),count:idx?idx.length:pos.length/3};
      if(idx){d.ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,d.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);d.itype=idx instanceof Uint32Array?gl.UNSIGNED_INT:idx instanceof Uint16Array?gl.UNSIGNED_SHORT:gl.UNSIGNED_BYTE;}
      const mat=p.material!=null?J.materials[p.material]:{};const pbr=mat.pbrMetallicRoughness||{};
      d.baseF=pbr.baseColorFactor||[1,1,1,1];
      d.base=pbr.baseColorTexture?await tex(pbr.baseColorTexture.index):null;
      d.norm=(this.v2&&mat.normalTexture)?await tex(mat.normalTexture.index):null;
      d.mr=(this.v2&&pbr.metallicRoughnessTexture)?await tex(pbr.metallicRoughnessTexture.index):null;
      d.double=!!mat.doubleSided;
      draws.push(d);}}
    for(const c of (n.children||[]))await visit(c,m);};
  const scene=J.scenes?J.scenes[J.scene||0]:{nodes:J.nodes.map((_,i)=>i)};
  for(const ni of scene.nodes)await visit(ni,mat4());
  this.draws=draws;
  this.target=[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2];
  this.radius=Math.hypot(max[0]-min[0],max[1]-min[1],max[2]-min[2])/2||1;
  this.reset();this.start();
};
Viewer.prototype.reset=function(){this.yaw=0.6;this.pitch=0.22;this.dist=this.radius*2.6;this._dirty=true;};
Viewer.prototype.dispose=function(){this.stop();const gl=this.gl;for(const d of this.draws){[d.pos,d.nor,d.uv].forEach(x=>x&&gl.deleteBuffer(x.b));d.ib&&gl.deleteBuffer(d.ib);[d.base,d.norm,d.mr].forEach(t=>t&&gl.deleteTexture(t));}this.draws=[];};
Viewer.prototype.start=function(){if(!this._raf){this._last=performance.now();this._raf=requestAnimationFrame(this.loop);}};
Viewer.prototype.stop=function(){if(this._raf)cancelAnimationFrame(this._raf);this._raf=null;};
Viewer.prototype.loop=function(t){const dt=Math.min(.05,(t-this._last)/1000);this._last=t;
  if(this.spin&&!this._drag){this.yaw+=dt*.35;this._dirty=true;}
  if(this._dirty)this.render();this._raf=requestAnimationFrame(this.loop);};
Viewer.prototype.render=function(){const gl=this.gl,c=this.canvas;const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.round(c.clientWidth*dpr),h=Math.round(c.clientHeight*dpr);if(!w||!h)return;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  this._dirty=false;gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  const tg=this.target,cp=Math.cos(this.pitch);const eye=[tg[0]+this.dist*cp*Math.sin(this.yaw),tg[1]+this.dist*Math.sin(this.pitch),tg[2]+this.dist*cp*Math.cos(this.yaw)];
  const P=perspective(0.6,w/h,this.radius*0.02,this.radius*20+this.dist),Vm=lookAt(eye,tg,[0,1,0]);const VP=mul(P,Vm);
  const p=this.prog,u=p.u;gl.useProgram(p);gl.uniform3fv(u.uEye,eye);
  for(const d of this.draws){
    gl.uniformMatrix4fv(u.uMVP,false,mul(VP,d.model));gl.uniformMatrix4fv(u.uModel,false,d.model);
    const bindA=(x,loc)=>{if(x){gl.bindBuffer(gl.ARRAY_BUFFER,x.b);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,x.size,gl.FLOAT,false,0,0);}else{gl.disableVertexAttribArray(loc);}};
    bindA(d.pos,0);bindA(d.nor,1);bindA(d.uv,2);if(!d.nor)gl.vertexAttrib3f(1,0,1,0);
    gl.uniform4fv(u.uBaseF,d.baseF);
    const bt=(tx,unit,loc,flag)=>{gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tx);if(loc)gl.uniform1i(loc,unit);if(flag)gl.uniform1f(flag,tx?1:0);};
    bt(d.base,0,u.uBase,u.uHasBase);if(this.v2){bt(d.norm,1,u.uNorm,u.uHasNorm);bt(d.mr,2,u.uMR,u.uHasMR);}
    if(d.double)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);}
    if(d.ib){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,d.ib);gl.drawElements(gl.TRIANGLES,d.count,d.itype,0);}else gl.drawArrays(gl.TRIANGLES,0,d.count);
  }};
Viewer.prototype._bind=function(){const c=this.canvas;const pts=new Map();let lastPinch=0;
  const onDown=e=>{c.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);this._drag=true;this.onInteract&&this.onInteract();};
  const onMove=e=>{if(!pts.has(e.pointerId))return;const prev=pts.get(e.pointerId);const cur=[e.clientX,e.clientY];pts.set(e.pointerId,cur);
    if(pts.size===1){this.yaw-=(cur[0]-prev[0])*0.008;this.pitch=Math.max(-1.45,Math.min(1.45,this.pitch+(cur[1]-prev[1])*0.008));}
    else if(pts.size===2){const [a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(lastPinch)this.zoom(lastPinch/d);lastPinch=d;}
    this._dirty=true;};
  const onUp=e=>{pts.delete(e.pointerId);if(pts.size<2)lastPinch=0;if(!pts.size)this._drag=false;};
  c.addEventListener('pointerdown',onDown);c.addEventListener('pointermove',onMove);c.addEventListener('pointerup',onUp);c.addEventListener('pointercancel',onUp);
  c.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(e.deltaY*0.0012));this.onInteract&&this.onInteract();},{passive:false});
  c.addEventListener('dblclick',()=>this.reset());
  if(window.ResizeObserver)new ResizeObserver(()=>{this._dirty=true;}).observe(c);
};
Viewer.prototype.zoom=function(f){this.dist=Math.max(this.radius*1.05,Math.min(this.radius*8,this.dist*f));this._dirty=true;};

window.GLBViewer=Viewer;
})();
