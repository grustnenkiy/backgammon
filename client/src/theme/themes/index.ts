import type { Theme } from '../Theme';
import { classicTheme } from './classic';
import { pixelTheme } from './pixel';

export { classicTheme } from './classic';
export { pixelTheme } from './pixel';

export const themes: Theme[] = [classicTheme, pixelTheme];
