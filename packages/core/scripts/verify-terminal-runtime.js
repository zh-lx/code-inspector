'use strict';

const fs = require('fs');
const path = require('path');

const LOG_PREFIX = '[code-inspector-plugin]';
const PROBE_TIMEOUT_MS = 2000;

function logMessage(logger, level, message) {
  const target =
    (logger && typeof logger[level] === 'function' && logger[level]) ||
    (logger && typeof logger.log === 'function' && logger.log) ||
    console.log;
  target.call(logger, `${LOG_PREFIX} ${message}`);
}

function resolveNodePtyPackageRoot(resolveFromDir) {
  try {
    const packageJsonPath = require.resolve('node-pty/package.json', {
      paths: [resolveFromDir || __dirname],
    });
    return path.dirname(packageJsonPath);
  } catch {
    return null;
  }
}

function getSpawnHelperCandidates(nodePtyRoot, platform, arch) {
  if (!nodePtyRoot || platform === 'win32') {
    return [];
  }

  return [
    path.join(nodePtyRoot, 'build', 'Release', 'spawn-helper'),
    path.join(nodePtyRoot, 'build', 'Debug', 'spawn-helper'),
    path.join(nodePtyRoot, 'prebuilds', `${platform}-${arch}`, 'spawn-helper'),
  ];
}

function isExecutableFile(filePath, platform) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    if (platform === 'win32') return true;
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureHelperExecutable(filePath, platform) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { exists: false, executable: false, fixed: false };
  }

  if (platform === 'win32') {
    return { exists: true, executable: true, fixed: false };
  }

  if (isExecutableFile(filePath, platform)) {
    return { exists: true, executable: true, fixed: false };
  }

  try {
    const stat = fs.statSync(filePath);
    fs.chmodSync(filePath, stat.mode | 0o111);
    return {
      exists: true,
      executable: isExecutableFile(filePath, platform),
      fixed: true,
    };
  } catch (error) {
    return {
      exists: true,
      executable: false,
      fixed: false,
      error: error && error.message ? error.message : String(error),
    };
  }
}

function normalizeEnv(env) {
  const normalized = {};
  const source = env || process.env;

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      normalized[key] = value;
    }
  }

  return normalized;
}

function resolveProbeCwd(cwd) {
  try {
    if (cwd && fs.statSync(cwd).isDirectory()) {
      return cwd;
    }
  } catch {
    // ignore invalid cwd
  }
  return process.cwd();
}

function getProbeCommand(platform) {
  if (platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', 'exit 0'],
    };
  }

  return {
    command: '/bin/sh',
    args: ['-lc', 'exit 0'],
  };
}

async function probeNodePtySpawn(nodePty, options) {
  const platform = options.platform || process.platform;
  const probe = getProbeCommand(platform);

  if (!nodePty || typeof nodePty.spawn !== 'function') {
    return {
      ok: false,
      reason: 'node-pty module does not expose a spawn function.',
    };
  }

  try {
    const child = nodePty.spawn(probe.command, probe.args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: resolveProbeCwd(options.cwd),
      env: normalizeEnv(options.env),
    });

    return await new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(result);
      };

      const timeout = setTimeout(() => {
        try {
          if (child && typeof child.kill === 'function') {
            child.kill();
          }
        } catch {
          // ignore cleanup errors
        }

        finish({
          ok: false,
          reason: `PTY probe timed out after ${PROBE_TIMEOUT_MS}ms.`,
        });
      }, PROBE_TIMEOUT_MS);

      if (!child || typeof child.onExit !== 'function') {
        finish({
          ok: false,
          reason: 'node-pty spawn result does not expose onExit.',
        });
        return;
      }

      child.onExit(() => {
        finish({ ok: true });
      });
    });
  } catch (error) {
    return {
      ok: false,
      reason: error && error.message ? error.message : String(error),
    };
  }
}

