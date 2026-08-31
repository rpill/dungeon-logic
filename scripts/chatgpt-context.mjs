import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';

const MAX_TEXT_FILE_BYTES = 512 * 1024;

const BUNDLE_DIR_NAME = '_chatgpt_bundle';
const BUNDLE_FILE_NAME = 'CHATGPT_CONTEXT.txt';

const mode = process.argv.includes('--last-commit')
  ? 'last-commit'
  : 'worktree';

function git(args, cwd = process.cwd()) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function gitBuffer(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function splitNull(buffer) {
  const text = buffer.toString('utf8');
  const parts = text.split('\0');

  if (parts.at(-1) === '') {
    parts.pop();
  }

  return parts;
}

function hasHead(root) {
  try {
    git(['rev-parse', '--verify', 'HEAD'], root);
    return true;
  } catch {
    return false;
  }
}

function makeTree(paths, rootName) {
  const root = {
    dirs: new Map(),
    files: new Set(),
  };

  for (const rawPath of paths) {
    const cleanPath = rawPath
      .replaceAll('\\', '/')
      .replace(/^\.\//, '');

    if (!cleanPath) {
      continue;
    }

    const parts = cleanPath.split('/').filter(Boolean);

    let node = root;

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        node.files.add(part);
        continue;
      }

      if (!node.dirs.has(part)) {
        node.dirs.set(part, {
          dirs: new Map(),
          files: new Set(),
        });
      }

      node = node.dirs.get(part);
    }
  }

  const lines = [`${rootName}/`];

  function render(node, prefix) {
    const entries = [
      ...[...node.dirs.entries()].map(([name, child]) => ({
        name,
        child,
        type: 'dir',
      })),

      ...[...node.files].map((name) => ({
        name,
        child: null,
        type: 'file',
      })),
    ].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1;
      }

      return a.name.localeCompare(b.name, 'en');
    });

    entries.forEach((entry, index) => {
      const last = index === entries.length - 1;

      const branch = last
        ? '└── '
        : '├── ';

      const suffix = entry.type === 'dir'
        ? '/'
        : '';

      lines.push(
        `${prefix}${branch}${entry.name}${suffix}`,
      );

      if (entry.type === 'dir') {
        render(
          entry.child,
          `${prefix}${last ? '    ' : '│   '}`,
        );
      }
    });
  }

  render(root, '');

  return `${lines.join('\n')}\n`;
}

function parseNameStatus(buffer) {
  const tokens = splitNull(buffer);

  const changes = [];

  let i = 0;

  while (i < tokens.length) {
    const status = tokens[i++];
    const code = status[0];

    if (code === 'R' || code === 'C') {
      const oldPath = tokens[i++];
      const path = tokens[i++];

      changes.push({
        status,
        path,
        oldPath,
      });
    } else {
      const path = tokens[i++];

      changes.push({
        status,
        path,
      });
    }
  }

  return changes;
}

function getChanges(root, selectedMode, repoHasHead) {
  if (!repoHasHead) {
    return splitNull(
      gitBuffer(
        [
          'ls-files',
          '--cached',
          '--others',
          '--exclude-standard',
          '-z',
        ],
        root,
      ),
    ).map((path) => ({
      status: 'A',
      path,
    }));
  }

  if (selectedMode === 'last-commit') {
    return parseNameStatus(
      gitBuffer(
        [
          'diff-tree',
          '--root',
          '--no-commit-id',
          '--name-status',
          '-r',
          '-z',
          '--find-renames',
          'HEAD',
        ],
        root,
      ),
    );
  }

  const tracked = parseNameStatus(
    gitBuffer(
      [
        'diff',
        '--name-status',
        '-z',
        '--find-renames',
        'HEAD',
        '--',
      ],
      root,
    ),
  );

  const untracked = splitNull(
    gitBuffer(
      [
        'ls-files',
        '--others',
        '--exclude-standard',
        '-z',
      ],
      root,
    ),
  ).map((path) => ({
    status: '??',
    path,
  }));

  const byPath = new Map();

  for (const change of [
    ...tracked,
    ...untracked,
  ]) {
    byPath.set(change.path, change);
  }

  return [...byPath.values()];
}

function isProbablyTextFile(buffer) {
  return !buffer
    .subarray(0, 8192)
    .includes(0);
}

let root;

try {
  root = git([
    'rev-parse',
    '--show-toplevel',
  ]).trim();
} catch {
  console.error(
    'Not a Git repository. Run: git init',
  );

  process.exit(1);
}

const repoHasHead = hasHead(root);

