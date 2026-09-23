// Find solid colored components separated by the board's white gutters.
// Input coordinates are preserved so the renderer can scale independently.
export function detectBoard({data,width,height}) {
  const count=width*height, mask=new Uint8Array(count), queue=new Int32Array(count);
  for(let i=0;i<count;i++) {
    const r=data[4*i],g=data[4*i+1],b=data[4*i+2];
    mask[i]=Math.max(r,g,b)-Math.min(r,g,b)>35 && Math.min(r,g,b)<235 ? 1 : 0;
  }
  const cells=[];
  for(let start=0;start<count;start++) {
    if(!mask[start]) continue;
    let head=0,tail=1,minX=width,maxX=0,minY=height,maxY=0;
    queue[0]=start;mask[start]=0;
    while(head<tail) {
      const p=queue[head++],x=p%width,y=Math.floor(p/width);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      const neighbors=[x>0?p-1:-1,x<width-1?p+1:-1,y>0?p-width:-1,y<height-1?p+width:-1];
      for(const next of neighbors) if(next>=0 && mask[next]) {mask[next]=0;queue[tail++]=next;}
    }
    const w=maxX-minX+1,h=maxY-minY+1;
    if(w>width*.035 && w<width*.23 && h/w>.85 && h/w<1.15 && tail/(w*h)>.85)
      cells.push({x:(minX+maxX)/2,y:(minY+maxY)/2,w,h});
  }
  // A candidate row must belong to an equally spaced square lattice.
  for(const anchor of cells) {
    const similar=cells.filter(c=>Math.abs(c.w-anchor.w)<anchor.w*.12 && Math.abs(c.h-anchor.h)<anchor.h*.12);
    const rows=[];
    for(const c of similar.sort((a,b)=>a.y-b.y || a.x-b.x)) {
      let row=rows.find(r=>Math.abs(r[0].y-c.y)<anchor.h*.15);
      if(!row) {row=[];rows.push(row);} row.push(c);
    }
    for(const row of rows) row.sort((a,b)=>a.x-b.x);
    for(let n=5;n<=11;n++) {
      const matching=rows.filter(r=>r.length===n);
      for(let offset=0;offset<=matching.length-n;offset++) {
        const grid=matching.slice(offset,offset+n),pitch=grid[0][1].x-grid[0][0].x;
        if(pitch<anchor.w || pitch>anchor.w*1.4) continue;
        if(!grid.every((r,y)=>r.every((c,x)=>Math.abs(c.x-(grid[0][0].x+x*pitch))<pitch*.08 && Math.abs(c.y-(grid[0][0].y+y*pitch))<pitch*.08))) continue;
        const palette=[];
        const colors=grid.map(row=>row.map(c=> {
          const channels=[[],[],[]];
          for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) {
            const p=4*((Math.round(c.y)+dy)*width+Math.round(c.x)+dx);
            for(let k=0;k<3;k++) channels[k].push(data[p+k]);
          }
          const rgb=channels.map(a=>a.sort((a,b)=>a-b)[12]);
          let id=palette.findIndex(p=>Math.hypot(...p.map((v,k)=>v-rgb[k]))<9);
          if(id<0) {id=palette.length;palette.push(rgb);} return id;
        }));
        if(palette.length!==n) throw new Error(`Found a ${n} × ${n} grid, but ${palette.length} colors. Try an untouched screenshot.`);
        return {size:n,colors,cells:grid,palette};
      }
    }
  }
  throw new Error('Could not read the board. Choose a clear, untouched screenshot with the whole grid visible.');
}
