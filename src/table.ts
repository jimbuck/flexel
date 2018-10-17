import { AbstractDatabase, Query, AbstractTable } from './models';
import { streamToArray, createLogger, Logger } from './utils';

const defaultLogger = createLogger('table');

export class FlexelTable<TItem> implements AbstractTable<TItem> {

	private _db: AbstractDatabase;
	private _key: string;
	protected _log: Logger;

	constructor(db: AbstractDatabase, key: string, logger?: Logger) {
		this._db = db;
		this._key = key;
		this._log = logger || defaultLogger;
	}

	public get(): Promise<TItem[]>;
	public get(key: string): Promise<TItem>;
	public async get(key?: string): Promise<TItem | TItem[]> {
		if (typeof key === 'undefined') {
			this._log(`Getting all items...`);
			let arr = await streamToArray<TItem>(this._db.createReadStream());
			return arr.map(si => si.value);
		}

		this._log(`Getting item with key '${key}'...`);
		return await this._db.get<TItem>(key);
	}

	public async put(item: TItem): Promise<TItem> {
		const key = (item as any)[this._key];
		this._log(`Putting item with key '${key}'...`);
		await this._db.put<TItem>(key, item);
		return item;
	}

	public async del(key: string): Promise<void> {
		this._log(`Putting item with key '${key}'...`);
		await this._db.del(key);
	}

	public async count() {
		let results = await this.query({});
		
		return results.length;
	}

	public query(query: Query<TItem>): Promise<TItem[]> {
		this._log(`Querying: ${JSON.stringify(query)}`);
		return this._db.query(query);
	}
}