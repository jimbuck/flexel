import { mkdir } from 'fs';
import { join as joinPath } from 'path';
import { test, GenericTestContext, Context } from 'ava';
import debug = require('debug');

import FlexelDatabase from '.';
import { LevelUp } from 'levelup';

const tempPath = joinPath(__dirname, '..', 'temp');

type DbFactory = () => FlexelDatabase;

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

test.before.cb(`Create temp folder`, t => {
	mkdir(tempPath, err => {
		if (err && err.code !== 'EEXIST') t.fail(JSON.stringify(err));
		t.end();
	});
});

test(`Accepts various constructors`, t => {
	const logger = debug('flexel-tests');
	const fakeDb = {} as LevelUp;

	t.notThrows(() => new FlexelDatabase());
	t.notThrows(() => new FlexelDatabase(logger));
	t.notThrows(() => new FlexelDatabase(getFilePath()));
	t.notThrows(() => new FlexelDatabase(getFilePath(), logger));
	t.throws(() => new FlexelDatabase(fakeDb));
	t.throws(() => new FlexelDatabase(fakeDb, logger));
});

test(`InMem  - Get and set values`, getSetTest, inMemDb);
test(`OnDisk - Get and set values`, getSetTest, onDiskDb);

test(`InMem  - Creates sublevel`, createSublevelTest, inMemDb);
test(`OnDisk - Creates sublevel`, createSublevelTest, onDiskDb);

test(`InMem  - Correctly handles dates`, handleDatesTest, inMemDb);
test(`OnDisk - Correctly handles dates`, handleDatesTest, onDiskDb);

test(`InMem  - Creates filo queue`, createQueueTest, inMemDb);
test(`OnDisk - Creates filo queue`, createQueueTest, onDiskDb);

test(`InMem  - Queue can peek`, queuePeekTest, inMemDb);
test(`OnDisk - Queue can peek`, queuePeekTest, onDiskDb);

test(`InMem  - Queue can count, query, and empty`, queueCountQueryEmptyTest, inMemDb);
test(`OnDisk - Queue can count, query, and empty`, queueCountQueryEmptyTest, onDiskDb);

test(`InMem  - Creates fifo stack`, createStackTest, inMemDb);
test(`OnDisk - Creates fifo stack`, createStackTest, onDiskDb);

test(`InMem  - Stack can peek`, stackPeekTest, inMemDb);
test(`OnDisk - Stack can peek`, stackPeekTest, onDiskDb);

test(`InMem  - Stack can count, query, and empty`, stackCountQueryEmptyTest, inMemDb);
test(`OnDisk - Stack can count, query, and empty`, stackCountQueryEmptyTest, onDiskDb);

test(`InMem  - Table provides static typing`, tableStaticTypingTest, inMemDb);
test(`OnDisk - Table provides static typing`, tableStaticTypingTest, onDiskDb);

test(`InMem  - Table can count, query, and empty`, tableCountQueryEmptyTest, inMemDb);
test(`OnDisk - Table can count, query, and empty`, tableCountQueryEmptyTest, onDiskDb);

test(`InMem  - Supports simple queries`, simpleQueryTest, inMemDb);
test(`OnDisk - Supports simple queries`, simpleQueryTest, onDiskDb);

test(`InMem  - Supports complex $and queries`, complexQueryTest, inMemDb);
test(`OnDisk - Supports complex $and queries`, complexQueryTest, onDiskDb);


async function getSetTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();

	const KEY = 'name';
	const EXPECTED_VALUE = 'jim';

	await db.put(KEY, EXPECTED_VALUE);

	const actualValue = await db.get<string>(KEY);

	t.is(actualValue, EXPECTED_VALUE);

	await db.del(KEY);

	const missingValue = await db.get<string>(KEY);

	t.is(missingValue, null);
}

function createSublevelTest(t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();
	const sub = db.sub('fifo');
	t.truthy(sub);
	t.truthy(sub.get && sub.put && sub.del && sub.sub);
}

async function handleDatesTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();
	const TARGET_KEY = 'objectWithDate';
	for (let i = 0; i < 10000; i++) {
		const [EXPECTED_VALUE] = randomComplex(1);
		await db.put(TARGET_KEY, EXPECTED_VALUE);
		const actualValue = await db.get<ComplexTestData>(TARGET_KEY);

		t.deepEqual(actualValue, EXPECTED_VALUE);
	}
}

