import type { ReactNode } from 'react';
import { NearView } from '@/components/NearView';

export interface LazyRevealProps<Q> {
  question: Q;
  renderReveal: (question: Q) => ReactNode;
  placeholder: ReactNode;
}

export function LazyReveal<Q>({ question, renderReveal, placeholder }: LazyRevealProps<Q>) {
  return (
    <NearView placeholder={placeholder} className="flex w-full flex-col items-center gap-4">
      {renderReveal(question)}
    </NearView>
  );
}
