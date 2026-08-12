/**
 * Config the `@storybook/addon-vitest` setup runs through, written at the
 * project root. Deliberately not named `vitest.config.*`: that would be matched
 * by `@nx/vitest`'s inference glob and by the root aggregator's `test.projects`,
 * which would fold the browser-mode story run into the project's `test` target.
 */
export const storybookVitestConfigFileName = 'vitest.storybook.config.mts';
