import type { CnFunction } from 'cn';
import { createCn } from 'cn/engine';
import tables from '@/generated/cn-tables.mjs';

/** The one `cn`: tables compiled at build time from the app's classes and theme (scripts/cn-tables.ts). */
export const cn: CnFunction = createCn(tables);
