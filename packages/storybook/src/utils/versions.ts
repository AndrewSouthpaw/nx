import { getDependencyVersionFromPackageJson, type Tree } from '@nx/devkit';
import { coerce, major, subset } from 'semver';
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

// Story testing.
export const testRunnerVersion = '^0.24.0';
export const vitestVersion = '~4.1.0';
export const playwrightVersion = '^1.36.0';

// `@storybook/addon-vitest` publishes no 8.x, and on Storybook 9 its vitest 4
// support only landed in 9.1.20, so a 9.0.x workspace would need a storybook
// bump as well. Storybook 8 and 9 keep the test runner.
export const minStorybookMajorForVitestAddon = 10;

// Storybook 10.3 made the addon provision preview annotations itself. A setup
// file calling `setProjectAnnotations` turns that off and prints a notice asking
// for its removal, so only emit one when the range can't reach 10.3.
const storybookVersionProvidingProjectAnnotations = '10.3.0';

/**
 * Story-testing dependencies for the vitest addon.
 *
 * `@storybook/addon-vitest` is versioned with Storybook and peers the exact
 * storybook version, so it has to track whatever the workspace declares rather
 * than a range of our own. `@vitest/browser` and `@vitest/browser-playwright`
 * peer vitest *exactly* (`@vitest/browser@4.1.10` peers `vitest: 4.1.10`), so
 * they have to track the declared vitest version for the same reason.
 */
export function storyTestVitestDependencies(
  tree: Tree
): Record<string, string> {
  const vitest = declaredVitestVersion(tree) ?? vitestVersion;
  const dependencies: Record<string, string> = {
    '@storybook/addon-vitest':
      getInstalledStorybookVersion(tree) ?? storybookVersion,
    vitest,
    '@vitest/browser': vitest,
    playwright: playwrightVersion,
  };

  // Vitest 4 moved the playwright provider out into its own package.
  if (vitestMajorToInstall(tree) >= 4) {
    dependencies['@vitest/browser-playwright'] = vitest;
  }

  return dependencies;
}

/**
 * Whether the generated storybook vitest setup still has to call
 * `setProjectAnnotations` itself. False once any version the declared range
 * allows provisions them automatically.
 */
export function needsProjectAnnotationsSetup(tree: Tree): boolean {
  const declared = getInstalledStorybookVersion(tree);
  if (!declared) {
    return false;
  }
  try {
    return subset(declared, `<${storybookVersionProvidingProjectAnnotations}`, {
      loose: true,
    });
  } catch {
    // Unparseable declarations (`catalog:`, `workspace:`) resolve to whatever
    // the workspace pins, which for a supported setup is the latest.
    return false;
  }
}

function declaredVitestVersion(tree: Tree): string | undefined {
  const declared = getDependencyVersionFromPackageJson(tree, 'vitest');
  // A declaration we can't read can't be matched by the browser packages either.
  return declared && coerce(declared) ? declared : undefined;
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
