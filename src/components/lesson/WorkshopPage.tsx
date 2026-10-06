import type { ReactNode } from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { InstrumentSelect } from '@/components/custom/InstrumentSelect';
import type { HelpSection, LessonResult, OverviewSection } from '@/exercises/shared';
import { TitleText } from '@/components/Initial';
import { Ornament } from '@/components/Ornament';
import { Sheet } from '@/components/SheetLayout';
import { ExerciseMasthead } from './ExerciseMasthead';
import { WorkshopAside } from './WorkshopAside';
import { LessonLinkTile, ModuleCard, OverviewHelpPopover } from './LessonListParts';

export function WorkshopPage({
  title,
  blurb,
  overview,
  modules,
  lessonsForModule,
  getLessonResult,
  renderLessonLink,
  headerAction,
  soundControls = <InstrumentSelect />,
}: {
  title: string;
  blurb: string;
  overview: readonly OverviewSection[];
  modules: readonly { id: string; title: string; help: readonly HelpSection[] }[];
  lessonsForModule: (moduleId: string) => readonly { id: string; title: string }[];
  getLessonResult: (lessonId: string) => LessonResult | undefined;
  renderLessonLink: (lessonId: string, className: string, children: ReactNode) => ReactNode;
  headerAction?: ReactNode;
  soundControls?: ReactNode;
}) {
  return (
    <Sheet className="flex flex-col gap-loose py-loose" aside={<WorkshopAside modules={modules} />} label={`${title} lessons`}>
      {/* Wide screens show it atop the sidebar; stacked, the sidebar starts rolled up. */}
      <nav aria-label="Breadcrumb" className="lg:hidden"><ExerciseMasthead /></nav>
      <div className="flex flex-col gap-tight">
        <div className="flex flex-wrap items-center justify-between gap-base">
          <div className="flex min-w-0 items-center gap-1">
            <h1 className="font-display text-title text-primary-strong">
              <TitleText title={title} />
            </h1>
            <OverviewHelpPopover ariaLabel={`About ${title}`} sections={overview} />
          </div>
          {soundControls}
        </div>
        <p className="max-w-[64ch] text-body text-muted-foreground">{blurb}</p>
      </div>

      {headerAction}

      <div className="flex flex-col gap-base">
        {modules.map((mod, index) => (
          <ModuleCard key={mod.id} id={mod.id} title={mod.title} help={mod.help} lead={index === 0}>
            {lessonsForModule(mod.id).map((lesson) => (
              <LessonLinkTile
                key={lesson.id}
                title={lesson.title}
                result={getLessonResult(lesson.id)}
                render={(className, children) => renderLessonLink(lesson.id, className, children)}
              />
            ))}
          </ModuleCard>
        ))}
        <Ornament name="tailpiece" className="mx-auto mt-loose size-14 text-primary-strong" />
      </div>
    </Sheet>
  );
}

export function LessonNotFound({ backTo }: { backTo: LinkProps['to'] }) {
  return (
    <Sheet size="message" className="flex flex-col items-center gap-base px-base py-section text-center">
      <p>Lesson not found.</p>
      <Button asChild>
        <Link to={backTo}>Back to lessons</Link>
      </Button>
    </Sheet>
  );
}
