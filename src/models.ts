export interface AbstractDatabase {
	get<TValue>(key: any): Promise<TValue>;
	put<TValue>(key: any, value: TValue): Promise<TValue>;
	del(key: any): Promise<void>;
	query<TValue>(query: Query<TValue>): Promise<TValue[]>;
	createReadStream(options?: ReadStreamOptions): NodeJS.ReadableStream;
	sub(namespace: string): AbstractDatabase;
	queue<TQueueType>(namespace: string): AbstractQueue<TQueueType>;
	stack<TStackType>(namespace: string): AbstractStack<TStackType>;
}

export type Query<T> = BinaryQueryCondition<T> | QueryValue<T> | PathQuery;

export interface OrQueryCondition<T> {
	$or: Array<Query<T>>;
}

export interface AndQueryCondition<T> {
	$and: Array<Query<T>>;
}

export type BinaryQueryCondition<T> = OrQueryCondition<T> | AndQueryCondition<T>;

export interface BaseCondition<P> {
	$lt: P;
	$lte: P;
	$gt: P;
	$gte: P;
	$mod: [number, number];
	$ne: P;
	$in: Array<P>
	$nin: Array<P>
	$all: Array<P>;
	$elemMatch: Partial<P>;
}

export type PathQuery = {
	[path: string]: any;
}
export type QueryValue<T> = {
	[P in keyof T]?: T[P] | BaseCondition<T[P]>;
}

export interface StreamItem<T> {
	key: any;
	value: T;
}

export interface IteratorOptions {
	gt?: number;
	lt?: number;
	reverse?: boolean;
	limit?: number;
}

export interface ReadStreamOptions extends IteratorOptions {
	keys?: boolean;
	values?: boolean;
}

export interface AbstractTable<T> {
	get(): Promise<T[]>;
	get(key: string): Promise<T>;
	put(item: T): Promise<T>;
	del(key: string): Promise<void>;
	count(): Promise<number>;
	query(query: Query<T>): Promise<T[]>;
}

export interface AbstractQueue<T> {
	enqueue(item: T): Promise<T>;
	dequeue(): Promise<T>;
	peek(): Promise<T>;
	count(): Promise<number>;
	query(query: Query<T>): Promise<T[]>;
	empty(): Promise<void>;
}

export interface AbstractStack<T> {
	push(item: T): Promise<T>;
	pop(): Promise<T>;
	peek(): Promise<T>;
	count(): Promise<number>;
	query(query: Query<T>): Promise<T[]>;
	empty(): Promise<void>;
}