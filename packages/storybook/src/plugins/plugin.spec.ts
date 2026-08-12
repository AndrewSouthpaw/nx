import { CreateNodesContext } from '@nx/devkit';
import { TempFs } from '@nx/devkit/internal-testing-utils';
import type { StorybookConfig } from 'storybook/internal/types';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { createNodesV2 } from './plugin';

jest.mock('nx/src/utils/cache-directory', () => ({
  ...jest.requireActual('nx/src/utils/cache-directory'),
  workspaceDataDirectory: 'tmp/storybook-plugin-cache',
}));

describe('@nx/storybook/plugin', () => {
  let createNodesFunction = createNodesV2[1];
  let context: CreateNodesContext;
  let tempFs: TempFs;

  beforeEach(async () => {
    rmSync('tmp/storybook-plugin-cache', { recursive: true, force: true });
    tempFs = new TempFs('storybook-plugin');
    context = {
      nxJsonConfiguration: {
        namedInputs: {
          default: ['{projectRoot}/**/*'],
          production: ['!{projectRoot}/**/*.spec.ts'],
        },
      },
      workspaceRoot: tempFs.tempDir,
    };
    tempFs.createFileSync('package.json', JSON.stringify({ name: 'repo' }));
    tempFs.createFileSync('package-lock.json', '{}');
    tempFs.createFileSync(
      'my-app/project.json',
      JSON.stringify({ name: 'my-app' })
    );
    tempFs.createFileSync(
      'my-ng-app/project.json',
      JSON.stringify({ name: 'my-ng-app' })
    );
    tempFs.createFileSync(
      'my-react-lib/project.json',
      JSON.stringify({ name: 'my-react-lib' })
    );
    tempFs.createFileSync(
      'my-vitest-app/project.json',
      JSON.stringify({ name: 'my-vitest-app' })
    );
    tempFs.createFileSync(
      'my-webpack-app/project.json',
      JSON.stringify({ name: 'my-webpack-app' })
    );
    // Distinct root: targets are cached per project hash, and node_modules is not
    // part of that hash, so reusing a root returns the previous case's answer.
    tempFs.createFileSync(
      'my-mixed-app/project.json',
      JSON.stringify({ name: 'my-mixed-app' })
    );
    tempFs.createFileSync(
      'my-mixed-lib/project.json',
      JSON.stringify({ name: 'my-mixed-lib' })
    );
  });

  afterEach(() => {
    jest.resetModules();
    tempFs.cleanup();
  });

  it('should create nodes', async () => {
    tempFs.createFileSync('my-app/.storybook/main.ts', '');
    mockStorybookMainConfig('my-app/.storybook/main.ts', {
      stories: ['../src/app/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
      addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
      framework: {
        name: '@storybook/react-vite',
        options: {},
      },
    });

    const nodes = await createNodesFunction(
      ['my-app/.storybook/main.ts'],
      {
        buildStorybookTargetName: 'build-storybook',
        staticStorybookTargetName: 'static-storybook',
        serveStorybookTargetName: 'serve-storybook',
        testStorybookTargetName: 'test-storybook',
        buildDepsTargetName: 'build-deps',
        watchDepsTargetName: 'watch-deps',
      },
      context
    );

    expect(nodes).toMatchInlineSnapshot(`
      [
        [
          "my-app/.storybook/main.ts",
          {
            "projects": {
              "my-app": {
                "root": "my-app",
                "targets": {
                  "build-deps": {
                    "dependsOn": [
                      "^build",
                    ],
                  },
                  "build-storybook": {
                    "cache": true,
                    "command": "storybook build",
                    "inputs": [
                      "production",
                      "^production",
                      {
                        "externalDependencies": [
                          "storybook",
                        ],
                      },
                    ],
                    "options": {
                      "cwd": "my-app",
                    },
                    "outputs": [
                      "{projectRoot}/storybook-static",
                      "{options.output-dir}",
                      "{options.outputDir}",
                      "{options.o}",
                    ],
                  },
                  "serve-storybook": {
                    "command": "storybook dev",
                    "continuous": true,
                    "options": {
                      "cwd": "my-app",
                    },
                  },
                  "static-storybook": {
                    "continuous": true,
                    "dependsOn": [
                      "build-storybook",
                    ],
                    "executor": "@nx/web:file-server",
                    "options": {
                      "buildTarget": "build-storybook",
                      "staticFilePath": "my-app/storybook-static",
                    },
                  },
                  "watch-deps": {
                    "command": "npx nx watch --projects my-app --includeDependencies -- npx nx build-deps my-app",
                    "continuous": true,
                    "dependsOn": [
                      "build-deps",
                    ],
                  },
                },
              },
            },
          },
        ],
      ]
    `);
  });

  it('should create angular nodes', async () => {
    tempFs.createFileSync('my-ng-app/.storybook/main.ts', '');
    mockStorybookMainConfig('my-ng-app/.storybook/main.ts', {
      stories: ['../src/app/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
      addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
      framework: {
        name: '@storybook/angular',
        options: {},
      },
    });

    const nodes = await createNodesFunction(
      ['my-ng-app/.storybook/main.ts'],
      {
        buildStorybookTargetName: 'build-storybook',
        staticStorybookTargetName: 'static-storybook',
        serveStorybookTargetName: 'serve-storybook',
        testStorybookTargetName: 'test-storybook',
        buildDepsTargetName: 'build-deps',
        watchDepsTargetName: 'watch-deps',
      },
      context
    );

    expect(nodes).toMatchInlineSnapshot(`
      [
        [
          "my-ng-app/.storybook/main.ts",
          {
            "projects": {
              "my-ng-app": {
                "root": "my-ng-app",
                "targets": {
                  "build-deps": {
                    "dependsOn": [
                      "^build",
                    ],
                  },
                  "build-storybook": {
                    "cache": true,
                    "executor": "@storybook/angular:build-storybook",
                    "inputs": [
                      "production",
                      "^production",
                      {
                        "externalDependencies": [
                          "storybook",
                          "@storybook/angular",
                        ],
                      },
                    ],
                    "options": {
                      "browserTarget": "my-ng-app:build-storybook",
                      "compodoc": false,
                      "configDir": "my-ng-app/.storybook",
                      "outputDir": "my-ng-app/storybook-static",
                    },
                    "outputs": [
                      "{projectRoot}/storybook-static",
                      "{options.output-dir}",
                      "{options.outputDir}",
                      "{options.o}",
                    ],
                  },
                  "serve-storybook": {
                    "continuous": true,
                    "executor": "@storybook/angular:start-storybook",
                    "options": {
                      "browserTarget": "my-ng-app:build-storybook",
                      "compodoc": false,
                      "configDir": "my-ng-app/.storybook",
                    },
                  },
                  "static-storybook": {
                    "continuous": true,
                    "dependsOn": [
                      "build-storybook",
                    ],
                    "executor": "@nx/web:file-server",
                    "options": {
                      "buildTarget": "build-storybook",
                      "staticFilePath": "my-ng-app/storybook-static",
                    },
                  },
                  "watch-deps": {
                    "command": "npx nx watch --projects my-ng-app --includeDependencies -- npx nx build-deps my-ng-app",
                    "continuous": true,
                    "dependsOn": [
                      "build-deps",
                    ],
                  },
                },
              },
            },
          },
        ],
      ]
    `);
  });

  it('should support main.js', async () => {
    tempFs.createFileSync('my-react-lib/.storybook/main.js', '');
    mockStorybookMainConfig('my-react-lib/.storybook/main.js', {
      stories: ['../src/lib/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
      addons: ['@storybook/addon-essentials'],
      framework: {
        name: '@storybook/react-vite',
        options: {
          builder: {
            viteConfigPath: 'vite.config.js',
          },
        },
      },
    });

    const nodes = await createNodesFunction(
      ['my-react-lib/.storybook/main.js'],
      {
        buildStorybookTargetName: 'build-storybook',
        staticStorybookTargetName: 'static-storybook',
        serveStorybookTargetName: 'serve-storybook',
        testStorybookTargetName: 'test-storybook',
        buildDepsTargetName: 'build-deps',
        watchDepsTargetName: 'watch-deps',
      },
      context
    );

    expect(nodes).toMatchInlineSnapshot(`
      [
        [
          "my-react-lib/.storybook/main.js",
          {
            "projects": {
              "my-react-lib": {
                "root": "my-react-lib",
                "targets": {
                  "build-deps": {
                    "dependsOn": [
                      "^build",
                    ],
                  },
                  "build-storybook": {
                    "cache": true,
                    "command": "storybook build",
                    "inputs": [
                      "production",
                      "^production",
                      {
                        "externalDependencies": [
                          "storybook",
                        ],
                      },
                    ],
                    "options": {
                      "cwd": "my-react-lib",
                    },
                    "outputs": [
                      "{projectRoot}/storybook-static",
                      "{options.output-dir}",
                      "{options.outputDir}",
                      "{options.o}",
                    ],
                  },
                  "serve-storybook": {
                    "command": "storybook dev",
                    "continuous": true,
                    "options": {
                      "cwd": "my-react-lib",
                    },
                  },
                  "static-storybook": {
                    "continuous": true,
                    "dependsOn": [
                      "build-storybook",
                    ],
                    "executor": "@nx/web:file-server",
                    "options": {
                      "buildTarget": "build-storybook",
                      "staticFilePath": "my-react-lib/storybook-static",
                    },
                  },
                  "watch-deps": {
                    "command": "npx nx watch --projects my-react-lib --includeDependencies -- npx nx build-deps my-react-lib",
                    "continuous": true,
                    "dependsOn": [
                      "build-deps",
                    ],
                  },
                },
              },
            },
          },
        ],
      ]
    `);
  });

  it('should infer test-storybook from an addon-vitest installed in the project', async () => {
    tempFs.createFileSync('my-vitest-app/.storybook/main.ts', '');
    // Declared in the project rather than hoisted to the workspace root.
    tempFs.createFileSync(
      'my-vitest-app/node_modules/@storybook/addon-vitest/package.json',
      JSON.stringify({
        name: '@storybook/addon-vitest',
        version: '10.5.7',
        main: 'index.js',
      })
    );
    tempFs.createFileSync(
      'my-vitest-app/node_modules/@storybook/addon-vitest/index.js',
      ''
    );
    mockStorybookMainConfig('my-vitest-app/.storybook/main.ts', {
      stories: ['../src/app/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
      addons: ['@storybook/addon-vitest'],
      framework: {
        name: '@storybook/react-vite',
        options: {},
      },
    });

    const nodes = await createNodesFunction(
      ['my-vitest-app/.storybook/main.ts'],
      {
        buildStorybookTargetName: 'build-storybook',
        staticStorybookTargetName: 'static-storybook',
        serveStorybookTargetName: 'serve-storybook',
        testStorybookTargetName: 'test-storybook',
        buildDepsTargetName: 'build-deps',
        watchDepsTargetName: 'watch-deps',
      },
      context
    );

    expect(nodes[0][1].projects['my-vitest-app'].targets['test-storybook'])
      .toMatchInlineSnapshot(`
      {
        "command": "vitest run --project=storybook --passWithNoTests",
        "inputs": [
          {
            "externalDependencies": [
              "storybook",
              "@storybook/addon-vitest",
              "vitest",
            ],
          },
        ],
        "options": {
          "cwd": "my-vitest-app",
        },
      }
    `);
  });

  it('should infer the test runner target when only it is installed', async () => {
    tempFs.createFileSync('my-webpack-app/.storybook/main.ts', '');
    installPackage('my-webpack-app', '@storybook/test-runner');
    mockStorybookMainConfig('my-webpack-app/.storybook/main.ts', {
      stories: ['../src/app/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
      addons: [],
      framework: { name: '@storybook/react-webpack5', options: {} },
    });

    const nodes = await createNodesFunction(
      ['my-webpack-app/.storybook/main.ts'],
      targetNames,
      context
    );

    expect(
      nodes[0][1].projects['my-webpack-app'].targets['test-storybook'].command
    ).toBe('test-storybook');
  });

  it('should only give the vitest command to the vite framework when the addon is at the root', async () => {
    // The addon lands in the root package.json, so it resolves for every project.
    // Only the Vite-builder frameworks can actually run it.
    installPackage('.', '@storybook/addon-vitest');
    installPackage('.', '@storybook/test-runner');

    tempFs.createFileSync('my-mixed-lib/.storybook/main.ts', '');
    mockStorybookMainConfig('my-mixed-lib/.storybook/main.ts', {
      stories: ['../src/lib/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
      addons: [],
      framework: { name: '@storybook/react-vite', options: {} },
    });
    tempFs.createFileSync('my-mixed-app/.storybook/main.ts', '');
    mockStorybookMainConfig('my-mixed-app/.storybook/main.ts', {
      stories: ['../src/app/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
      addons: [],
      framework: { name: '@storybook/react-webpack5', options: {} },
    });

    const [viteNodes, webpackNodes] = await Promise.all([
      createNodesFunction(
        ['my-mixed-lib/.storybook/main.ts'],
        targetNames,
        context
      ),
      createNodesFunction(
        ['my-mixed-app/.storybook/main.ts'],
        targetNames,
        context
      ),
    ]);

    // Guards the assertion below: without this the addon may simply not resolve,
    // and the webpack expectation would hold for the wrong reason.
    expect(
      viteNodes[0][1].projects['my-mixed-lib'].targets['test-storybook'].command
    ).toBe('vitest run --project=storybook --passWithNoTests');
    expect(
      webpackNodes[0][1].projects['my-mixed-app'].targets['test-storybook']
        .command
    ).toBe('test-storybook');
  });

  function installPackage(projectRoot: string, packageName: string) {
    const base = projectRoot === '.' ? '' : `${projectRoot}/`;
    tempFs.createFileSync(
      `${base}node_modules/${packageName}/package.json`,
      JSON.stringify({ name: packageName, main: 'index.js' })
    );
    tempFs.createFileSync(`${base}node_modules/${packageName}/index.js`, '');
  }

  const targetNames = {
    buildStorybookTargetName: 'build-storybook',
    staticStorybookTargetName: 'static-storybook',
    serveStorybookTargetName: 'serve-storybook',
    testStorybookTargetName: 'test-storybook',
    buildDepsTargetName: 'build-deps',
    watchDepsTargetName: 'watch-deps',
  };

  function mockStorybookMainConfig(
    mainTsPath: string,
    mainTsConfig: StorybookConfig
  ) {
    jest.mock(
      join(tempFs.tempDir, mainTsPath),
      () => ({ default: mainTsConfig }),
      { virtual: true }
    );
  }
});
