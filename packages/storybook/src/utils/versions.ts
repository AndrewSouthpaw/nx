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

export const testRunnerVersion = '^0.24.0';

// addon-vitest publishes no 8.x, and on 9 its vitest 4 support only landed in 9.1.20.
export const minStorybookMajorForVitestAddon = 10;

// addon-vitest peers the exact storybook version, so it tracks what the workspace declares.
export function addonVitestVersion(tree: Tree): string {
  return getInstalledStorybookVersion(tree) ?? storybookVersion;
}

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
