import { FlexelDatabase } from '.';

(async () => {
	let db = new FlexelDatabase();

	let sub1 = db.sub('test');

	class Thing {
		constructor(name: string, count: number, value: number) {
			this.name = name;
			this.count = count;
			this.value = value;
		}
		name: string;
		count: number;
		value: number;
	}

	await sub1.put('slot1', new Thing('copper', 200, 8));
	await sub1.put('slot2', new Thing('iron', 100, 10));
	await sub1.put('slot3', new Thing('gold', 150, 20));
	await sub1.put('slot4', new Thing('diamonds', 50, 35));
	await sub1.put('slot5', new Thing('iron', 125, 10));

	let expensiveItems = await sub1.query<Thing>({ value: { $gt: 10 } });
	let largestIronSlot = await sub1.query<Thing>({ $and: [{ name: 'iron' }, { count: { $gt: 100 } }] });

	let stack1 = sub1.stack<number>('stack-a');
	let stack2 = sub1.stack<boolean>('stack-b');

	stack1.push(7);
	stack2.push(true);
	stack2.push(true);
	stack2.push(false);
})();


