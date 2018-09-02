
const toArray = require('stream-to-array');

import { Database, Queue, StreamItem } from './models';
import { dePromise, getTime, streamForEach } from './utils';

export class LevelQueue<T> implements Queue<T> {
  
  private _db: Database;

  constructor(db: Database) {
    this._db = db;
  }

  public async enqueue(item: T): Promise<T> {
    const newId = getTime();
    await this._db.set<T>(newId, item);

    return item;
  }

  public async dequeue(): Promise<T> {
    const { key, value } = await this._peek();
   
    if (key === null) return null;

    await this._db.del(key);
    
    return value;
  }

  public async peek(): Promise<T> {
    const { value } = await this._peek();
    return value;
  }

  public async empty(): Promise<void> {
    await streamForEach<StreamItem<T>>(this._db.createReadStream(), item => this._db.del(item.key));
  }

  private async _peek(): Promise<StreamItem<T>> {
    const stream = this._db.createReadStream({ limit: 1 });

    try {
      const [headItem] = await toArray(stream) as Array<StreamItem<T>>;

      return headItem;
    } catch (err) {
      return { key: null, value: null };
    }
  }
}