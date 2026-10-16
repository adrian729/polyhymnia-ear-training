async page => {
  const context = await page.context().browser().newContext({viewport:{width:460,height:1000},deviceScaleFactor:3});
  const detail = await context.newPage();
  await detail.goto('http://127.0.0.1:5175/output/acanthus-bouquet-variations/index.html');
  await detail.addStyleTag({content:'.page-header,.controls,footer,.description,.specimen:last-child{display:none} #bouquet-studies{padding:16px} .direction{padding:12px 16px} .direction header{padding-bottom:8px} .comparison{gap:12px} .specimen{min-height:120px}'});
  await detail.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode()));await new Promise(resolve=>requestAnimationFrame(resolve));});
  await detail.screenshot({path:'output/acanthus-bouquet-variations/junction-details.png',fullPage:true});
  await context.close();
}
