import { imageAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';
import { OrnamentImage } from '@/components/OrnamentImage';
import decorations from '@/generated/assets/decorations';

const START = imageAsset(decorations, 'acanthus-divider-start');
const CENTRE = imageAsset(decorations, 'acanthus-divider-centre');
const END = imageAsset(decorations, 'acanthus-divider-end');
const FLEURON = imageAsset(decorations, 'acanthus-section-fleuron');

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
