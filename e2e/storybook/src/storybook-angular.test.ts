import {
  checkFilesDoNotExist,
  checkFilesExist,
  cleanupProject,
  killPorts,
  newProject,
  readJson,
  reservePort,
  runCLI,
  runCommandUntil,
  uniq,
} from '@nx/e2e-utils';

describe('Storybook executors for Angular', () => {
  const angularStorybookLib = uniq('test-ui-ng-lib');
  beforeAll(() => {
    newProject({
      packages: ['@nx/angular'],
    });
    runCLI(`g @nx/angular:library ${angularStorybookLib} --no-interactive`);
    runCLI(
      `generate @nx/angular:storybook-configuration ${angularStorybookLib} --generateStories --no-interactive`
    );
  });

  afterAll(() => {
    cleanupProject();
  });

  it('should set up the test runner rather than the vitest addon', () => {
    // Angular libraries carry a vite.config for their unit tests, but Storybook
    // still builds them with webpack.
    checkFilesDoNotExist(`${angularStorybookLib}/vitest.storybook.config.mts`);

    const project = readJson(`${angularStorybookLib}/project.json`);
    expect(project.targets['test-storybook'].options.command).toContain(
      'test-storybook -c'
    );
    expect(
      readJson('package.json').devDependencies['@storybook/test-runner']
    ).toBeDefined();
  });

  describe('serve and build storybook', () => {
    let storybookPort: number;
    afterAll(() => storybookPort && killPorts(storybookPort));

    // TODO(NXC-4690): re-enable when @storybook/angular peers resolve on Angular 22 + TS 6 workspaces
    it.skip('should serve an Angular based Storybook setup', async () => {
      storybookPort = await reservePort();
      const p = await runCommandUntil(
        `run ${angularStorybookLib}:storybook --port ${storybookPort}`,
        (output) => {
          return /Storybook.*(started|ready)/gi.test(output);
        }
      );
      p.kill();
    }, 300_000);

    // Increased timeout because 92% sealing asset processing TerserPlugin
    // TODO(meeroslav) this test is still flaky and breaks the PR runs. We need to investigate why.
    xit('shoud build an Angular based storybook', () => {
      runCLI(`run ${angularStorybookLib}:build-storybook`);
      checkFilesExist(`${angularStorybookLib}/storybook-static/index.html`);
    }, 1_000_000);
  });
});
