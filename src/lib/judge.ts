// Lightweight local code-execution helper.
// The public Piston API now requires a whitelist, so we run code locally
// using the interpreters/compilers available on the server (sandboxed by
// a short timeout). Supports javascript (Node) and python out of the box;
// java/cpp/c require the respective toolchains to be installed on the host.

import { spawnSync } from 'child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export interface RunResult {
  stdout: string;
  stderr: string;
  error: string | null;
}

const TIMEOUT_MS = 8000;

function run(cmd: string, args: string[], cwd: string, stdin: string): RunResult {
  const res = spawnSync(cmd, args, {
    cwd, input: stdin, timeout: TIMEOUT_MS, encoding: 'utf-8',
  });

  if (res.error) {
    const code = (res.error as any).code;
    if (code === 'ETIMEDOUT') return { stdout: '', stderr: '', error: 'Time limit exceeded' };
    if (code === 'ENOENT')    return { stdout: '', stderr: '', error: `Runtime not available on server: ${cmd}` };
    return { stdout: '', stderr: '', error: res.error.message };
  }
  if (res.signal === 'SIGTERM') return { stdout: '', stderr: '', error: 'Time limit exceeded' };

  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  return { stdout, stderr, error: res.status !== 0 ? (stderr.trim() || `Exited with code ${res.status}`) : null };
}

export async function runCode(language: string, code: string, stdin: string): Promise<RunResult> {
  const dir = mkdtempSync(join(tmpdir(), 'judge-'));
  try {
    switch (language) {
      case 'python': {
        const file = join(dir, 'main.py');
        writeFileSync(file, code);
        const r = run(process.platform === 'win32' ? 'python' : 'python3', [file], dir, stdin);
        if (r.error?.includes('Runtime not available') || r.error?.includes('Python was not found')) {
          return run(process.platform === 'win32' ? 'python3' : 'python', [file], dir, stdin);
        }
        return r;
      }
      case 'java': {
        const file = join(dir, 'Main.java');
        writeFileSync(file, code);
        const compile = run('javac', [file], dir, '');
        if (compile.error) return compile;
        return run('java', ['-cp', dir, 'Main'], dir, stdin);
      }
      case 'cpp': {
        const file = join(dir, 'main.cpp');
        const exe = join(dir, process.platform === 'win32' ? 'main.exe' : 'main');
        writeFileSync(file, code);
        const compile = run('g++', [file, '-o', exe], dir, '');
        if (compile.error) return compile;
        return run(exe, [], dir, stdin);
      }
      case 'c': {
        const file = join(dir, 'main.c');
        const exe = join(dir, process.platform === 'win32' ? 'main.exe' : 'main');
        writeFileSync(file, code);
        const compile = run('gcc', [file, '-o', exe], dir, '');
        if (compile.error) return compile;
        return run(exe, [], dir, stdin);
      }
      case 'javascript':
      default: {
        const file = join(dir, 'main.js');
        writeFileSync(file, code);
        return run('node', [file], dir, stdin);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function runTestCases(
  language: string,
  code: string,
  testCases: { input: string; expectedOutput: string }[]
): Promise<{ passedCount: number; totalCount: number; details: { passed: boolean; output: string; error: string | null }[] }> {
  const details: { passed: boolean; output: string; error: string | null }[] = [];
  let passedCount = 0;

  for (const tc of testCases) {
    const result = await runCode(language, code, tc.input || '');
    const actual   = (result.stdout || '').trim();
    const expected = (tc.expectedOutput || '').trim();
    const passed = !result.error && actual === expected;
    if (passed) passedCount++;
    details.push({ passed, output: result.stdout, error: result.error || (result.stderr || null) });
  }

  return { passedCount, totalCount: testCases.length, details };
}
