const debug = require('debug');


export function createLogger(namespace: string): (msg: string) => void {
  return debug(namespace);
}

export function getTime(): number {
  const [sec, nano] = process.hrtime();
  return sec * 1000000000 + nano;
}

export function dePromise() {
  let resolve, reject;
  let promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

export async function streamForEach<T>(stream: NodeJS.ReadableStream, action: (item: T) => any): Promise<void> {
  let actionsDone = Promise.resolve();
  const { promise: streamDone, resolve: streamDoneResolve, reject: streamDoneReject } = dePromise();

  stream.on('data', item => actionsDone = actionsDone.then(() => action(item)));
  stream.on('error', streamDoneReject);
  stream.on('end', streamDoneResolve);
  stream.resume();

  await Promise.all([streamDone, actionsDone]);
}

export async function streamMap<TItem, TResult = TItem>(stream: NodeJS.ReadableStream, action: (item: TItem) => TResult | Promise<TResult>): Promise<Array<TResult>> {
  let actionsDone: Promise<any> = Promise.resolve();
  const { promise: streamDone, resolve: streamDoneResolve, reject: streamDoneReject } = dePromise();

  const results: Array<TResult | Promise<TResult>> = [];

  stream.on('data', item => {
    actionsDone = actionsDone.then(() => {
      let act = action(item);
      results.push(act);
      return act;
    });
  });
  stream.on('error', streamDoneReject);
  stream.on('end', streamDoneResolve);
  stream.resume();

  await Promise.all([streamDone, actionsDone]);

  return await Promise.all(results);
}