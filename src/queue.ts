
import { AbstractDatabase, AbstractQueue, StreamItem, Query } from './models';
import { getTime, streamToArray, createLogger, Logger } from './utils';

const defaultLogger = createLogger('queue');

export class FlexelQueue<T> implements AbstractQueue<T> {
	
	private _db: AbstractDatabase;
	protected _log: Logger;

	constructor(db: AbstractDatabase, logger?: Logger) {
		this._db = db;
		this._log = logger || defaultLogger;
	}

	public async enqueue(item: T): Promise<void> {
		const newId = getTime();
		this._log(`Enqueuing item ${newId}`);
		await this._db.put<T>(newId, item);
	}

	public async dequeue(): Promise<T> {
		const { key, value } = await this._peek();
	 
		if (key === null) return null;
		
		this._log(`Dequeuing item ${key}`);
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
		const stream = this._db.createReadStream({ limit: 1 });

		try {
			const [headItem] = await streamToArray<T>(stream);

			return headItem;
		} catch (err) {
			return { key: null, value: null };
		}
	}
}