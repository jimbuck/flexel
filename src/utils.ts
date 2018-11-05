import { Writable, } from 'stream';
const debug = require('debug');
const toArray = require('stream-to-array');
const streamEach = require('stream-each');

import { StreamItem } from './models';

export type Logger = (msg: string) => void;

export function createLogger(namespace: string): Logger {
	return debug(`flexel:${namespace}`);
}

export function isLogger<T>(fn: T | Logger): fn is Logger {
	return typeof fn === 'function';
}

export function getTime(): number {
	const [sec, nano] = process.hrtime();
	return sec * 1000000000 + nano;
}

export function dePromise<T=void>() {
	let resolve: (value?: T | PromiseLike<T>) => void;
	let reject: (reason?: any) => void;
	let promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

export function streamForEach<T>(stream: NodeJS.ReadableStream, action: (item: T) => any): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		streamEach(stream, (item: T, next: () => void) => {
			Promise.resolve(action(item)).then(next);
		}, (err: any) => {
			if (err) reject(err);
			else resolve();
		});
	});
}

export function streamToArray<T>(stream: NodeJS.ReadableStream) {
	return toArray(stream) as Array<StreamItem<T>>
}

const DATE_REGEX = /^FLEXEL\|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function dateReviver(key: string, value: any): Date | any {
	if (typeof value === 'string' && DATE_REGEX.test(value)) {
		return new Date(value.slice(7));
	}

	return value;
}

function encodeDates(data: any): any {
	if (data === null || typeof data === 'undefined') return data;

	if (data instanceof Date) return `FLEXEL|${data.toISOString()}`;

	if (typeof data === 'object' && data.constructor === Object) {
		let newObj: any = {};
		for (let prop in data) {
			newObj[prop] = encodeDates(data[prop]);
		}
		return newObj;
	}

	return data;
}

export const advancedJsonEncoding = {
	encode: (obj: any) => JSON.stringify(encodeDates(obj)),
	decode: (json: string) => JSON.parse(json, dateReviver),
	buffer: false,
	type: 'advanced-json'
};