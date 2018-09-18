import { test } from 'ava';

import FlexelDatabase from '.';

interface BasicTestData {
	name: string;
	purchased: string; // (fake date)
	count: number;
}

interface ComplexTestData {
	name: string;
	wanted: boolean;
	dateOfBirth: Date;
	charges: number;
	inventory: {
		size: number;
		name: string;
		items: BasicTestData[]
	}
}

test(`Get and set values`, async (t) => {
	const db = new FlexelDatabase();

	const KEY = 'name';
	const EXPECTED_VALUE = 'jim';

	await db.set(KEY, EXPECTED_VALUE);

	const actualValue = await db.get<string>(KEY);

	t.is(actualValue, EXPECTED_VALUE);

	await db.del(KEY);

	const missingValue = await db.get<string>(KEY);

	t.is(missingValue, null);
});

test(`Creates sublevel`, t => {
	const db = new FlexelDatabase();
	const sub = db.sub('fifo');
	t.truthy(sub);
	t.truthy(sub.get && sub.set && sub.del && sub.sub);
});

test('Correctly handles dates', async t => {
	const TARGET_KEY = 'objectWithDate';
	const db = new FlexelDatabase();
	for (let i = 0; i < 10000; i++) {
		const [EXPECTED_VALUE] = randomComplex(1);
		await db.set(TARGET_KEY, EXPECTED_VALUE);
		const actualValue = await db.get<ComplexTestData>(TARGET_KEY);

		t.deepEqual(actualValue, EXPECTED_VALUE);
	}
});

test(`Creates filo queue`, async (t) => {
	const db = new FlexelDatabase();
	const queue = db.queue<BasicTestData>('filo');

	const [ITEM_1, ITEM_2, ITEM_3] = randomSimple(3);

	await queue.enqueue(ITEM_1);
	await queue.enqueue(ITEM_2);
	const first = await queue.dequeue();
	await queue.enqueue(ITEM_3);
	const second = await queue.dequeue();
	
	t.deepEqual(first, ITEM_1);
	t.deepEqual(second, ITEM_2);
});

test(`Queue can peek`, async (t) => {
	const db = new FlexelDatabase();
	const queue = db.queue<BasicTestData>('filo');

	const [ITEM_1, ITEM_2] = randomSimple(2);

	await queue.enqueue(ITEM_1);
	await queue.enqueue(ITEM_2);

	let peek1 = await queue.peek();
	let peek2 = await queue.peek();
	t.deepEqual(peek1, ITEM_1);
	t.deepEqual(peek2, ITEM_1);

	const first = await queue.dequeue();
	t.deepEqual(first, peek1);

	peek1 = await queue.peek();
	peek2 = await queue.peek();

	t.deepEqual(peek1, ITEM_2);
	t.deepEqual(peek2, ITEM_2);
});

test(`Creates fifo stack`, async (t) => {
	const db = new FlexelDatabase();
	const queue = db.stack<BasicTestData>('filo');

	const [ITEM_1, ITEM_2, ITEM_3] = randomSimple(3);

	await queue.push(ITEM_1);
	await queue.push(ITEM_2);
	const first = await queue.pop();
	await queue.push(ITEM_3);
	const second = await queue.pop();

	t.deepEqual(first, ITEM_2);
	t.deepEqual(second, ITEM_3);
});

test(`Stack can peek`, async (t) => {
	const db = new FlexelDatabase();
	const queue = db.stack<BasicTestData>('filo');

	const [ITEM_1, ITEM_2] = randomSimple(2);

	await queue.push(ITEM_1);
	await queue.push(ITEM_2);

	let peek1 = await queue.peek();
	let peek2 = await queue.peek();
	t.deepEqual(peek1, ITEM_2);
	t.deepEqual(peek2, ITEM_2);

	const first = await queue.pop();
	t.deepEqual(first, ITEM_2);

	peek1 = await queue.peek();
	peek2 = await queue.peek();

	t.deepEqual(peek1, ITEM_1);
	t.deepEqual(peek2, ITEM_1);
});

function randomDate() {
	let ms = Math.floor(Math.random() * 200000000) - 100000000;
	return new Date(ms);
}

function randomString() {
	return Math.random().toString(36).substring(2, 15);
}

function randomBool() {
	return Math.random() < 0.5;
}

function randomInt(min: number, max: number) {
	let range = (max + 1) - min;
	return Math.floor(Math.random() * range) + min;
}

function randomSimple(count: number): Array<BasicTestData> {
	return Array(count).fill(0).map(_ => ({
		name: randomString(),
		purchased: randomDate().toISOString(),
		count: randomInt(1, 20)
	}));
}

function randomComplex(count: number): Array<ComplexTestData> {
	return Array(count).fill(0).map(_ => ({
		name: randomString(),
		wanted: randomBool(),
		dateOfBirth: randomDate(),
		charges: randomInt(0, 2),
		inventory: {
			name: randomString(),
			size: randomInt(1, 10),
			items: randomSimple(randomInt(1, 3))
		}
	}));
}