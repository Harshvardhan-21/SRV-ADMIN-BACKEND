const { spawn, spawnSync } = require('node:child_process');
const { existsSync, readFileSync, unlinkSync, watch, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const cwd = process.cwd();
const distDir = join(cwd, 'dist');
const distEntry = join(distDir, 'main.js');
const tscEntry = join(cwd, 'node_modules', 'typescript', 'bin', 'tsc');
const tsconfigPath = join(cwd, 'tsconfig.json');
const watchRoot = existsSync(distDir) ? distDir : cwd;
const pidFile = join(cwd, '.dev-server.pid');

let serverProcess = null;
let restartTimer = null;
let isStoppingServer = false;
let isStartingServer = false;
let restartQueuedWhileStopping = false;

function clearPidFile() {
  try {
    unlinkSync(pidFile);
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      console.error('[dev-runner] Failed to clear pid file:', error);
    }
  }
}

function readRecordedPid() {
  if (!existsSync(pidFile)) return null;

  try {
    const raw = readFileSync(pidFile, 'utf8').trim();
    const pid = Number(raw);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch (error) {
    console.error('[dev-runner] Failed to read pid file:', error);
    return null;
  }
}

function reclaimStaleBackend() {
  const recordedPid = readRecordedPid();
  if (!recordedPid || recordedPid === process.pid) {
    clearPidFile();
    return;
  }

  try {
    process.kill(recordedPid);
    console.log(`[dev-runner] Stopped stale backend child process ${recordedPid}.`);
  } catch (error) {
    if (!error || error.code !== 'ESRCH') {
      console.error(`[dev-runner] Failed to stop recorded backend process ${recordedPid}:`, error);
    }
  } finally {
    clearPidFile();
  }
}

function stopProcess(child, name) {
  if (!child || child.exitCode !== null) return;
  try {
    child.kill();
  } catch (error) {
    console.error(`[dev-runner] Failed to stop ${name}:`, error);
  }
}

function startServer() {
  if (!existsSync(distEntry)) {
    console.log('[dev-runner] Waiting for initial TypeScript build...');
    return;
  }

  if (serverProcess || isStartingServer) {
    return;
  }

  isStartingServer = true;

  serverProcess = spawn(process.execPath, [distEntry], {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  serverProcess.on('spawn', () => {
    if (serverProcess?.pid) {
      writeFileSync(pidFile, String(serverProcess.pid), 'utf8');
    }
    isStartingServer = false;
  });

  serverProcess.on('exit', (code, signal) => {
    const expected = isStoppingServer;
    isStoppingServer = false;
    isStartingServer = false;
    serverProcess = null;
    clearPidFile();

    if (expected && restartQueuedWhileStopping) {
      restartQueuedWhileStopping = false;
      startServer();
      return;
    }

    if (!expected && signal !== 'SIGTERM' && code && code !== 0) {
      console.error(`[dev-runner] Backend exited with code ${code}. Waiting for next rebuild...`);
    }
  });
}

function restartServer() {
  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    restartTimer = null;

    if (isStartingServer) {
      restartQueuedWhileStopping = true;
      return;
    }

    if (isStoppingServer) {
      restartQueuedWhileStopping = true;
      return;
    }

    if (!serverProcess) {
      startServer();
      return;
    }

    restartQueuedWhileStopping = false;
    isStoppingServer = true;
    stopProcess(serverProcess, 'backend server');
  }, 250);
}

console.log('[dev-runner] Running initial TypeScript build...');
reclaimStaleBackend();
const initialBuild = spawnSync(
  process.execPath,
  [tscEntry, '-p', tsconfigPath],
  {
    cwd,
    stdio: 'inherit',
    shell: false,
  },
);

if (initialBuild.status && initialBuild.status !== 0) {
  process.exit(initialBuild.status);
}

console.log('[dev-runner] Starting backend server...');
startServer();

console.log('[dev-runner] Starting TypeScript watch compiler...');
const compilerProcess = spawn(
  process.execPath,
  [tscEntry, '-w', '-p', tsconfigPath, '--preserveWatchOutput'],
  {
    cwd,
    stdio: 'inherit',
    shell: false,
  },
);

compilerProcess.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[dev-runner] TypeScript watcher exited with code ${code}.`);
  }
  stopProcess(serverProcess, 'backend server');
  process.exit(code ?? 0);
});

const watcher = watch(
  watchRoot,
  { recursive: true },
  (_eventType, filename) => {
    if (!filename) return;
    if (watchRoot === cwd && !filename.startsWith('dist')) return;
    if (!filename.endsWith('.js') && !filename.endsWith('.js.map')) return;
    restartServer();
  },
);

watcher.on('error', (error) => {
  console.error('[dev-runner] File watcher error:', error);
});

function shutdown(signal) {
  console.log(`[dev-runner] Received ${signal}, stopping watcher...`);
  watcher.close();
  stopProcess(compilerProcess, 'TypeScript watcher');
  stopProcess(serverProcess, 'backend server');
  clearPidFile();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
