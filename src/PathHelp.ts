import Path from 'path';
import * as process from 'process';

export function getBaseFolder() {
  const dir =
    typeof __dirname !== 'undefined' ? __dirname : process.env.SM__DIRNAME;
  if (!dir) {
    throw new Error('Cant find base folder');
  }
  return dir;
}

export default function PathHelp(base: string, ...inp: string[]) {
  const { env } = process;
  if (env.dev) {
    return Path.join(base, ...inp);
  }
  return Path.join(base, '..', ...inp);
}
