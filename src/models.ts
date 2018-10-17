import { LevelUp } from 'levelup';

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

let db: AbstractDatabase;

class TestThing {
	name: string;
	count: number;
}

class OtherThing {
	id: string;
	value: number;
	child: TestThing;
}

db.query<TestThing>({ name: 'Jim' });
db.query<TestThing>({ $and: [{ name: 'Jim' }, { count: 2 }] });
db.query<TestThing>({ $or: [{ name: 'Jim' }, { count: 2 }] });
db.query<TestThing>({ count: { $ne: 5 } });
db.query<TestThing>({ $and: [{ count: { $gt: 4 } }, { $or: [] }] });
db.query<OtherThing>({ child: { $elemMatch: { name: 'Jim' } } });

export type Query<T> = BinaryQueryCondition<T> | QueryValue<T> | PathQuery;

export interface OrQueryCondition<T> {
	$or: Array<Query<T>>;
}

export interface AndQueryCondition<T> {
	$and: Array<Query<T>>;
}

export type BinaryQueryCondition<T> = OrQueryCondition<T> | AndQueryCondition<T>;

export interface NotEqualQueryCondition<P> {
	$ne: P;
}

export interface LessThanQueryCondition<P> {
	$lt: P;
}

export interface LessThanOrEqualQueryCondition<P> {
	$lte: P;
}

export interface GreaterThanQueryCondition<P> {
	$gt: P;
}

export interface GreaterThanOrEqualQueryCondition<P> {
	$gte: P;
}

export interface ModQueryCondition {
	$mod: [number, number];
}

export interface InQueryCondition<P> {
	$in: Array<P>
}

export interface NotInQueryCondition<P> {
	$nin: Array<P>
}

export interface AllQueryCondition<P> {
	$all: Array<P>;
}

export interface ElemMatchQueryCondition<P> {
	$elemMatch: Partial<P>;
}

export type BaseCondition<P> =
	LessThanQueryCondition<P> |
	LessThanOrEqualQueryCondition<P> |
	GreaterThanQueryCondition<P> |
	GreaterThanOrEqualQueryCondition<P> |
	ModQueryCondition |
	NotEqualQueryCondition<P> |
	InQueryCondition<P> |
	NotInQueryCondition<P> |
	AllQueryCondition<P> |
	ElemMatchQueryCondition<P>;

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

export interface AbstractQueue<T> {
	enqueue(item: T): Promise<T>;
	dequeue(): Promise<T>;
	peek(): Promise<T>;
	empty(): Promise<void>;
}

export interface AbstractStack<T> {
	push(item: T): Promise<T>;
	pop(): Promise<T>;
	peek(): Promise<T>;
	empty(): Promise<void>;
}