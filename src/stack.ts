import { AbstractDatabase, StreamItem, AbstractStack, Query } from './models';
import { streamForEach, getTime, streamToArray } from './utils';

export class FlexelStack<T> implements AbstractStack<T> {

	private _db: AbstractDatabase;

	constructor(db: AbstractDatabase) {
		this._db = db;
	}

	public async push(item: T): Promise<T> {
		const newId = getTime();
		await this._db.put<T>(newId, item);

		return item;
	}

	public async pop(): Promise<T> {
		const { key, value } = await this._peek();

		if (key === null) return null;

		await this._db.del(key);

		return value;
	}

	public async peek(): Promise<T> {
		const { value } = await this._peek();
		return value;
	}

	public async count() {
		let results = await this.query({});
		
		return results.length;
	}

	public query(query: Query<T>): Promise<T[]> {
		return this._db.query(query);
	}

	public async empty(): Promise<void> {
		await streamForEach<T>(this._db.createReadStream(), item => this._db.del(item.key));
	}

	private async _peek(): Promise<StreamItem<T>> {
		const stream = this._db.createReadStream({ limit: 1, reverse: true });

		try {
			const [headItem] = await streamToArray<T>(stream);

			return headItem;
		} catch (err) {
			return { key: null, value: null };
		}
	}
}