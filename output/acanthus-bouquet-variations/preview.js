const root = document.getElementById('bouquet-studies');
const assets = await fetch('./assets.json').then(response => response.json());
const concepts = [
  ['A', 'Compact curl', 'A rounded blue leaf and a short red return around the initial.', 'compact-curl'],
  ['B', 'Rising scroll', 'An upright sweep with a fuller upper leaf and a lighter lower curl.', 'rising-scroll'],
  ['C', 'Ivy tendril', 'An open arrangement of ivy, small leaf folds, and fine gold curls.', 'ivy-tendril'],
  ['D', 'Folded fan', 'A diagonal fan above the initial, with a low finishing leaf.', 'folded-fan'],
];
function sample(slug, editable) {
  const asset = assets[slug];
  return `<div class="specimen"><div class="sample" data-design="${slug}">
    <span class="band start-line" aria-hidden="true"></span>
    <span class="art opening" aria-hidden="true"><img src="./${asset.asset}" width="${asset.width}" height="${asset.height}" alt=""></span>
    <div class="title-space"><h3 class="lettering" ${editable ? 'data-editable' : ''}>${editable ? 'Intervals and harmony' : 'Exercises'}</h3></div>
    <span class="art closing" aria-hidden="true"><img src="./${asset.asset}" width="${asset.width}" height="${asset.height}" alt=""></span>
    <span class="band end-line" aria-hidden="true"></span>
  </div></div>`;
}
document.getElementById('comparison').innerHTML = concepts.map(([letter, name, description, slug]) => `<article class="direction" aria-label="${name}"><header><h2><span>${letter}</span>${name}</h2><p class="description">${description}</p></header>${sample(slug, false)}${sample(slug, true)}</article>`).join('');
const fonts = {display:'var(--font-display)', junicode:'"Junicode VF", serif', garamond:'"EB Garamond Variable", serif', sans:'system-ui, sans-serif'};
const field = document.getElementById('sample-text');
const typeface = document.getElementById('typeface');
const size = document.getElementById('type-size');
const narrow = document.getElementById('narrow');
const segmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});
const context = document.createElement('canvas').getContext('2d');
function update() {
  root.querySelectorAll('[data-editable]').forEach(el => {el.textContent = field.value.trim() || 'Exercises';});
  root.style.setProperty('--study-font', fonts[typeface.value]);
  root.style.setProperty('--study-size', `${size.value}px`);
  root.classList.toggle('narrow', narrow.checked);
  fit();
}
function paintArt(element, asset, bounds, scale, originX, originY) {
  const [x, y, right, bottom] = bounds;
  const padding = 3;
  Object.assign(element.style, {
    left: `${originX + (x - padding) * scale}px`, top: `${originY + (y - padding) * scale}px`,
    width: `${(right - x + padding * 2) * scale}px`, height: `${(bottom - y + padding * 2) * scale}px`,
  });
  Object.assign(element.firstElementChild.style, {
    width: `${asset.width * scale}px`, left: `${-(x - padding) * scale}px`, top: `${-(y - padding) * scale}px`,
  });
  // Review metadata: all artwork is drawn with one scale in both dimensions.
  element.dataset.scale = String(scale);
  element.dataset.origin = JSON.stringify([originX, originY]);
}
function characterRect(heading, index, length) {
  const range = document.createRange();
  range.setStart(heading.firstChild, index);
  range.setEnd(heading.firstChild, index + length);
  return range.getBoundingClientRect();
}
function fit() {
  for (const sample of root.querySelectorAll('.sample')) {
    const asset = assets[sample.dataset.design];
    const heading = sample.querySelector('.lettering');
    const style = getComputedStyle(heading);
    const fontSize = parseFloat(style.fontSize);
    const artSize = sample.clientWidth < 360 ? Math.min(fontSize, 21) : fontSize;
    const openingScale = asset.openingEm * artSize / (asset.left[3] - asset.left[1]);
    let closingScale = asset.closingEm * artSize / (asset.right[3] - asset.right[1]);
    const gap = fontSize * .16;
    const reserveLeft = (asset.leftSlot[0] - asset.left[0]) * openingScale + 5;
    const reserveRight = (asset.right[2] - asset.right[0]) * closingScale + gap + 5;
    const overhang = Math.max(0, (asset.left[2] - asset.leftSlot[0]) * openingScale) + 4;
    sample.style.setProperty('--opening-reserve', `${reserveLeft}px`);
    sample.style.setProperty('--closing-reserve', `${reserveRight}px`);
    sample.style.setProperty('--initial-overhang', `${overhang}px`);
    const probe = heading.cloneNode(true);
    probe.removeAttribute('data-editable');
    probe.setAttribute('aria-hidden', 'true');
    Object.assign(probe.style, {position:'absolute', visibility:'hidden', width:'max-content', maxWidth:'none', padding:'0', textIndent:'0', whiteSpace:'nowrap'});
    sample.append(probe);
    const naturalWidth = probe.getBoundingClientRect().width;
    probe.remove();
    const multiline = naturalWidth > sample.clientWidth - 12 - reserveLeft - reserveRight + .5;
    sample.classList.toggle('multiline', multiline);
    if (multiline && asset.multilineClosingEm) closingScale = asset.multilineClosingEm * artSize / (asset.right[3] - asset.right[1]);

    const letters = [...segmenter.segment(heading.textContent)];
    if (!letters.length) continue;
    const first = letters[0], last = letters.at(-1);
    const firstRect = characterRect(heading, first.index, first.segment.length);
    const lastRect = characterRect(heading, last.index, last.segment.length);
    const box = sample.getBoundingClientRect();
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const cap = context.measureText('H');
    const ascent = cap.fontBoundingBoxAscent ?? firstRect.height * .8;
    const midCap = (cap.actualBoundingBoxAscent - cap.actualBoundingBoxDescent) / 2;
    const firstAxis = firstRect.top - box.top + ascent - midCap;
    const lastAxis = lastRect.top - box.top + ascent - midCap;
    const openingX = firstRect.left - box.left - asset.leftSlot[0] * openingScale;
    const openingY = firstAxis - asset.leftSlot[1] * openingScale;
    const closingX = lastRect.right - box.left + gap - asset.right[0] * closingScale;
    const closingY = lastAxis - asset.rightJoin[1] * closingScale;
    paintArt(sample.querySelector('.opening'), asset, asset.left, openingScale, openingX, openingY);
    paintArt(sample.querySelector('.closing'), asset, asset.right, closingScale, closingX, closingY);
    const leftJoin = [openingX + asset.leftJoin[0] * openingScale, openingY + asset.leftJoin[1] * openingScale];
    const rightJoin = [closingX + asset.rightJoin[0] * closingScale, closingY + asset.rightJoin[1] * closingScale];
    const thickness = Math.min(2, asset.leftSafeHalfHeight * openingScale * 1.25, asset.rightSafeHalfHeight * closingScale * 1.25);
    sample.style.setProperty('--rule-thickness', `${thickness}px`);
    Object.assign(sample.querySelector('.start-line').style, {left:'0px', top:`${leftJoin[1] - thickness / 2}px`, width:`${Math.max(0, leftJoin[0])}px`});
    Object.assign(sample.querySelector('.end-line').style, {left:`${rightJoin[0]}px`, top:`${rightJoin[1] - thickness / 2}px`, width:`${Math.max(0, sample.clientWidth - rightJoin[0])}px`});
    sample.dataset.joins = JSON.stringify({left:leftJoin, right:rightJoin, thickness});
  }
}
[field, typeface, size, narrow].forEach(control => control.addEventListener('input', update));
new ResizeObserver(fit).observe(root);
document.fonts.addEventListener('loadingdone', fit);
document.fonts.ready.then(fit);
update();
