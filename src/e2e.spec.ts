import { test } from 'ava';

import FlexelDatabase from '.';

interface BasicTestData {
	name: string;
	purchased: string; // (fake date)
	count: number;
	enabled: boolean;
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

	await db.put(KEY, EXPECTED_VALUE);

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
	t.truthy(sub.get && sub.put && sub.del && sub.sub);
});

test('Correctly handles dates', async t => {
	const TARGET_KEY = 'objectWithDate';
	const db = new FlexelDatabase();
	for (let i = 0; i < 10000; i++) {
		const [EXPECTED_VALUE] = randomComplex(1);
		await db.put(TARGET_KEY, EXPECTED_VALUE);
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

test(`Queue can query and empty`, async (t) => {
	const db = new FlexelDatabase();
	const queue = db.queue<BasicTestData>('filo');

	const items = randomSimple(100);

	for(let item of items) await queue.enqueue(item);
	
	let highCount = await queue.query({ count: { $gt: 10 } });
	t.true(highCount.length > 0);
	t.true(highCount.every(x => x.count > 10));

	await queue.empty();
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

test(`Table provides static typing`, async (t) => {
	const fillCount = 1000;
	const db = new FlexelDatabase();
	const table = db.table<BasicTestData>('table-test', 'name');

	const items = randomSimple(fillCount);
	const [item1, item2] = items;

	for (let item of items) {
		await table.put(item);
	}

	let all = await table.get();
	t.is(all.length, fillCount);

	let current = await table.get(item1.name);
	t.deepEqual(current, item1);

	await table.del(item2.name);
	let missing = await table.get(item2.name);
	t.is(missing, null);
	await table.put(item2);
	let notMissing = await table.get(item2.name);
	t.deepEqual(notMissing, item2);

	let noQuery = await table.query({});
	t.is(noQuery.length, fillCount);
});

test(`Supports mongodb queries`, async t => {
	const fillCount = 20;
	const db = new FlexelDatabase();
	const table = db.table<BasicTestData>('table-test', 'name');

	const items = randomSimple(fillCount);

	for (let item of items) {
		await table.put(item);
	}

	let all = await table.get();
	t.is(all.length, fillCount);

	let allEnabled = await table.query({ enabled: true });
	t.true(allEnabled.length > 0);
	t.true(allEnabled.every(x => x.enabled));

	let enabledAndHighCount = await table.query({ enabled: true, count: { $gt: 10 } });
	t.true(enabledAndHighCount.length > 0);
	t.true(enabledAndHighCount.every(x => x.enabled && x.count > 10));
});

test(`Supports complex $and queries`, async t => {
	const fillCount = 20;
	const db = new FlexelDatabase();
	const table = db.table<BasicTestData>('table-test', 'name');

	const items = randomSimple(fillCount);

	for (let item of items) {
		await table.put(item);
	}

	let all = await table.get();
	t.is(all.length, fillCount);

	let midCount = await table.query({ $and: [{ count: { $gt: 7 } }, { count: { $lte: 14 } }] });
	t.true(midCount.length > 0);
	t.true(midCount.every(x => x.count > 7 && x.count <= 14));
	
	midCount = await table.query({ count: { $gt: 7, $lte: 14 } });
	t.true(midCount.length > 0);
	t.true(midCount.every(x => x.count > 7 && x.count <= 14));
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
		count: randomInt(1, 20),
		enabled: randomBool()
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