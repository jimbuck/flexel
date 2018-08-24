import { Database } from './models';

export class LevelStack<T> {

  private _db: Database;

  constructor(db: Database) {
    this._db = db;
  }

  public async push(item: T): Promise<T> {
    // TODO: Implement

    return item;
  }

  public async pop(): Promise<T> {
    return null;
  }

  public async peek(): Promise<T> {
    return null;
  }

  public async empty(): Promise<void> {
    return null;
  }
}

export class MemStack<T> {
  private _items: Array<T>;

  constructor(items: Array<T> = []) {
    this._items = items;
  }

  public push(item: T): T {
    this._items.unshift(item);
    return item;
  }

  public pop(): T {
    return this._items.shift();
  }

  public peek(): T {
    return this._items[0];
  }

  public empty(): void {
    this._items = [];
  }
}