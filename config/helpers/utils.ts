import { resolve } from 'path';

export function root(path: string): string {
  return resolve(__dirname, '../../', path);
}
