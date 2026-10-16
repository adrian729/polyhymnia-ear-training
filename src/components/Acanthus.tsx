import { useLayoutEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { imageAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';
import { OrnamentImage } from '@/components/OrnamentImage';
import decorations from '@/generated/assets/decorations';

const START = imageAsset(decorations, 'acanthus-divider-start');
const CENTRE = imageAsset(decorations, 'acanthus-divider-centre');
const END = imageAsset(decorations, 'acanthus-divider-end');
const FLEURON = imageAsset(decorations, 'acanthus-section-fleuron');
const TITLE_IVY = imageAsset(decorations, 'acanthus-title-ivy');
const FLOURISHES = TITLE_IVY.titleFlourishes!;

/** The illuminated acanthus divider: painted terminals and centrepiece joined by rules (`acanthus-rule`).
 *  `flipEnds` mirrors the terminals top to bottom. */
export function AcanthusRule({ placement, flipEnds = false, className }: { placement: 'above-fold' | 'below-fold'; flipEnds?: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('acanthus-rule', flipEnds && 'acanthus-rule-flipped', className)}>
      <span className="acanthus-rule-line" />
      <span className="acanthus-rule-line" />
      <OrnamentImage asset={START} sizes="(min-width: 40rem) 3.5rem, 2.75rem" placement={placement} className="acanthus-rule-piece acanthus-rule-start" />
      <OrnamentImage asset={CENTRE} sizes="(min-width: 40rem) 5.25rem, 4.125rem" placement={placement} className="acanthus-rule-piece acanthus-rule-centre" />
      <OrnamentImage asset={END} sizes="(min-width: 40rem) 3.5rem, 2.75rem" placement={placement} className="acanthus-rule-piece acanthus-rule-end" />
    </div>
  );
}

/** The section fleuron that closes a page, drawn 10rem wide (12rem from `sm`). */
export function AcanthusFleuron({ className }: { className?: string }) {
  return <OrnamentImage asset={FLEURON} sizes="(min-width: 40rem) 12rem, 10rem" placement="below-fold" className={cn('mx-auto h-auto w-40 sm:w-48', className)} />;
}

/** The opening curl follows the first letter; the smaller sprig follows the last, even when
 *  the heading wraps. Both keep their proportions, with rules tucked beneath their gold caps. */
export function AcanthusTitle({ as: Tag = 'h2', id, placement, children, className, textClassName }: {
  as?: ElementType;
  id?: string;
  placement: 'above-fold' | 'below-fold';
  children: ReactNode;
  className?: string;
  textClassName?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLElement>(null);
  const [imageWidths, setImageWidths] = useState([167, 146]);

  useLayoutEffect(() => {
    const rule = root.current!;
    const heading = text.current!;
    const opening = rule.querySelector<HTMLElement>('.acanthus-title-opening')!;
    const closing = rule.querySelector<HTMLElement>('.acanthus-title-closing')!;
    const startLine = rule.querySelector<HTMLElement>('.acanthus-title-line-start')!;
    const endLine = rule.querySelector<HTMLElement>('.acanthus-title-line-end')!;
    const startTerminal = rule.querySelector<HTMLElement>('.acanthus-title-terminal-start')!;
    const context = document.createElement('canvas').getContext('2d')!;
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const { opening: left, closing: right } = FLOURISHES;

    const paint = (element: HTMLElement, bounds: readonly number[], scale: number, x: number, y: number) => {
      // Keep the complete leaf tips and their antialiasing inside the transparent window.
      const [l, t, r, b] = bounds;
      Object.assign(element.style, {
        left: `${x + (l - 3) * scale}px`, top: `${y + (t - 3) * scale}px`,
        width: `${(r - l + 6) * scale}px`, height: `${(b - t + 6) * scale}px`,
      });
      Object.assign(element.querySelector('img')!.style, {
        width: `${TITLE_IVY.width * scale}px`, left: `${-(l - 3) * scale}px`, top: `${-(t - 3) * scale}px`,
      });
    };

    const fit = () => {
      if (!rule.clientWidth) return;
      const style = getComputedStyle(heading);
      const fontSize = parseFloat(style.fontSize);
      const terminalWidth = startTerminal.getBoundingClientRect().width;
      const thickness = terminalWidth * .08;
      const available = rule.clientWidth - terminalWidth * (0.735 + 0.705) - 12;
      const gap = fontSize * .16;

      // Measure an unwrapped copy so the hanging indent cannot change the wrapping decision.
      const probe = heading.cloneNode(true) as HTMLElement;
      for (const element of [probe, ...probe.querySelectorAll('[id]')]) element.removeAttribute('id');
      probe.setAttribute('aria-hidden', 'true');
      Object.assign(probe.style, {
        position: 'absolute', visibility: 'hidden', width: 'max-content', maxWidth: 'none',
        padding: '0', textIndent: '0', whiteSpace: 'nowrap',
      });
      rule.append(probe);
      const naturalWidth = probe.getBoundingClientRect().width;
      probe.remove();
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const longestWord = Math.max(0, ...(heading.textContent?.match(/\S+/gu) ?? []).map(word => context.measureText(word).width));

      // Keep the original outer terminals and rule width. Only the new middle painting becomes
      // more compact when necessary to leave room for the text; never stretch or hide the ends.
      const minimumArtSize = Math.max(
        thickness * (left.bounds[3] - left.bounds[1]) / (2 * left.safeHalfHeight * 3.25),
        thickness * (right.bounds[3] - right.bounds[1]) / (2 * right.safeHalfHeight * 1.2),
      ) * 1.05;
      let artSize = rule.clientWidth < 360 ? Math.min(fontSize, 21) : fontSize;
      const reserves = (size: number) => {
        const openingScale = 3.25 * size / (left.bounds[3] - left.bounds[1]);
        const closingScale = 1.2 * size / (right.bounds[3] - right.bounds[1]);
        const clearance = Math.max(0, fontSize - size) * .5;
        return {
          openingScale, closingScale, clearance,
          left: (left.text[0] - left.bounds[0]) * openingScale + clearance + 5,
          right: (right.bounds[2] - right.bounds[0]) * closingScale + gap + 5,
          overhang: Math.max(0, (left.bounds[2] - left.text[0]) * openingScale - clearance) + 4,
        };
      };
      while (artSize > minimumArtSize) {
        const r = reserves(artSize);
        if (r.left + r.right + Math.min(naturalWidth, longestWord + r.overhang) <= available) break;
        artSize = Math.max(minimumArtSize, artSize - .5);
      }
      const fitted = reserves(artSize);
      const { openingScale, closingScale, clearance: initialClearance } = fitted;
      rule.style.setProperty('--acanthus-opening-reserve', `${fitted.left}px`);
      rule.style.setProperty('--acanthus-closing-reserve', `${fitted.right}px`);
      rule.style.setProperty('--acanthus-initial-overhang', `${fitted.overhang}px`);
      rule.dataset.multiline = String(naturalWidth > available - fitted.left - fitted.right + .5);

      // Text nodes allow a title to contain emphasis/spans without losing its edge letters.
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.textContent?.trim()) nodes.push(node as Text);
      }
      rule.dataset.empty = String(!nodes.length);
      if (!nodes.length) return;
      const edge = (node: Text, last: boolean) => {
        const graphemes = [...segmenter.segment(node.data)].filter(part => part.segment.trim());
        const glyph = (last ? graphemes.at(-1) : graphemes[0])!;
        const range = document.createRange();
        range.setStart(node, glyph.index);
        range.setEnd(node, glyph.index + glyph.segment.length);
        const rect = range.getBoundingClientRect();
        const face = getComputedStyle(node.parentElement!);
        context.font = `${face.fontStyle} ${face.fontWeight} ${face.fontSize} ${face.fontFamily}`;
        const cap = context.measureText('H');
        const baseline = rect.top + (cap.fontBoundingBoxAscent ?? rect.height * .8);
        return { rect, axis: baseline - (cap.actualBoundingBoxAscent - cap.actualBoundingBoxDescent) / 2 };
      };
      const first = edge(nodes[0], false);
      const last = edge(nodes.at(-1)!, true);
      const box = rule.getBoundingClientRect();
      const openingX = first.rect.left - box.left - left.text[0] * openingScale - initialClearance;
      const openingY = first.axis - box.top - left.text[1] * openingScale;
      const closingX = last.rect.right - box.left + gap - right.bounds[0] * closingScale;
      const closingY = last.axis - box.top - right.join[1] * closingScale;
      paint(opening, left.bounds, openingScale, openingX, openingY);
      paint(closing, right.bounds, closingScale, closingX, closingY);

      // Stop each line inside opaque gold, before any transparent fork in the painted stem.
      const startX = openingX + left.join[0] * openingScale;
      const endX = closingX + right.join[0] * closingScale;
      rule.style.setProperty('--acanthus-start-axis', `${first.axis - box.top}px`);
      rule.style.setProperty('--acanthus-end-axis', `${last.axis - box.top}px`);
      Object.assign(startLine.style, {
        left: `${terminalWidth * .735}px`,
        width: `${Math.max(0, startX - terminalWidth * .735)}px`, height: `${thickness}px`,
        top: `${openingY + left.join[1] * openingScale - thickness / 2}px`,
      });
      Object.assign(endLine.style, {
        left: `${endX}px`, width: `${Math.max(0, rule.clientWidth - terminalWidth * .705 - endX)}px`, height: `${thickness}px`,
        top: `${closingY + right.join[1] * closingScale - thickness / 2}px`,
      });
      const widths = [Math.ceil(TITLE_IVY.width * openingScale), Math.ceil(TITLE_IVY.width * closingScale)];
      setImageWidths(current => current.every((width, i) => width === widths[i]) ? current : widths);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(rule);
    observer.observe(heading);
    document.fonts.addEventListener('loadingdone', fit);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', fit);
    };
  }, [children, textClassName, className, Tag]);

  return (
    <div ref={root} className={cn('acanthus-title font-display text-subhead text-primary-strong', textClassName, className)}>
      <OrnamentImage asset={START} sizes="(min-width: 40rem) 3.5rem, 2.75rem" placement={placement} className="acanthus-title-terminal acanthus-title-terminal-start" />
      <span aria-hidden="true" className="acanthus-band acanthus-title-line acanthus-title-line-start" />
      <span aria-hidden="true" className="acanthus-title-art acanthus-title-opening">
        <OrnamentImage asset={TITLE_IVY} sizes={`${imageWidths[0]}px`} placement={placement} />
      </span>
      <div className="acanthus-title-space">
        <Tag ref={text} id={id} className="acanthus-title-text">{children}</Tag>
      </div>
      <span aria-hidden="true" className="acanthus-title-art acanthus-title-closing">
        <OrnamentImage asset={TITLE_IVY} sizes={`${imageWidths[1]}px`} placement={placement} />
      </span>
      <span aria-hidden="true" className="acanthus-band acanthus-title-line acanthus-title-line-end" />
      <OrnamentImage asset={END} sizes="(min-width: 40rem) 3.5rem, 2.75rem" placement={placement} className="acanthus-title-terminal acanthus-title-terminal-end" />
    </div>
  );
}
