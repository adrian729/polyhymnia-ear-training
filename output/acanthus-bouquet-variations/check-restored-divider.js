async page=>{
 const results=[];
 for(const [route,width] of [['/exercises/intervals',1440],['/exercises/chords',390],['/exercises/rhythm',320],['/',1440]]) {
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:4176'+route);
  await page.locator('.acanthus-title').scrollIntoViewIfNeeded();
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.acanthus-title img')].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const result=await page.evaluate(async()=>{
   const title=document.querySelector('.acanthus-title'),rule=document.querySelector('.acanthus-rule');
   const errors=[];
   const size=e=>e.getBoundingClientRect();
   const lineStyle=getComputedStyle(rule.querySelector('.acanthus-rule-line'));
   const bands=[...title.querySelectorAll('.acanthus-title-line')];
   for(const line of bands){const s=getComputedStyle(line);if(s.height!==lineStyle.height||s.backgroundImage!==lineStyle.backgroundImage)errors.push('divider line differs from original');}
   for(const side of ['start','end']) {
    const original=rule.querySelector(`.acanthus-rule-${side}`),restored=title.querySelector(`.acanthus-title-terminal-${side}`);
    if(original.srcset!==restored.srcset||size(original).width!==size(restored).width||size(original).height!==size(restored).height)errors.push(`outer ${side} differs from original`);
    const line=title.querySelector(`.acanthus-title-line-${side}`), l=size(line),im=size(restored);
    if(Math.abs((l.top+l.bottom)/2-(im.top+im.height*.584))>.1)errors.push(`outer ${side} join misaligned`);
   }
   const h=title.querySelector('h2'),range=document.createRange();range.selectNodeContents(h);
   if(range.getClientRects().length!==1)errors.push('Exercises split across lines');
   if(document.documentElement.scrollWidth>innerWidth)errors.push('page overflow');
   let minimumAlpha=255;
   for(const [kind,side]of[['opening','start'],['closing','end']]){
    const im=title.querySelector(`.acanthus-title-${kind} img`), b=size(im),l=size(title.querySelector(`.acanthus-title-line-${side}`));
    const raster=new Image();raster.src=im.currentSrc;await raster.decode();
    const canvas=document.createElement('canvas');canvas.width=raster.naturalWidth;canvas.height=raster.naturalHeight;const c=canvas.getContext('2d');c.drawImage(raster,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;
    for(const y of[l.top+.15,(l.top+l.bottom)/2,l.bottom-.15]){
     const x=side==='start'?l.right:l.left,px=Math.floor((x-b.left)/b.width*canvas.width),py=Math.floor((y-b.top)/b.height*canvas.height),a=pixels[(py*canvas.width+px)*4+3];
     minimumAlpha=Math.min(minimumAlpha,a);if(a<230)errors.push(`${kind} join exposed`);
    }
   }
   return {errors,minimumAlpha,thickness:lineStyle.height,terminalWidth:size(title.querySelector('.acanthus-title-terminal')).width};
  });
  results.push({route,width,...result});
  if(route==='/exercises/intervals')await page.screenshot({path:'output/acanthus-bouquet-variations/selected-in-app.png'});
  if(width===390)await page.screenshot({path:'output/acanthus-bouquet-variations/selected-mobile.png'});
 }
 await page.goto('http://127.0.0.1:4176/exercises/intervals');
 if(results.some(r=>r.errors.length))throw Error(JSON.stringify(results));
 return results;
}
