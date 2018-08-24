type SublevelFactory = (db: LevelUp, namespace: string, opts?: {}) => LevelUp;

const sublevel: SublevelFactory = require('subleveldown');
import { LevelUp } from 'levelup';

import { Database } from './models';
import { LevelQueue } from './queue';
import { LevelStack } from './stack';

export class LevelDatabase implements Database {
  
  private _db: LevelUp;

  constructor(db: LevelUp) {
    this._db = db;
  }

  public async get<TValue>(key: string): Promise<TValue> {
    return new Promise<TValue>((resolve, reject) => {
      this._db.get(key, (err, value) => {
        if (err) {
          if (err.notFound) return resolve(null);
          return reject(err);
        }
        resolve(value);
      });
    });
  }

  public async set<TValue>(key: string, value: TValue): Promise<TValue> {
    return new Promise<TValue>((resolve, reject) => {
      this._db.put(key, value, (err) => {
        if (err) {
          return reject(err);
        }
        resolve(value);
      });
    });
  }

  public async del(key: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._db.del(key, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  public sub(namespace: string): LevelDatabase {
    let sub = sublevel(this._db, namespace);
    return new LevelDatabase(sub);
  }

  public queue<T>(namespace: string): LevelQueue<T> {
    let sub = this.sub(namespace);
    return new LevelQueue<T>(sub);
  }

  public stack<T>(namespace: string): LevelStack<T> {
    let sub = this.sub(namespace);
    return new LevelStack<T>(sub);
  }
}