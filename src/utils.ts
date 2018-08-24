const uuid = require('uuid/v4');

export function guid(): string {
  return uuid();
}