async function createQueueTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();
	const queue = db.queue<BasicTestData>('filo');

	const [ITEM_1, ITEM_2, ITEM_3] = randomSimple(3);

	await queue.enqueue(ITEM_1);
	await queue.enqueue(ITEM_2);
	const first = await queue.dequeue();
	await queue.enqueue(ITEM_3);
	const second = await queue.dequeue();
	
	t.deepEqual(first, ITEM_1);
	t.deepEqual(second, ITEM_2);
}

async function queuePeekTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();
	const queue = db.queue<BasicTestData>('filo');

	t.is(await queue.peek(), null);

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
}

async function queueCountQueryEmptyTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();
	const queue = db.queue<BasicTestData>('filo');

	const items = randomSimple(100);

	for(let item of items) await queue.enqueue(item);
	
	t.is(await queue.count(), 100);
	const highCountNum = await queue.count({ count: { $gt: 10 } });
	t.true(highCountNum > 0 && highCountNum < 100);

	let highCount = await queue.query({ count: { $gt: 10 } });
	t.true(highCount.length > 0);
	t.true(highCount.every(x => x.count > 10));

	await queue.empty();
	t.is(await queue.count(), 0);
}

async function createStackTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();
	const stack = db.stack<BasicTestData>('filo');

	const [ITEM_1, ITEM_2, ITEM_3] = randomSimple(3);

	await stack.push(ITEM_1);
	await stack.push(ITEM_2);
	t.is(await stack.count(), 2);
	const first = await stack.pop();
	t.is(await stack.count(), 1);
	await stack.push(ITEM_3);
	t.is(await stack.count(), 2);
	const second = await stack.pop();
	t.is(await stack.count(), 1);

	t.deepEqual(first, ITEM_2);
	t.deepEqual(second, ITEM_3);
}

async function stackPeekTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();
	const stack = db.stack<BasicTestData>('filo');

	t.is(await stack.peek(), null);

	const [ITEM_1, ITEM_2] = randomSimple(2);

	await stack.push(ITEM_1);
	await stack.push(ITEM_2);

	let peek1 = await stack.peek();
	let peek2 = await stack.peek();
	t.deepEqual(peek1, ITEM_2);
	t.deepEqual(peek2, ITEM_2);

	const first = await stack.pop();
	t.deepEqual(first, ITEM_2);

	peek1 = await stack.peek();
	peek2 = await stack.peek();

	t.deepEqual(peek1, ITEM_1);
	t.deepEqual(peek2, ITEM_1);
}

async function stackCountQueryEmptyTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();
	const stack = db.stack<BasicTestData>('filo');

	const items = randomSimple(100);

	for(let item of items) await stack.push(item);
	
	t.is(await stack.count(), 100);
	const highCountNum = await stack.count({ count: { $gt: 10 } });
	t.true(highCountNum > 0 && highCountNum < 100);

	let highCount = await stack.query({ count: { $gt: 10 } });
	t.true(highCount.length > 0);
	t.true(highCount.every(x => x.count > 10));

	await stack.empty();
	t.is(await stack.count(), 0);
}

async function tableStaticTypingTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const fillCount = 1000;
	const db = getDb();
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
}

async function tableCountQueryEmptyTest(t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const db = getDb();
	const table = db.table<BasicTestData>('filo', 'name');

	const items = randomSimple(100);

	for (let item of items) await table.put(item);

	t.is(await table.count(), 100);
	const highCountNum = await table.count({ count: { $gt: 10 } });
	t.true(highCountNum > 0 && highCountNum < 100);

	let highCount = await table.query({ count: { $gt: 10 } });
	t.true(highCount.every(x => x.count > 10));

	await table.empty();
	t.is(await table.count(), 0);
}

async function simpleQueryTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const fillCount = 20;
	const db = getDb();
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
}

async function complexQueryTest (t: GenericTestContext<Context<any>>, getDb: DbFactory) {
	const fillCount = 20;
	const db = getDb();
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
}

function inMemDb() {
	return new FlexelDatabase();
}

function onDiskDb(path?: string, logger?: debug.IDebugger) {
	return new FlexelDatabase(path || getFilePath(), logger);
}

function getFilePath() {
	return joinPath(tempPath, 'db-' + (Math.floor(Math.random() * 900000) + 100000));
}

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