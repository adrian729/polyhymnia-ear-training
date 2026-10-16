const root = document.getElementById('directions');
const concepts = [
  ['A', 'Low garland', 'A continuous painted bough supports the words from below.', 'garland'],
  ['B', 'Folded scroll', 'The heading sits on a banderole, with acanthus growing from its folds.', 'scroll'],
  ['C', 'Marginal bouquet', 'One strong leaf cluster opens a rule beneath the heading.', 'bouquet'],
  ['D', 'Illuminated panel', 'A fine gold enclosure with foliage concentrated at opposite corners.', 'panel'],
];
const band = '<span class="band" aria-hidden="true"></span>';
function sample(kind, editable) {
  const h = `<h3 class="lettering" ${editable ? 'data-editable' : ''}>${editable ? 'Intervals and harmony' : 'Exercises'}</h3>`;
  let content;
  if (kind === 'garland') content = `${h}<div class="garland-row" aria-hidden="true">${band}<img src="./assets/low-garland.webp" width="2172" height="724" alt="">${band}</div>`;
  if (kind === 'scroll' || kind === 'panel') content = `${band}<div class="writing">${h}</div>${band}`;
  if (kind === 'bouquet') content = `${band}<img src="./assets/marginal-bouquet.webp" width="1218" height="1291" alt="">${h}`;
  return `<div class="specimen"><div class="sample ${kind}">${content}</div></div>`;
}
document.getElementById('comparison').innerHTML = concepts.map(([letter, name, description, kind]) => `<article class="direction" aria-label="${name}"><header><h2><span>${letter}</span>${name}</h2><p class="description">${description}</p></header>${sample(kind, false)}${sample(kind, true)}</article>`).join('');
const fonts = {display:'var(--font-display)', junicode:'"Junicode VF", serif', garamond:'"EB Garamond Variable", serif', sans:'system-ui, sans-serif'};
const field = document.getElementById('sample-text');
const typeface = document.getElementById('typeface');
const size = document.getElementById('type-size');
const narrow = document.getElementById('narrow');
function update() {
  root.querySelectorAll('[data-editable]').forEach(el => {el.textContent = field.value || 'Exercises';});
  root.style.setProperty('--study-font', fonts[typeface.value]);
  root.style.setProperty('--study-size', `${size.value}px`);
  root.classList.toggle('narrow', narrow.checked);
  fitGarlands();
}
function fitGarlands() {
  root.querySelectorAll('.garland').forEach(el => {
    const title = el.querySelector('.lettering');
    const range = document.createRange();
    range.selectNodeContents(title);
    const textWidth = range.getBoundingClientRect().width;
    const width = Math.min(360, el.clientWidth * .86, Math.max(240, textWidth + 110));
    el.style.setProperty('--garland-width', `${width}px`);
  });
}
[field, typeface, size, narrow].forEach(control => control.addEventListener('input', update));
new ResizeObserver(fitGarlands).observe(root);
document.fonts.addEventListener('loadingdone', fitGarlands);
document.fonts.ready.then(fitGarlands);
update();
