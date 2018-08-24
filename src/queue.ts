import { Database } from './models';
import { guid } from './utils';

export class LevelQueue<T> {
  
  private _db: Database;

  constructor(db: Database) {
    this._db = db;
  }

  public async enqueue(item: T): Promise<T> {
    const { headId, tailId } = await this._getMeta();

    let newTailId = guid();
    await this._db.set<QueueEntry<T>>(newTailId, { item });
    
    let tailEntry = await this._db.get<QueueEntry<T>>(tailId);
    tailEntry.nextId = newTailId;

    await this._db.set(tailId, tailEntry);    
    
    await this._setMeta({ headId, tailId: newTailId });

    return item;
  }

  public async dequeue(): Promise<T> {
    const { headId, tailId } = await this._getMeta();

    let headEntry = await this._db.get<QueueEntry<T>>(headId);
    await this._db.del(headId);

    await this._setMeta({ headId: headEntry.nextId, tailId });
    
    return headEntry.item;
  }

  public async peek(): Promise<T> {
    let { headId } = await this._getMeta();
    let headEntry = await this._db.get<QueueEntry<T>>(headId);

    return headEntry.item;
  }

  public async empty(): Promise<T> {
    return null;
  }

  private _getMeta(): Promise<QueueHeader> {
    return this._db.get<QueueHeader>('meta');
  }
  private async _setMeta(data: QueueHeader): Promise<void> {
    await this._db.set('meta', data);
  }
}

interface QueueHeader {
  headId?: string;
  tailId?: string;  
}

interface QueueEntry<T> {
  item: T;
  nextId?: string;
}

export class MemQueue<T> {
  private _items: Array<T>;

  constructor(items: Array<T> = []) {
    this._items = items;
  }

  public enqueue(item: T): T {
    this._items.push(item);
    return item;
  }

  public dequeue(): T {
    return this._items.shift();
  }

  public peek(): T {
    return this._items[0];
  }

  public empty(): void {
    this._items = [];
  }
}