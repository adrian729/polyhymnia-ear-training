async page => {
  const results = [];
  const cases = [
    {width: 1440, font: 'display', size: '21', narrow: false, text: 'Intervals and harmony'},
    {width: 768, font: 'junicode', size: '26', narrow: false, text: 'Listen, compare, and sing the phrase'},
    {width: 390, font: 'garamond', size: '26', narrow: false, text: 'Rhythm and musical memory'},
    {width: 320, font: 'sans', size: '32', narrow: false, text: 'Listen, compare, and sing the phrase'},
    {width: 1440, font: 'display', size: '32', narrow: true, text: 'Listen, compare, and sing the phrase'},
  ];
  for (const scenario of cases) {
    await page.setViewportSize({width: scenario.width, height: 1100});
    await page.locator('#sample-text').fill(scenario.text);
    await page.locator('#typeface').selectOption(scenario.font);
    await page.locator('#type-size').selectOption(scenario.size);
    await page.locator('#narrow').setChecked(scenario.narrow);
    await page.evaluate(async () => { await document.fonts.ready; });
    const problems = await page.evaluate(() => {
      const errors = [];
      if (document.documentElement.scrollWidth > innerWidth) errors.push('page overflow');
      for (const title of document.querySelectorAll('.lettering')) {
        const text = title.getBoundingClientRect();
        const surface = title.closest('.specimen').getBoundingClientRect();
        if (text.left < surface.left - 1 || text.right > surface.right + 1) errors.push('heading escapes specimen');
        if (title.scrollWidth > title.clientWidth + 1) errors.push('text overflow');
      }
      return errors;
    });
    if (problems.length) throw new Error(JSON.stringify({scenario, problems}));
    results.push({scenario, result: 'No page overflow or clipped lettering'});
  }
  await page.screenshot({path: 'output/acanthus-directions/narrow-large.png', fullPage: true});
  await page.setViewportSize({width: 390, height: 1000});
  await page.locator('#type-size').selectOption('21');
  await page.locator('#narrow').uncheck();
  await page.screenshot({path: 'output/acanthus-directions/mobile.png', fullPage: true});
  await page.setViewportSize({width: 1440, height: 1100});
  await page.reload();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map(image => image.decode()));
  });
  await page.screenshot({path: 'output/acanthus-directions/comparison.png', fullPage: true});
  return results;
}
