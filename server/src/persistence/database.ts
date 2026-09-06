export interface PersistedDocument {
  _id: string;
  kind: string;
  owner: string;
  seq: number;
  createdAt: number;
  board: string;
  score: number;
  payload: unknown;
}

export interface DocumentQuery {
  kind: string;
  owner?: string;
  board?: string;
  before?: number;
  after?: number;
  order: 'seq' | 'score' | 'createdAt';
  direction: 'asc' | 'desc';
  limit: number;
}

export interface DocumentTransaction {
  get(id: string): Promise<PersistedDocument | null>;
  set(document: PersistedDocument): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface DocumentDatabase {
  ready(): Promise<void>;
  get(id: string): Promise<PersistedDocument | null>;
  query(query: DocumentQuery): Promise<PersistedDocument[]>;
  transaction<T>(callback: (transaction: DocumentTransaction) => Promise<T>): Promise<T>;
}

export class PersistenceError extends Error {
  constructor(public code: 'PERSISTENCE_UNAVAILABLE' | 'PERSISTENCE_LIMIT' | 'PERSISTENCE_CORRUPT', message: string) {
    super(message);
    this.name = 'PersistenceError';
  }
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function validateDocument(document: PersistedDocument): void {
  if (!/^[a-z]+_[a-f0-9]{48}$/.test(document._id)) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Invalid document identity');
  if (Buffer.byteLength(JSON.stringify(document), 'utf8') > 128 * 1024) throw new PersistenceError('PERSISTENCE_LIMIT', 'Document exceeds 128 KiB');
}

export class BoundedTransaction implements DocumentTransaction {
  private operations = 0;
  constructor(private transactionAdapter: DocumentTransaction, private now = Date.now()) {}
  private check(): void {
    if (++this.operations > 90 || Date.now() - this.now > 25000) throw new PersistenceError('PERSISTENCE_LIMIT', 'Transaction exceeds operation or time limit');
  }
  get(id: string): Promise<PersistedDocument | null> { this.check(); return this.transactionAdapter.get(id); }
  set(document: PersistedDocument): Promise<void> { this.check(); validateDocument(document); return this.transactionAdapter.set(document); }
  remove(id: string): Promise<void> { this.check(); return this.transactionAdapter.remove(id); }
}
