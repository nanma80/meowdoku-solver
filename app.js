const photo=document.querySelector('#photo'),button=document.querySelector('#solve');
const canvas=document.querySelector('#preview'),ctx=canvas.getContext('2d');
const status=document.querySelector('#status'),empty=document.querySelector('#empty');
let image=null,worker=null,version=0;
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);}
photo.addEventListener('change',async()=>{
  const current=++version;
  worker?.terminate();worker=null;image=null;button.disabled=true;button.textContent='Solve';
  canvas.hidden=true;empty.hidden=false;
  const file=photo.files[0];if(!file) return;
  message('Opening screenshot…');
  const url=URL.createObjectURL(file);
  try {
    const next=new Image();next.src=url;await next.decode();
    if(current!==version)return;
    image=next;canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    ctx.drawImage(image,0,0);canvas.hidden=false;empty.hidden=true;button.disabled=false;
    canvas.setAttribute('aria-label','Selected screenshot, ready to solve');
    message('Ready when you are. Tap Solve to find every cat.');
  }catch {if(current===version)message('This image could not be opened. Try a PNG or JPEG screenshot.',true);}
  finally{URL.revokeObjectURL(url);}
});
button.addEventListener('click',()=>{
  if(!image)return;
  worker?.terminate();ctx.drawImage(image,0,0);button.disabled=true;button.textContent='Solving…';
  message('Reading the board and finding a home for every cat…');
  // Bound detection cost while keeping even 11×11 cells large enough to sample.
  const scale=Math.min(1,1000/image.naturalWidth),sample=document.createElement('canvas');
  sample.width=Math.round(image.naturalWidth*scale);sample.height=Math.round(image.naturalHeight*scale);
  const sampleCtx=sample.getContext('2d',{willReadFrequently:true});sampleCtx.drawImage(image,0,0,sample.width,sample.height);
  const pixels=sampleCtx.getImageData(0,0,sample.width,sample.height);
  const finishError=text=>{message(text,true);button.disabled=false;button.textContent='Solve';worker?.terminate();};
  try {
    worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
    worker.onerror=()=>finishError('Something went wrong while solving. Please try again.');
    worker.onmessage=({data})=>{
      if(data.error){finishError(data.error);return;}
      const {board,solution}=data;
      for(let row=0;row<board.size;row++) {
        const c=board.cells[row][solution[row]],radius=c.w*.28/scale;
        ctx.beginPath();ctx.arc(c.x/scale,c.y/scale,radius,0,Math.PI*2);
        ctx.strokeStyle='#20332a';ctx.lineWidth=c.w*.095/scale;ctx.stroke();
        ctx.strokeStyle='#fff';ctx.lineWidth=c.w*.045/scale;ctx.stroke();
      }
      message(`Solved ${board.size} × ${board.size} · Place a cat in each circle.`);
      canvas.setAttribute('aria-label',`Solved board. Cat columns by row: ${solution.map(c=>c+1).join(', ')}.`);
      button.disabled=false;button.textContent='Solve again';worker.terminate();
    };
    worker.postMessage(pixels,[pixels.data.buffer]);
  }catch{finishError('Could not start the solver. Please reload and try again.');}
});
