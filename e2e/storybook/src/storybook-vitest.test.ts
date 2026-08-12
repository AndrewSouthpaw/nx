import {
  cleanupProject,
  newProject,
  readJson,
  runCLI,
  uniq,
  updateJson,
} from '@nx/e2e-utils';

describe('Storybook story testing runners', () => {
  const viteApp = uniq('react-vite-app');
  const webpackApp = uniq('react-webpack-app');
  const storybook9App = uniq('react-sb9-app');

  beforeAll(() => {
    newProject({ packages: ['@nx/react'] });
  });

  afterAll(() => {
    cleanupProject();
  });

  function testStorybookTarget(project: string) {
    return JSON.parse(runCLI(`show project ${project} --json`)).targets[
      'test-storybook'
    ];
  }

  it('should install the vitest addon and infer test-storybook for vite frameworks', () => {
    runCLI(
      `generate @nx/react:app ${viteApp} --bundler=vite --unitTestRunner=vitest --no-interactive`,
      { timeout: 900_000 }
    );
    runCLI(
      `generate @nx/react:storybook-configuration ${viteApp} --generateStories --no-interactive`,
      { timeout: 900_000 }
    );

    // #33759: the flag configured a runner but installed nothing, so the plugin
    // had no package to key the target off and it never appeared.
    expect(
      readJson('package.json').devDependencies['@storybook/addon-vitest']
    ).toBeDefined();
    expect(testStorybookTarget(viteApp).command).toContain(
      'vitest run --project=storybook'
    );
  }, 1_200_000);

  it('should install the test runner and infer test-storybook for webpack frameworks', () => {
    runCLI(
      `generate @nx/react:app ${webpackApp} --bundler=webpack --unitTestRunner=none --no-interactive`,
      { timeout: 900_000 }
    );
    runCLI(
      `generate @nx/react:storybook-configuration ${webpackApp} --generateStories --no-interactive --bundler=webpack`,
      { timeout: 900_000 }
    );

    expect(
      readJson('package.json').devDependencies['@storybook/test-runner']
    ).toBeDefined();
    expect(testStorybookTarget(webpackApp).command).toContain('test-storybook');
  }, 1_200_000);

  it('should keep the test runner on storybook 9 even for vite frameworks', () => {
    // The addon publishes no version that pairs with storybook 9 and the vitest
    // major Nx installs, so 9 stays on the test runner.
    updateJson('package.json', (json) => {
      json.devDependencies['storybook'] = '9.1.15';
      return json;
    });
    runCLI(
      `generate @nx/react:app ${storybook9App} --bundler=vite --unitTestRunner=none --no-interactive`,
      { timeout: 900_000 }
    );
    runCLI(
      `generate @nx/react:storybook-configuration ${storybook9App} --generateStories --no-interactive`,
      { timeout: 900_000 }
    );

    expect(testStorybookTarget(storybook9App).command).toContain(
      'test-storybook'
    );
    expect(testStorybookTarget(storybook9App).command).not.toContain('vitest');
  }, 1_200_000);
});
