import { fork } from 'node:child_process';
import { once } from 'node:events';

/** Start an isolated loopback server on an OS-assigned port, then stop it on cleanup. */
export async function startTestServer(testContext) {
  const serverProcess = fork(new URL('../../scripts/server.mjs', import.meta.url), {
    env: { ...process.env, HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });

  testContext.after(async () => {
    if (serverProcess.exitCode === null && !serverProcess.killed) {
      const exited = once(serverProcess, 'exit');
      serverProcess.kill();
      await exited;
    }
  });

  const readyMessage = await new Promise((resolve, reject) => {
    serverProcess.once('message', resolve);
    serverProcess.once('error', reject);
    serverProcess.once('exit', (code) =>
      reject(new Error(`Test server exited before becoming ready (code ${code}).`)),
    );
  });

  return `http://127.0.0.1:${readyMessage.port}`;
}
