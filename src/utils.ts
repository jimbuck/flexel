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

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function dateReviver(key: string, value: any) {
  if (typeof value === 'string' && DATE_REGEX.test(value)) {
    //console.log(`DATE: |${value}|`);
    return new Date(value);
  }

  return value;
}

export const advancedJsonEncoding = {
  encode: JSON.stringify,
  decode: (json: string) => JSON.parse(json, dateReviver),
  buffer: false,
  type: 'advanced-json'
};