const bundleDir = join(
  root,
  BUNDLE_DIR_NAME,
);

rmSync(
  bundleDir,
  {
    recursive: true,
    force: true,
  },
);

mkdirSync(
  bundleDir,
  {
    recursive: true,
  },
);

/*
 * Build TREE.txt using Git instead of the filesystem.
 *
 * Therefore ignored folders such as:
 *
 * node_modules/
 * dist/
 * public/assets/oryx/
 *
 * never explode the tree.
 */
const projectFiles = splitNull(
  gitBuffer(
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
    ],
    root,
  ),
).filter((path) =>
  existsSync(join(root, path)),
);

const treePaths = new Set(projectFiles);

/*
 * TREE.txt should also list itself even on
 * the first invocation.
 */
treePaths.add('TREE.txt');

const treeText = makeTree(
  [...treePaths],
  basename(root),
);

const treePath = join(
  root,
  'TREE.txt',
);

const previousTree = existsSync(treePath)
  ? readFileSync(treePath, 'utf8')
  : '';

const treeChanged =
  previousTree !== treeText;

if (treeChanged) {
  writeFileSync(
    treePath,
    treeText,
    'utf8',
  );
}

/*
 * TREE.txt may have changed above, so obtain
 * Git changes only after rebuilding it.
 */
const changes = getChanges(
  root,
  mode,
  repoHasHead,
)
  .filter(
    (change) =>
      !change.path.startsWith(
        `${BUNDLE_DIR_NAME}/`,
      ),
  )
  .sort(
    (a, b) =>
      a.path.localeCompare(
        b.path,
        'en',
      ),
  );

const branch = repoHasHead
  ? git(
    ['branch', '--show-current'],
    root,
  ).trim() || '(detached HEAD)'
  : '(no commits yet)';

const head = repoHasHead
  ? git(
    ['rev-parse', '--short', 'HEAD'],
    root,
  ).trim()
  : '(no commits yet)';

const output = [];

output.push(
  'DUNGEON LOGIC - CHATGPT CONTEXT',
);

output.push(`Mode: ${mode}`);
output.push(`Branch: ${branch}`);
output.push(`Base HEAD: ${head}`);

output.push(
  `TREE.txt changed: ${treeChanged ? 'yes' : 'no'
  }`,
);

output.push('');
output.push('CHANGED FILES');

if (changes.length === 0) {
  output.push('(none)');
} else {
  for (const change of changes) {
    const rename = change.oldPath
      ? ` <- ${change.oldPath}`
      : '';

    output.push(
      `${change.status.padEnd(5)} ${change.path
      }${rename}`,
    );
  }
}

output.push('');
output.push('CURRENT FILE CONTENTS');

/*
 * Put the COMPLETE current contents of every
 * changed text file into the bundle.
 *
 * This is more useful to ChatGPT than only
 * sending a patch because it gives the current
 * source of truth for each affected file.
 */
for (const change of changes) {
  if (change.status.startsWith('D')) {
    continue;
  }

  const absolutePath = join(
    root,
    change.path,
  );

  if (!existsSync(absolutePath)) {
    continue;
  }

  const stats = statSync(
    absolutePath,
  );

  if (!stats.isFile()) {
    continue;
  }

  if (
    stats.size >
    MAX_TEXT_FILE_BYTES
  ) {
    output.push('');

    output.push(
      `===== SKIPPED LARGE FILE: ${change.path
      } (${stats.size} bytes) =====`,
    );

    continue;
  }

  const buffer = readFileSync(
    absolutePath,
  );

  if (!isProbablyTextFile(buffer)) {
    output.push('');

    output.push(
      `===== SKIPPED BINARY FILE: ${change.path
      } =====`,
    );

    continue;
  }

  output.push('');

  output.push(
    `===== FILE: ${change.path} =====`,
  );

  output.push(
    buffer.toString('utf8'),
  );

  output.push(
    `===== END FILE: ${change.path} =====`,
  );
}

const bundlePath = join(
  bundleDir,
  BUNDLE_FILE_NAME,
);

writeFileSync(
  bundlePath,
  `${output.join('\n')}\n`,
  'utf8',
);

console.log('');
console.log(
  `Updated tree: ${treePath}`,
);

console.log(
  `Created context: ${bundlePath}`,
);

console.log(
  `Changed files: ${changes.length}`,
);

if (
  mode === 'worktree' &&
  changes.length === 0
) {
  console.log('');
  console.log(
    'Working tree is clean.',
  );

  console.log(
    'Use "npm run context:last" if you want the files from the latest commit.',
  );
}