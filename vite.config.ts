import {
  readFile,
} from 'node:fs/promises';

import {
  resolve,
} from 'node:path';

import {
  defineConfig,
  type Plugin,
  type ViteDevServer,
} from 'vite';

const generatedCandidatesPathPattern =
  /^\/__generated\/candidates-([0-9]+)\.json$/;

function generatedCandidatesDevPlugin(): Plugin {
  return {
    name:
      'dungeon-logic-generated-candidates',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(
        (
          request,
          response,
          next,
        ) => {
          void serveGeneratedCandidates(
            server,
            request.url,
            response,
          ).then(
            (handled) => {
              if (!handled) {
                next();
              }
            },
            (error: unknown) => {
              next(
                error instanceof Error
                  ? error
                  : new Error(
                      'Failed to serve generated candidate report.',
                    ),
              );
            },
          );
        },
      );
    },
  };
}

async function serveGeneratedCandidates(
  server: ViteDevServer,
  requestUrl: string | undefined,
  response: {
    statusCode: number;
    setHeader(
      name: string,
      value: string,
    ): void;
    end(body?: string): void;
  },
): Promise<boolean> {
  if (requestUrl === undefined) {
    return false;
  }

  const pathname =
    new URL(
      requestUrl,
      'http://localhost',
    ).pathname;

  const match =
    generatedCandidatesPathPattern
      .exec(pathname);

  if (match === null) {
    return false;
  }

  const seed = Number(match[1]);

  if (
    !Number.isSafeInteger(seed) ||
    seed < 0 ||
    seed > 0xffff_ffff
  ) {
    response.statusCode = 400;
    response.end(
      'Invalid generated candidate seed.',
    );
    return true;
  }

  const filePath =
    resolve(
      server.config.root,
      '.generated',
      `candidates-${seed}.json`,
    );

  try {
    const contents =
      await readFile(
        filePath,
        'utf8',
      );

    response.statusCode = 200;
    response.setHeader(
      'Content-Type',
      'application/json; charset=utf-8',
    );
    response.setHeader(
      'Cache-Control',
      'no-store',
    );
    response.end(contents);
    return true;
  } catch (error) {
    if (
      isNodeError(error) &&
      error.code === 'ENOENT'
    ) {
      response.statusCode = 404;
      response.end(
        `Generated candidate report candidates-${seed}.json was not found.`,
      );
      return true;
    }

    throw error;
  }
}

function isNodeError(
  error: unknown,
): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

export default defineConfig({
  base: './',
  plugins: [
    generatedCandidatesDevPlugin(),
  ],
});
