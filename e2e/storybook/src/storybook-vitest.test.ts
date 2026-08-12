import {
  checkFilesExist,
  cleanupProject,
  ensurePlaywrightBrowsersInstallation,
  newProject,
  readFile,
  readJson,
  runCLI,
  uniq,
} from '@nx/e2e-utils';

describe('Storybook story testing with the Vitest addon', () => {
  const reactViteApp = uniq('react-vite-app');

  beforeAll(async () => {
    newProject({ packages: ['@nx/react'] });
    runCLI(
      `generate @nx/react:app ${reactViteApp} --bundler=vite --unitTestRunner=vitest --no-interactive`
    );
    runCLI(
      `generate @nx/react:storybook-configuration ${reactViteApp} --generateStories --no-interactive`
    );
    await ensurePlaywrightBrowsersInstallation();
  });

  afterAll(() => {
    cleanupProject();
  });

  it('should generate the addon wiring and install its runner', () => {
    checkFilesExist(`${reactViteApp}/vitest.storybook.config.mts`);
    expect(readFile(`${reactViteApp}/.storybook/main.ts`)).toContain(
      '@storybook/addon-vitest'
    );

    // The reported bug: nothing installed a story runner, so the inferred
    // target was resolving against a package that was never there.
    const { devDependencies } = readJson('package.json');
    expect(devDependencies['@storybook/addon-vitest']).toBeDefined();
    expect(devDependencies['@vitest/browser']).toBeDefined();
  });

  it('should infer a test-storybook target that runs the stories', () => {
    const project = JSON.parse(runCLI(`show project ${reactViteApp} --json`));
    expect(project.targets['test-storybook']).toBeDefined();

    const output = runCLI(`run ${reactViteApp}:test-storybook`);
    expect(output).toContain(
      `Successfully ran target test-storybook for project ${reactViteApp}`
    );
  }, 600_000);
});
