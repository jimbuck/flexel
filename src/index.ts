import { LevelUp, LevelUpConstructor } from 'levelup';
const level: LevelUpConstructor = require('level');
const levelmem = require('level-mem');

import { LevelDatabase } from './database';

export * from './database';
export * from './queue';
export * from './stack';
export * from './models';

import { createLogger, advancedJsonEncoding } from './utils';

const logger = createLogger('flexel');

/**
 * Creates a flexel instance from an in-memory leveldown store.
 */
export function flexel(): LevelDatabase;

/**
 * Creates a flexel instance from the path to a leveldown store. 
 *
 * @param {string} path The path to the database.
 */
export function flexel(path: string): LevelDatabase;

/**
 * Creates a flexel instance using the provided LevelUp instance.
 *
 * @param {LevelUp} db The levelup instance.
 */
export function flexel(db: LevelUp): LevelDatabase;
export function flexel(path?: LevelUp|string) : LevelDatabase {
  let db: LevelUp;

  if (!path) {
    logger(`Creating in-memory database...`);
    db = levelmem(null, { valueEncoding: advancedJsonEncoding });
  } else if (typeof path === 'string') {
    logger(`Creating/Loading database at "${path}"...`);
    db = level(path, { valueEncoding: advancedJsonEncoding });
  } else {
    logger(`Using provided database...`);
    db = path;
  }

  if (!(db && db.get && db.put && db.del && db.createReadStream)) {
    throw new Error('Flexel requires a LevelUp instance!');
  }

  return new LevelDatabase(db);
}