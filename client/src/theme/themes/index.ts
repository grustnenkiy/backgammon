import type { Theme } from '../Theme';
import { classicTheme } from './classic';
import { fairytaleTheme } from './fairytale';
import { pixelTheme } from './pixel';

export { classicTheme } from './classic';
export { fairytaleTheme } from './fairytale';
export { pixelTheme } from './pixel';

export const themes: Theme[] = [classicTheme, pixelTheme, fairytaleTheme];
