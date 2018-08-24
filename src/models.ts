
export interface Database {
  get<TValue>(key: string): Promise<TValue>;
  set<TValue>(key: string, value: TValue): Promise<TValue>;
  del(key: string): Promise<void>;
}