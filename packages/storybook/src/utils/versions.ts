import { getDependencyVersionFromPackageJson, type Tree } from '@nx/devkit';
import { coerce, major } from 'semver';
import { join } from 'path';

export const nxVersion = require(join('@nx/storybook', 'package.json')).version;
export const litVersion = '^2.6.1';
export const tsNodeVersion = '10.9.1';
export const tsLibVersion = '^2.3.0';

export const minSupportedStorybookVersion = '8.0.0';

// Fresh-install default. Latest supported major.
export const storybookVersion = '^10.5.0';
export const reactVersion = '^18.2.0';
export const viteVersion = '^6.0.0';

export const coreJsVersion = '^3.36.1';

// Story testing. `@storybook/addon-vitest` is versioned with Storybook, so it
// installs at the resolved storybook version rather than a constant of its own.
export const testRunnerVersion = '^0.24.0';
export const vitestVersion = '~4.1.0';
export const playwrightVersion = '^1.36.0';

/**
 * `@vitest/browser` tracks vitest's major, and vitest 4 moved the playwright
 * provider out into `@vitest/browser-playwright`.
 */
export function vitestBrowserDependencies(
  vitestMajor: number
): Record<string, string> {
  if (vitestMajor === 3) {
    return { '@vitest/browser': '^3.0.0', playwright: playwrightVersion };
  }
  return {
    '@vitest/browser': '~4.1.0',
    '@vitest/browser-playwright': '~4.1.0',
    playwright: playwrightVersion,
  };
}

// The Vitest addon replaced the test runner in Storybook 10. Earlier majors
// keep the test runner: `@storybook/addon-vitest@9` peers vitest ^3 only, which
// conflicts with the vitest 4 that Nx installs by default.
export const minStorybookMajorForVitestAddon = 10;

type StorybookVersions = {
  storybookVersion: string;
  // Each test runner major only peers a narrow window of storybook majors.
  testRunnerVersion: string;
};

const latestVersions: StorybookVersions = {
  storybookVersion,
  testRunnerVersion,
};

type CompatVersions = 8 | 9 | 10;
const versionMap: Record<CompatVersions, StorybookVersions> = {
  8: { storybookVersion: '^8.6.11', testRunnerVersion: '^0.21.0' },
  9: { storybookVersion: '^9.0.5', testRunnerVersion: '^0.23.0' },
  10: { storybookVersion: '^10.5.0', testRunnerVersion },
};

export function versions(tree: Tree): StorybookVersions {
  const installedStorybookMajor = storybookMajorVersion(tree);
  if (installedStorybookMajor === undefined) {
    return latestVersions;
  }
  return (
    versionMap[installedStorybookMajor as CompatVersions] ?? latestVersions
  );
}

/** The vitest major a generator should configure for: the installed one, or the one it installs. */
export function vitestMajorToInstall(tree: Tree): number {
  const declared = getDependencyVersionFromPackageJson(tree, 'vitest');
  const coerced = declared ? coerce(declared) : undefined;
  return coerced ? major(coerced) : major(coerce(vitestVersion));
}

/** The storybook major a generator should configure for: the installed one, or the one it installs. */
export function storybookMajorToInstall(tree: Tree): number {
  return storybookMajorVersion(tree) ?? major(coerce(storybookVersion));
}

export function storybookMajorVersion(tree?: Tree): number | undefined {
  const installedVersion = getInstalledStorybookVersion(tree);
  if (!installedVersion) {
    return undefined;
  }
  const coerced = coerce(installedVersion);
  return coerced ? major(coerced) : undefined;
}

export function getInstalledStorybookVersion(tree?: Tree): string | undefined {
  if (tree) {
    const declared = getDependencyVersionFromPackageJson(tree, 'storybook');
    if (declared) {
      return declared;
    }
  }

  // Fall back to resolving from disk when no tree declaration is available.
  try {
    return require(join('storybook', 'package.json')).version;
  } catch {
    return undefined;
  }
}
