import { LevelUp } from 'levelup';

import { LevelDatabase } from './database';
export * from './database';
export * from './queue';
export * from './stack';

export function flexel(db: LevelUp) {
  return new LevelDatabase(db);
}