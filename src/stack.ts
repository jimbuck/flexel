import { AbstractDatabase, StreamItem, AbstractStack, Query } from './models';
import { getTime, streamToArray, createLogger, Logger } from './utils';

const defaultLogger = createLogger('stack');

export class FlexelStack<T> implements AbstractStack<T> {

	private _db: AbstractDatabase;
	protected _log: Logger;

	constructor(db: AbstractDatabase, logger?: Logger) {
		this._db = db;
		
		this._log = logger || defaultLogger;
	}

	public async push(item: T): Promise<void> {
		const newId = getTime();
		this._log(`Pushing item ${newId}`);
		await this._db.put<T>(newId, item);
	}

	public async pop(): Promise<T> {
		const { key, value } = await this._peek();

		if (key === null) return null;

		this._log(`Popping item ${key}`);
		await this._db.del(key);

		return value;
	}

	public async peek(): Promise<T> {
		this._log(`Peeking...`);
		const { value } = await this._peek();
		return value;
	}

	public async count(predicate?: Query<T>) {
		predicate = predicate || {};
		let results = await this._db.query(predicate);
		return results.length;
	}

	public query(query: Query<T>): Promise<T[]> {
		this._log(`Querying: ${JSON.stringify(query)}`);
		return this._db.query(query);
	}

	public async empty(): Promise<void> {
		await this._db.empty();
	}

	private async _peek(): Promise<StreamItem<T>> {
		const stream = this._db.createReadStream({ limit: 1, reverse: true });

		try {
			const [headItem] = await streamToArray<T>(stream);

			return headItem || { key: null, value: null };
		} catch (err) {
			return { key: null, value: null };
		}
	}
}