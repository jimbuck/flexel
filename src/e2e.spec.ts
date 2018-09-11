import { test } from 'ava';

import { flexel } from '.';

interface TestData {
  name: string;
  age: number;
}

test(`Get and set values`, async (t) => {
  const db = flexel();

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
  const db = flexel();
  const sub = db.sub('fifo');
  t.truthy(sub);
  t.truthy(sub.get && sub.set && sub.del && sub.sub);
});

test(`Creates filo queue`, async (t) => {
  const db = flexel();
  const queue = db.queue<TestData>('filo');

  const ITEM_1 = { name: 'adam', age: 10 };
  const ITEM_2 = { name: 'billy', age: 20 };
  const ITEM_3 = { name: 'carl', age: 30 };

  await queue.enqueue(ITEM_1);
  await queue.enqueue(ITEM_2);
  const first = await queue.dequeue();
  await queue.enqueue(ITEM_3);
  const second = await queue.dequeue();
  
  t.deepEqual(first, ITEM_1);
  t.deepEqual(second, ITEM_2);
});

test(`Queue can peek`, async (t) => {
  const db = flexel();
  const queue = db.queue<TestData>('filo');

  const ITEM_1 = { name: 'adam', age: 10 };
  const ITEM_2 = { name: 'billy', age: 20 };

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
  const db = flexel();
  const queue = db.stack<TestData>('filo');

  const ITEM_1 = { name: 'adam', age: 10 };
  const ITEM_2 = { name: 'billy', age: 20 };
  const ITEM_3 = { name: 'carl', age: 30 };

  await queue.push(ITEM_1);
  await queue.push(ITEM_2);
  const first = await queue.pop();
  await queue.push(ITEM_3);
  const second = await queue.pop();

  t.deepEqual(first, ITEM_2);
  t.deepEqual(second, ITEM_3);
});

test(`Stack can peek`, async (t) => {
  const db = flexel();
  const queue = db.stack<TestData>('filo');

  const ITEM_1 = { name: 'adam', age: 10 };
  const ITEM_2 = { name: 'billy', age: 20 };

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