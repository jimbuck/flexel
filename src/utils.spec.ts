import { test } from 'ava';

import { advancedJsonEncoding } from './utils';

test(`advancedJsonEncoding correctly serializes raw dates`, t => {
	const date = new Date();
	const EXPECTED_JSON = `"FLEXEL|${date.toISOString()}"`;
	const actualJSON = advancedJsonEncoding.encode(date);
	t.is(actualJSON, EXPECTED_JSON);
});

test(`advancedJsonEncoding correctly deserializes raw dates`, t => {
	const EXPECTED_DATE = new Date();
	const json = `"FLEXEL|${EXPECTED_DATE.toISOString()}"`;
	const actualDate = advancedJsonEncoding.decode(json);
	t.deepEqual(actualDate, EXPECTED_DATE);
});

test(`advancedJsonEncoding correctly serializes nested dates`, t => {
	const obj = { birthdate: new Date() };
	const EXPECTED_JSON = `{"birthdate":"FLEXEL|${obj.birthdate.toISOString()}"}`;
	const actualJSON = advancedJsonEncoding.encode(obj);
	t.is(actualJSON, EXPECTED_JSON);
});

test(`advancedJsonEncoding correctly deserializes nested dates`, t => {
	const EXPECTED_OBJ = { birthdate: new Date() };
	const json = `{"birthdate":"FLEXEL|${EXPECTED_OBJ.birthdate.toISOString()}"}`;
	const actualObj = advancedJsonEncoding.decode(json);
	t.deepEqual(actualObj, EXPECTED_OBJ);
});

test(`advancedJsonEncoding correctly serializes deeply nested dates`, t => {
	const obj = { birthdate: new Date(), child: { birthdate: new Date() } };
	const EXPECTED_JSON = `{"birthdate":"FLEXEL|${obj.birthdate.toISOString()}","child":{"birthdate":"FLEXEL|${obj.child.birthdate.toISOString()}"}}`;
	const actualJSON = advancedJsonEncoding.encode(obj);
	t.is(actualJSON, EXPECTED_JSON);
});

test(`advancedJsonEncoding correctly deserializes deeply nested dates`, t => {
	const EXPECTED_OBJ = { birthdate: new Date(), child: { birthdate: new Date() } };
	const json = `{"birthdate":"FLEXEL|${EXPECTED_OBJ.birthdate.toISOString()}","child":{"birthdate":"FLEXEL|${EXPECTED_OBJ.child.birthdate.toISOString()}"}}`;
	const actualObj = advancedJsonEncoding.decode(json);
	t.deepEqual(actualObj, EXPECTED_OBJ);
});