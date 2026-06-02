const { Jimp } = require('jimp');
const fs = require('fs');
(async () => {
  const SRC='/tmp/icon-muted-B-mono.png', OUT='assets/images';
  // 1) iOS icon: already 1024 opaque, no alpha
  fs.copyFileSync(SRC, OUT+'/icon.png');
  const src = await Jimp.read(SRC);
  const W=src.bitmap.width,H=src.bitmap.height,d=src.bitmap.data;
  const px=(x,y)=>{const i=(y*W+x)*4;return [d[i],d[i+1],d[i+2]];};
  const cs=[px(4,4),px(W-5,4),px(4,H-5),px(W-5,H-5)];
  const bg=[0,1,2].map(c=>Math.round(cs.reduce((s,p)=>s+p[c],0)/cs.length));
  const bgHex='#'+bg.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  // 2) transparent mark via chroma-key + bounds
  const mark=src.clone(),md=mark.bitmap.data; const TOL=46;
  let minX=W,minY=H,maxX=0,maxY=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;
    const dist=Math.abs(md[i]-bg[0])+Math.abs(md[i+1]-bg[1])+Math.abs(md[i+2]-bg[2]);
    if(dist<TOL){md[i+3]=0;} else {if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}}
  const m=6; minX=Math.max(0,minX-m);minY=Math.max(0,minY-m);maxX=Math.min(W-1,maxX+m);maxY=Math.min(H-1,maxY+m);
  const cw=maxX-minX+1,ch=maxY-minY+1;
  const cropped=mark.clone().crop({x:minX,y:minY,w:cw,h:ch});
  const onCanvas=(size,frac)=>{const canvas=new Jimp({width:size,height:size,color:0x00000000});
    const target=Math.round(size*frac),s=Math.min(target/cw,target/ch),c=cropped.clone();
    c.resize({w:Math.max(1,Math.round(cw*s)),h:Math.max(1,Math.round(ch*s))});
    canvas.composite(c,Math.round((size-c.bitmap.width)/2),Math.round((size-c.bitmap.height)/2));return canvas;};
  await onCanvas(1024,0.60).write(OUT+'/android-icon-foreground.png');
  await onCanvas(1024,0.88).write(OUT+'/splash-icon.png');
  const mono=onCanvas(1024,0.60),mm=mono.bitmap.data;
  for(let i=0;i<mm.length;i+=4){if(mm[i+3]>10){mm[i]=0;mm[i+1]=0;mm[i+2]=0;}}
  await mono.write(OUT+'/android-icon-monochrome.png');
  // also write a solid off-white bg image (1024) for adaptive backgroundImage if needed
  await new Jimp({width:1024,height:1024,color:(bg[0]<<24)|(bg[1]<<16)|(bg[2]<<8)|0xff}).write(OUT+'/android-icon-background.png');
  console.log('BGHEX='+bgHex);
})();
