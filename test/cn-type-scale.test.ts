import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

// The compiled tables read the theme's --text-* scale, so a size never deletes a text colour.
describe('cn type scale', () => {
  it('keeps a text color when a type scale size is merged after it', () => {
    expect(cn('bg-primary text-primary-foreground text-meta')).toContain('text-primary-foreground');
    expect(cn('bg-card text-card-foreground text-body')).toContain('text-card-foreground');
    expect(cn('bg-muted text-muted-foreground text-heading')).toContain('text-muted-foreground');
  });

  it('still resolves same-group conflicts in both directions', () => {
    expect(cn('text-sm text-meta')).toBe('text-meta');
    expect(cn('text-muted-foreground text-foreground')).toBe('text-foreground');
  });
});
