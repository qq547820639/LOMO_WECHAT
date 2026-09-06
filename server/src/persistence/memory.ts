import { BoundedTransaction, clone, DocumentDatabase, DocumentQuery, DocumentTransaction, PersistedDocument, PersistenceError } from './database';

export class MemoryDocumentDatabase implements DocumentDatabase {
  private documents = new Map<string, { revision: number; document: PersistedDocument }>();
  private revision = 0;
  available = true;
  failWriteAt = 0;
  committed = 0;
  conflicts = 0;
  maxOperations = 0;
  afterCommit?: (documents: PersistedDocument[]) => void;

  async ready(): Promise<void> { this.check(); }
  private check(): void { if (!this.available) throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Database unavailable'); }
  async get(id: string): Promise<PersistedDocument | null> { this.check(); return clone(this.documents.get(id)?.document ?? null); }
  async query(query: DocumentQuery): Promise<PersistedDocument[]> {
    this.check();
    return Array.from(this.documents.values()).map((entry) => entry.document)
      .filter((entry) => entry.kind === query.kind && (query.owner === undefined || entry.owner === query.owner) && (query.board === undefined || entry.board === query.board)
        && (query.before === undefined || entry[query.order] < query.before) && (query.after === undefined || entry[query.order] > query.after))
      .sort((left, right) => (left[query.order] - right[query.order]) * (query.direction === 'asc' ? 1 : -1) || left._id.localeCompare(right._id))
      .slice(0, query.limit).map(clone);
  }

  async transaction<T>(callback: (transaction: DocumentTransaction) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 25; attempt++) {
      this.check();
      const snapshot = new Map(this.documents);
      const reads = new Map<string, number>();
      const writes = new Map<string, PersistedDocument | null>();
      let operations = 0;
      let writeCount = 0;
      const transaction: DocumentTransaction = {
        get: async (id) => {
          operations++;
          reads.set(id, snapshot.get(id)?.revision ?? 0);
          return clone(writes.has(id) ? writes.get(id)! : snapshot.get(id)?.document ?? null);
        },
        set: async (document) => {
          operations++;
          if (this.failWriteAt > 0 && ++writeCount === this.failWriteAt) throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Injected write failure');
          if (!reads.has(document._id)) reads.set(document._id, snapshot.get(document._id)?.revision ?? 0);
          writes.set(document._id, clone(document));
        },
        remove: async (id) => {
          operations++;
          if (!reads.has(id)) reads.set(id, snapshot.get(id)?.revision ?? 0);
          writes.set(id, null);
        },
      };
      const result = await callback(new BoundedTransaction(transaction));
      this.check();
      this.maxOperations = Math.max(this.maxOperations, operations);
      if (Array.from(reads).some(([id, revision]) => (this.documents.get(id)?.revision ?? 0) !== revision)) { this.conflicts++; continue; }
      for (const [id, document] of writes) {
        if (document) this.documents.set(id, { revision: ++this.revision, document });
        else this.documents.delete(id);
      }
      this.committed++;
      this.afterCommit?.(Array.from(writes.values()).filter((entry): entry is PersistedDocument => entry !== null));
      return result;
    }
    throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Transaction contention');
  }

  snapshot(): PersistedDocument[] { return Array.from(this.documents.values()).map((entry) => clone(entry.document)); }
}
