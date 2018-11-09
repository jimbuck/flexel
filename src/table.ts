import { AbstractDatabase, Query, AbstractTable } from './models';
import { createLogger, Logger, streamToArray } from './utils';

const defaultLogger = createLogger('table');

export class FlexelTable<T> implements AbstractTable<T> {

	private _db: AbstractDatabase;
	private _key: string;
	protected _log: Logger;

	constructor(db: AbstractDatabase, key: string, logger?: Logger) {
		this._db = db;
		this._key = key;
		this._log = logger || defaultLogger;
	}

	public get(): Promise<T[]>;
	public get(key: string): Promise<T>;
	public async get(key?: string): Promise<T | T[]> {
		if (typeof key === 'string') {
			this._log(`Getting item with key '${key}'...`);
			return this._db.get<T>(key);
		}

		this._log(`Getting all items...`);
		let arr = await streamToArray<T>(this._db.createReadStream());
		return arr.map(si => si.value);
	}

	public async put(item: T): Promise<T> {
		const key = (item as any)[this._key];
		this._log(`Putting item with key '${key}'...`);
		await this._db.put<T>(key, item);
		return item;
	}

	public async del(key: string): Promise<void> {
		this._log(`Putting item with key '${key}'...`);
		await this._db.del(key);
	}

	public query(query: Query<T>): Promise<T[]> {
		this._log(`Querying items...`);
		return this._db.query<T>(query);
	}

	public async empty(): Promise<void> {
		await this._db.empty();
	}

	public async count(predicate?: Query<T>) {
		predicate = predicate || {};
		let results = await this.query(predicate);
		return results.length;
	}
}