async page => {
  const results = [];
  const cases = [
    {width:1440, font:'display', size:'21', narrow:false, text:'Intervals and harmony'},
    {width:768, font:'junicode', size:'26', narrow:false, text:'Music and memory'},
    {width:390, font:'garamond', size:'26', narrow:false, text:'Listen, compare, and sing the phrase'},
    {width:320, font:'sans', size:'32', narrow:false, text:'Wide and narrow initials'},
    {width:1440, font:'display', size:'32', narrow:true, text:'Listen, compare, and sing the phrase'},
  ];
  for (const scenario of cases) {
    await page.setViewportSize({width:scenario.width, height:1100});
    await page.locator('#sample-text').fill(scenario.text);
    await page.locator('#typeface').selectOption(scenario.font);
    await page.locator('#type-size').selectOption(scenario.size);
    await page.locator('#narrow').setChecked(scenario.narrow);
    await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(resolve)); });
    const review = await page.evaluate(async () => {
      const metadata = await fetch('./assets.json').then(r => r.json());
      const errors = [];
      let joins = 0;
      let minimumAlpha = 255;
      const images = new Map();
      const context = document.createElement('canvas').getContext('2d');
      const segmenter = new Intl.Segmenter(undefined, {granularity:'grapheme'});
      if (document.documentElement.scrollWidth > innerWidth) errors.push('page overflow');
      for (const sample of document.querySelectorAll('.sample')) {
        const title = sample.querySelector('.lettering');
        const style = getComputedStyle(title);
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const cap = context.measureText('H');
        const box = sample.getBoundingClientRect();
        const characters = [];
        for (const word of title.textContent.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(title.firstChild, word.index); range.setEnd(title.firstChild, word.index + word[0].length);
          if (range.getClientRects().length > 1) errors.push(`${sample.dataset.design}: split word ${JSON.stringify(word[0])}`);
        }
        for (const {segment, index} of segmenter.segment(title.textContent)) {
          const range = document.createRange();
          range.setStart(title.firstChild, index); range.setEnd(title.firstChild, index + segment.length);
          const rect = range.getBoundingClientRect();
          const m = context.measureText(segment);
          const baseline = rect.top + cap.fontBoundingBoxAscent;
          characters.push({letter:segment, range:rect, left:rect.left-m.actualBoundingBoxLeft, right:rect.left+m.actualBoundingBoxRight, top:baseline-m.actualBoundingBoxAscent, bottom:baseline+m.actualBoundingBoxDescent});
        }
        const start = sample.querySelector('.start-line').getBoundingClientRect();
        const end = sample.querySelector('.end-line').getBoundingClientRect();
        if (start.right >= characters[0].range.left || end.left <= characters.at(-1).range.right) errors.push(`${sample.dataset.design}: a rule enters the text`);
        if (title.scrollWidth > title.clientWidth + 1 || start.width < 0 || end.right > box.right + 1) errors.push(`${sample.dataset.design}: overflow`);
        const asset = metadata[sample.dataset.design];
        for (const [kind, line] of [['opening',start], ['closing',end]]) {
          const art = sample.querySelector(`.${kind}`), image = art.firstElementChild;
          await image.decode();
          if (!images.has(image.src)) {
            const canvas = document.createElement('canvas'); canvas.width=image.naturalWidth; canvas.height=image.naturalHeight;
            const c = canvas.getContext('2d'); c.drawImage(image,0,0);
            images.set(image.src,c.getImageData(0,0,canvas.width,canvas.height));
          }
          const pixels = images.get(image.src), scale = Number(art.dataset.scale), [ox,oy] = JSON.parse(art.dataset.origin);
          const bounds = asset[kind === 'opening' ? 'left' : 'right'];
          const alpha = (x,y) => {
            const px=Math.floor((x-box.left-ox)/scale), py=Math.floor((y-box.top-oy)/scale);
            if (px<bounds[0]-3 || px>=bounds[2]+3 || py<bounds[1]-3 || py>=bounds[3]+3) return 0;
            return pixels.data[(py*pixels.width+px)*4+3] || 0;
          };
          const endpoint=kind === 'opening' ? line.right : line.left;
          for (const y of [line.top+.15,(line.top+line.bottom)/2,line.bottom-.15]) {
            const opacity=alpha(endpoint,y); minimumAlpha=Math.min(minimumAlpha,opacity);
            if (opacity<230) errors.push(`${sample.dataset.design}: exposed ${kind} join (${opacity})`);
          }
          joins++;
          const artBox=art.getBoundingClientRect();
          if (artBox.left<box.left-1 || artBox.right>box.right+1) errors.push(`${sample.dataset.design}: ornament escapes sample`);
          for (const char of characters) {
            if (!char.letter.trim() || char.right<artBox.left || char.left>artBox.right || char.bottom<artBox.top || char.top>artBox.bottom) continue;
            let collision=false;
            for (let y=char.top+.6;y<char.bottom-.6&&!collision;y+=.7) for(let x=char.left+.6;x<char.right-.6;x+=.7) if(alpha(x,y)>100){collision=true;break;}
            if (collision) errors.push(`${sample.dataset.design}: ${kind} touches ${JSON.stringify(char.letter)} in ${JSON.stringify(title.textContent)}`);
          }
        }
      }
      return {errors:[...new Set(errors)],joins,minimumAlpha};
    });
    results.push({scenario,...review});
  }
  await page.screenshot({path:'output/acanthus-bouquet-variations/narrow-large.png',fullPage:true});
  await page.setViewportSize({width:390,height:1000});
  await page.locator('#type-size').selectOption('21');
  await page.locator('#narrow').uncheck();
  await page.screenshot({path:'output/acanthus-bouquet-variations/mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1100});
  await page.reload();
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode()));});
  await page.screenshot({path:'output/acanthus-bouquet-variations/comparison.png',fullPage:true});
  const failures = results.filter(result => result.errors.length);
  if (failures.length) throw new Error(JSON.stringify(failures));
  return results;
}
