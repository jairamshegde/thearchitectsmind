import { execSync } from 'node:child_process';

export default function teardown(): void {
  try {
    execSync('npx astro preview stop', { stdio: 'ignore' });
  } catch {
    // Nothing running (e.g. preview ran in the foreground): nothing to stop.
  }
}