async function runTerminalRuntimeCheck(options) {
  const settings = options || {};
  const logger = settings.logger || console;
  const platform = settings.platform || process.platform;
  const arch = settings.arch || process.arch;
  const resolveFromDir = settings.resolveFromDir || __dirname;

  // node-pty can block synchronously while connecting ConPTY pipes on Windows,
  // which prevents the probe timeout from starting and stalls package installs.
  // See https://github.com/microsoft/node-pty/issues/763.
  if (platform === 'win32') {
    return {
      ok: true,
      skipped: true,
      fixedPaths: [],
      helperPaths: [],
      reason: 'Terminal runtime verification is deferred on Windows.',
    };
  }

  const nodePtyRoot = Object.prototype.hasOwnProperty.call(
    settings,
    'nodePtyRoot',
  )
    ? settings.nodePtyRoot
    : resolveNodePtyPackageRoot(resolveFromDir);

  if (!nodePtyRoot) {
    logMessage(
      logger,
      'warn',
      'node-pty is not available; AI terminal mode will be disabled. Locate and AI CLI/SDK modes still work. Install build tools (python/make/g++) or reinstall node-pty to enable terminal mode.',
    );
    return {
      ok: true,
      skipped: true,
      fixedPaths: [],
      helperPaths: [],
      reason: 'node-pty is not installed.',
    };
  }

  const helperPaths = getSpawnHelperCandidates(nodePtyRoot, platform, arch);
  const fixedPaths = [];

  for (const helperPath of helperPaths) {
    const result = ensureHelperExecutable(helperPath, platform);
    if (!result.exists) {
      continue;
    }
    if (result.fixed && result.executable) {
      fixedPaths.push(helperPath);
      logMessage(
        logger,
        'log',
        `Restored execute permission on node-pty helper: ${helperPath}`,
      );
      continue;
    }
    if (!result.executable) {
      logMessage(
        logger,
        'warn',
        `node-pty helper is not executable: ${helperPath}${result.error ? ` (${result.error})` : ''}`,
      );
    }
  }

  let nodePty = settings.nodePty;
  if (!nodePty) {
    try {
      const modulePath = require.resolve('node-pty', {
        paths: [resolveFromDir],
      });
      nodePty = require(modulePath);
    } catch (error) {
      logMessage(
        logger,
        'warn',
        `Skipping terminal PTY probe because node-pty could not be loaded: ${error && error.message ? error.message : String(error)}`,
      );
      return {
        ok: true,
        skipped: true,
        fixedPaths,
        helperPaths,
        reason: 'node-pty could not be loaded.',
      };
    }
  }

  const probe = await probeNodePtySpawn(nodePty, {
    cwd: settings.cwd || resolveFromDir,
    env: settings.env,
    platform,
  });

  if (probe.ok) {
    logMessage(
      logger,
      'log',
      fixedPaths.length > 0
        ? `Terminal runtime verification passed after repairing ${fixedPaths.length} helper file(s).`
        : 'Terminal runtime verification passed.',
    );
  } else {
    logMessage(
      logger,
      'warn',
      `Terminal runtime verification failed: ${probe.reason}. Terminal mode will be disabled at runtime.`,
    );
  }

  return {
    ok: probe.ok,
    skipped: false,
    fixedPaths,
    helperPaths,
    reason: probe.reason,
  };
}

async function main() {
  try {
    await runTerminalRuntimeCheck();
  } catch (error) {
    logMessage(
      console,
      'warn',
      `Terminal runtime verification crashed: ${error && error.message ? error.message : String(error)}`,
    );
  }
}

if (require.main === module) {
  void main();
}

module.exports = {
  PROBE_TIMEOUT_MS,
  ensureHelperExecutable,
  getProbeCommand,
  getSpawnHelperCandidates,
  isExecutableFile,
  normalizeEnv,
  probeNodePtySpawn,
  resolveNodePtyPackageRoot,
  runTerminalRuntimeCheck,
};
