import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const api = resolve(root, 'api');
const web = resolve(root, 'apps/web');
const mode = process.argv[2] ?? 'all';
const secret = () => randomBytes(48).toString('hex');

function createEnv(relativePath, contents) {
  const path = resolve(root, relativePath);
  if (existsSync(path)) {
    console.log(`Keeping existing ${relativePath}`);
    return;
  }
  writeFileSync(path, contents, { flag: 'wx' });
  console.log(`Created ${relativePath}`);
}

function configure() {
  createEnv('.env.local', `JWT_SECRET=${secret()}
JWT_REFRESH_SECRET=${secret()}
MYSQL_ROOT_PASSWORD=local_root_password
MYSQL_PASSWORD=local_apico_password
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
CORS_ORIGIN=http://localhost:3000
WEB_APP_URL=http://localhost:3000
API_PORT=5000
WEB_PORT=3000
`);
  createEnv('api/.env', `DATABASE_URL=mysql://apico:local_apico_password@127.0.0.1:3307/apico
JWT_SECRET=${secret()}
JWT_REFRESH_SECRET=${secret()}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
CORS_ORIGIN=http://localhost:3000
WEB_APP_URL=http://localhost:3000
NODE_ENV=development
`);
  createEnv('apps/web/.env.local', 'NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1\n');
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (exit ${result.status})`);
}

function install(cwd) {
  // Invoke npm through Node directly so PowerShell execution policy does not interfere.
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npm, ['ci'], {
    cwd, stdio: 'inherit', shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`npm ci failed in ${cwd}`);
}

if (!['env', 'setup', 'all', 'frontend', 'backend'].includes(mode)) {
  console.error('Usage: node scripts/dev.mjs [env|setup|all|frontend|backend]');
  process.exit(1);
}

try {
  if (mode === 'env' || mode === 'setup') {
    configure();
    if (mode === 'env') process.exit(0);
    run('docker', ['compose', '-f', 'docker-compose.dev.yml', 'up', '-d', '--wait', 'mysql']);
    install(api);
    install(web);
    const prisma = resolve(api, 'node_modules/prisma/build/index.js');
    run(process.execPath, [prisma, 'generate'], api);
    run(process.execPath, [prisma, 'migrate', 'deploy'], api);
    console.log('Setup complete. Run: node scripts/dev.mjs');
    process.exit(0);
  }

  const services = [
    { name: 'backend', cwd: api, env: '.env', bin: 'node_modules/ts-node-dev/lib/bin.js', args: ['--respawn', '--transpile-only', 'src/server.ts'] },
    { name: 'frontend', cwd: web, env: '.env.local', bin: 'node_modules/next/dist/bin/next', args: ['dev'] },
  ].filter((service) => mode === 'all' || mode === service.name);

  for (const service of services) {
    if (!existsSync(resolve(service.cwd, service.bin)) || !existsSync(resolve(service.cwd, service.env))) {
      throw new Error(`Missing ${service.name} setup. Run: node scripts/dev.mjs setup`);
    }
  }

  const children = [];
  let stopping = false;
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    for (const child of children) {
      if (!child.pid) continue;
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
      } else {
        try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already exited. */ }
      }
    }
    process.exit(code);
  }

  process.on('SIGINT', () => stop());
  process.on('SIGTERM', () => stop());
  for (const service of services) {
    console.log(`Starting ${service.name}...`);
    const child = spawn(process.execPath, [resolve(service.cwd, service.bin), ...service.args], {
      cwd: service.cwd, stdio: 'inherit', detached: process.platform !== 'win32',
    });
    children.push(child);
    child.on('error', (error) => { console.error(error.message); stop(1); });
    child.on('exit', (code) => {
      if (!stopping) stop(code ?? 1);
    });
  }
  console.log('Frontend: http://localhost:3000 | API: http://localhost:5000/api/v1');
  console.log('Press Ctrl+C to stop the app servers. MySQL keeps running in Docker.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
