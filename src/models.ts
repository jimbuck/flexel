
export interface AbstractDatabase {
	get<TValue>(key: any): Promise<TValue>;
	set<TValue>(key: any, value: TValue): Promise<TValue>;
	del(key: any): Promise<void>;
	createReadStream(options?: ReadStreamOptions): NodeJS.ReadableStream;
	sub(namespace: string): AbstractDatabase;
	queue<TQueueType>(namespace: string): AbstractQueue<TQueueType>;
	stack<TStackType>(namespace: string): AbstractStack<TStackType>;
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