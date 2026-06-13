import { readdirSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const roots = ['src', 'scripts', 'tests'];

const collect = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collect(full);
    return entry.isFile() && full.endsWith('.js') ? [full] : [];
  });
};

for (const file of roots.flatMap((root) => collect(root))) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
