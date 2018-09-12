# flexel

_Short Description_

[![Build Status](https://img.shields.io/travis/JimmyBoh/flexel/master.svg?style=flat-square)](https://travis-ci.org/JimmyBoh/flexel)
[![Code Coverage](https://img.shields.io/coveralls/JimmyBoh/flexel/master.svg?style=flat-square)](https://coveralls.io/github/JimmyBoh/flexel?branch=master)
[![Dependencies](https://img.shields.io/david/JimmyBoh/flexel.svg?style=flat-square)](https://david-dm.org/JimmyBoh/flexel)
[![DevDependencies](https://img.shields.io/david/dev/JimmyBoh/flexel.svg?style=flat-square)](https://david-dm.org/JimmyBoh/flexel?type=dev)
[![npm](https://img.shields.io/npm/v/flexel.svg?style=flat-square)](https://www.npmjs.com/package/flexel)
[![Monthly Downloads](https://img.shields.io/npm/dm/flexel.svg?style=flat-square)](https://www.npmjs.com/package/flexel)
[![Total Downloads](https://img.shields.io/npm/dt/flexel.svg?style=flat-square)](https://www.npmjs.com/package/flexel)


*Long Description*


## Example:

```ts
import Flexel from 'flexel';

const db = new Flexel(); // in memory
const db = new Flexel('/path/to/db'); // on disk
const db = new Flexel(someLevelUpInstance); // custom levelup instance (use any leveldown store)

await db.put('project', someObject);
let result = await db.get('project'); // returns someObject

db.createReadStream().pipe(/* ... */) // Same options as Level.

const subDB = db.sub('subarea'); // sublevel instance
const queue = db.queue('queueNamespace'); // async enqueue, dequeue, peek
const stack = db.stack('stackNamespace'); // async push, pop, peek
```


## Features:
 - _Coming soon_
 
## Contribute
 
 0. Fork it
 1. `npm i`
 2. `npm run watch`
 3. Make changes and **write tests**.
 4. Send pull request! :sunglasses:
 
## License:
 
MIT