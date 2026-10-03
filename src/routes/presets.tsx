import type { ReactNode } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import type { ScaleName } from '@polyhymnia/music-theory';
import { NotesReveal } from '@/components/presets/NotesReveal';
import { ScaleReveal } from '@/components/presets/ScaleReveal';
import { PaperSheet } from '@/components/PaperSheet';

export const Route = createFileRoute('/presets')({
  component: PresetsPage,
});

interface Chord {
  title: string;
  caption: string;
  pitches: readonly string[];
  clef: 'treble' | 'bass';
  duration?: 'whole' | 'half';
}

const CHORDS: readonly Chord[] = [
  { title: 'C major triad', caption: 'NotesReveal, treble', pitches: ['C4', 'E4', 'G4'], clef: 'treble' },
  {
    title: 'G dominant 7th',
    caption: 'NotesReveal, bass, seconds shifted across the stem',
    pitches: ['G2', 'B2', 'D3', 'F3'],
    clef: 'bass',
    duration: 'whole',
  },
  {
    title: 'Db major 7th',
    caption: 'NotesReveal, accidentals packed into columns',
    pitches: ['Db4', 'F4', 'Ab4', 'C5'],
    clef: 'treble',
    duration: 'half',
  },
];

interface Interval {
  title: string;
  caption: string;
  pitches: readonly string[];
  clef: 'treble' | 'bass';
  mode: 'melodic' | 'harmonic';
}

const INTERVALS: readonly Interval[] = [
  {
    title: 'Major 3rd, harmonic',
    caption: 'NotesReveal, both pitches on one stem',
    pitches: ['C4', 'E4'],
    clef: 'treble',
    mode: 'harmonic',
  },
  {
    title: 'Major 6th, melodic',
    caption: 'NotesReveal, two successive beats',
    pitches: ['C4', 'A4'],
    clef: 'treble',
    mode: 'melodic',
  },
  { title: 'Tritone, harmonic', caption: 'F2 to B2, bass clef', pitches: ['F2', 'B2'], clef: 'bass', mode: 'harmonic' },
  {
    title: 'Descending minor 6th',
    caption: 'NotesReveal, melodic, high to low',
    pitches: ['A4', 'C4'],
    clef: 'treble',
    mode: 'melodic',
  },
];

interface Scale {
  title: string;
  caption: string;
  root: string;
  scale: ScaleName;
  clef: 'treble' | 'bass';
  descending?: boolean;
}

const SCALES: readonly Scale[] = [
  { title: 'C major', caption: 'ScaleReveal, root C4, ascending', root: 'C4', scale: 'major', clef: 'treble' },
  { title: 'Eb major', caption: 'Key signature of three flats', root: 'Eb4', scale: 'major', clef: 'treble' },
  { title: 'A natural minor', caption: 'No accidentals', root: 'A3', scale: 'naturalMinor', clef: 'treble' },
  {
    title: 'A harmonic minor',
    caption: 'Raised 7th only',
    root: 'A3',
    scale: 'harmonicMinor',
    clef: 'treble',
  },
  {
    title: 'A melodic minor, ascending',
    caption: 'Raised 6th and 7th',
    root: 'A3',
    scale: 'melodicMinor',
    clef: 'treble',
  },
  {
    title: 'A melodic minor, descending',
    caption: 'Natural-minor pitches, not the ascending notes reversed',
    root: 'A3',
    scale: 'melodicMinor',
    clef: 'treble',
    descending: true,
  },
  {
    title: 'D major, descending, bass clef',
    caption: 'The same pitches, reversed',
    root: 'D2',
    scale: 'major',
    clef: 'bass',
    descending: true,
  },
];

function PresetsPage() {
  return (
    <PaperSheet className="flex flex-col gap-loose px-base py-loose">
      <h1 className="text-title">Notation presets</h1>
      <Section title="Chords">
        {CHORDS.map((c) => (
          <Demo key={c.title} title={c.title} caption={c.caption}>
            <NotesReveal
              pitches={c.pitches}
              mode="harmonic"
              clef={c.clef}
              duration={c.duration && { base: c.duration }}
            />
          </Demo>
        ))}
      </Section>
      <Section title="Intervals">
        {INTERVALS.map((i) => (
          <Demo key={i.title} title={i.title} caption={i.caption}>
            <NotesReveal pitches={i.pitches} mode={i.mode} clef={i.clef} />
          </Demo>
        ))}
      </Section>
      <Section title="Scales">
        {SCALES.map((s) => (
          <Demo key={s.title} title={s.title} caption={s.caption}>
            <ScaleReveal root={s.root} scale={s.scale} clef={s.clef} descending={s.descending} />
          </Demo>
        ))}
      </Section>
    </PaperSheet>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading">{title}</h2>
      {children}
    </section>
  );
}

function Demo({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption>
        <span className="font-medium">{title}</span> <span className="text-muted-foreground">{caption}</span>
      </figcaption>
      {children}
    </figure>
  );
}
