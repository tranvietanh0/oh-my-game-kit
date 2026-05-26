'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

class LockTimeoutError extends Error {
  constructor(lockPath, timeoutMs) {
    super(`Timed out acquiring lock ${lockPath} after ${timeoutMs}ms`);
    this.name = 'LockTimeoutError';
    this.lockPath = lockPath;
    this.timeoutMs = timeoutMs;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLock(lockPath) {
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch {
    return null;
  }
}

function isLocked(lockPath) {
  if (!fs.existsSync(lockPath)) return false;
  const lock = readLock(lockPath);
  if (!lock || !isPidAlive(lock.pid)) return false;
  return true;
}

function forceReleaseLock(lockPath) {
  try {
    fs.rmSync(lockPath, { force: true });
  } catch {
    // Best-effort cleanup only.
  }
}

async function acquireLock(lockPath, opts = {}) {
  const timeoutMs = opts.timeout ?? opts.timeoutMs ?? 10_000;
  const retryMs = opts.retryMs ?? 50;
  const started = Date.now();
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });

  while (Date.now() - started <= timeoutMs) {
    if (fs.existsSync(lockPath) && !isLocked(lockPath)) {
      forceReleaseLock(lockPath);
    }

    const lock = {
      pid: process.pid,
      command: opts.command ?? 'unknown',
      acquiredAt: new Date().toISOString(),
      host: os.hostname(),
    };

    try {
      const fd = fs.openSync(lockPath, 'wx');
      fs.writeFileSync(fd, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
      fs.closeSync(fd);
      return {
        lockPath,
        release() {
          const current = readLock(lockPath);
          if (!current || current.pid === process.pid) forceReleaseLock(lockPath);
        },
      };
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      await sleep(retryMs);
    }
  }

  throw new LockTimeoutError(lockPath, timeoutMs);
}

module.exports = {
  LockTimeoutError,
  acquireLock,
  forceReleaseLock,
  isLocked,
};
