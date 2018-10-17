import { AbstractDatabase, Query, AbstractTable } from './models';
import { streamToArray } from './utils';

export class FlexelTable<TItem> implements AbstractTable<TItem> {

	private _db: AbstractDatabase;
	private _key: string;

	constructor(db: AbstractDatabase, key: string) {
		this._db = db;
		this._key = key;
	}

	public get(): Promise<TItem[]>;
	public get(key: string): Promise<TItem>;
	public async get(key?: string): Promise<TItem | TItem[]> {
		if (typeof key === 'undefined') {
			let arr = await streamToArray<TItem>(this._db.createReadStream());
			return arr.map(si => si.value);
		}

		return await this._db.get<TItem>(key);
	}

	public async put(item: TItem): Promise<TItem> {
		const key = (item as any)[this._key];
		await this._db.put<TItem>(key, item);

		return item;
	}

	public async del(key: string): Promise<void> {
		await this._db.del(key);
	}

	public async count() {
		let results = await this.query({});
		
		return results.length;
	}

	public query(query: Query<TItem>): Promise<TItem[]> {
		return this._db.query(query);
	}
}