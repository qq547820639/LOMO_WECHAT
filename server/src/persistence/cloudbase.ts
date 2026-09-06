import cloudbase = require('@cloudbase/node-sdk');
import { BoundedTransaction, DocumentDatabase, DocumentQuery, DocumentTransaction, PersistedDocument, PersistenceError } from './database';

function encode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key.replace(/[%.$]/g, (character) => '%' + character.charCodeAt(0).toString(16)), encode(item)]));
  return value;
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key.replace(/%(25|2e|24)/g, (_match, code: string) => String.fromCharCode(parseInt(code, 16))), decode(item)]));
  return value;
}

function documentFrom(result: any, transactional = false): PersistedDocument | null {
  if (result?.code || result?.error) throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Database returned an error');
  const data = result?.data;
  if (transactional) {
    if (data === null) return null;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Unexpected SDK transaction document result');
    return decode(data) as PersistedDocument;
  }
  if (!Array.isArray(data)) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Unexpected SDK document result');
  return data.length ? decode(data[0]) as PersistedDocument : null;
}

function hasDatabaseCode(error: unknown, code: string): boolean {
  const candidate = error as { code?: unknown; message?: unknown; msg?: unknown } | null;
  if (candidate?.code === code) return true;
  let detail = typeof candidate?.msg === 'string' ? candidate.msg : '';
  if (typeof candidate?.message === 'string') {
    try { const parsed = JSON.parse(candidate.message); detail = typeof parsed?.msg === 'string' ? parsed.msg : ''; }
    catch { detail = candidate.message; }
  }
  return detail.includes(`[${code}]`);
}

export interface CloudBaseDatabaseOptions { env: string; collection: string; region?: string; secretId?: string; secretKey?: string; sessionToken?: string }

export class CloudBaseDocumentDatabase implements DocumentDatabase {
  private database: any;
  constructor(private options: CloudBaseDatabaseOptions) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{1,63}$/.test(options.collection) || !options.env) throw new Error('Invalid CloudBase persistence configuration');
    const accessKey = process.env.CLOUDBASE_APIKEY;
    const app = cloudbase.init({ env: options.env, region: options.region || 'ap-shanghai', endPointMode: 'CLOUD_API', timeout: 10000,
      ...(accessKey ? { accessKey } : options.secretId ? { secretId: options.secretId, secretKey: options.secretKey, sessionToken: options.sessionToken } : {}) } as any);
    this.database = app.database();
  }

  async ready(): Promise<void> { await this.query({ kind: 'schema', order: 'seq', direction: 'asc', limit: 1 }); }
  async get(id: string): Promise<PersistedDocument | null> { return documentFrom(await this.database.collection(this.options.collection).doc(id).get()); }
  async query(query: DocumentQuery): Promise<PersistedDocument[]> {
    if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 200) throw new PersistenceError('PERSISTENCE_LIMIT', 'Invalid query page size');
    const where: Record<string, unknown> = { kind: query.kind };
    if (query.owner !== undefined) where.owner = query.owner;
    if (query.board !== undefined) where.board = query.board;
    if (query.before !== undefined) where[query.order] = this.database.command.lt(query.before);
    if (query.after !== undefined) where[query.order] = this.database.command.gt(query.after);
    const result = await this.database.collection(this.options.collection).where(where).orderBy(query.order, query.direction).limit(query.limit).get();
    if (result?.code || result?.error || !Array.isArray(result?.data)) throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Database query failed');
    return result.data.map((document: unknown) => decode(document)) as PersistedDocument[];
  }

  async transaction<T>(callback: (transaction: DocumentTransaction) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt <= 8; attempt++) {
      const transaction = await this.database.startTransaction();
      try {
        const value = await callback(new BoundedTransaction({
          get: async (id) => documentFrom(await transaction.collection(this.options.collection).doc(id).get(), true),
          set: async (document) => {
            const { _id, ...body } = document;
            const result = await transaction.collection(this.options.collection).doc(_id).set(encode(body));
            if (result?.code || result?.error) throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Database write failed');
          },
          remove: async (id) => {
            const result = await transaction.collection(this.options.collection).doc(id).remove();
            if (result?.code || result?.error) throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Database delete failed');
          },
        }));
        await transaction.commit();
        return value;
      } catch (caught) {
        try { await transaction.rollback(); }
        catch (rollbackError) {
          if (!hasDatabaseCode(caught, 'DATABASE_TRANSACTION_CONFLICT') && !hasDatabaseCode(rollbackError, 'DATABASE_TRANSACTION_FAIL')) throw caught;
        }
        if (!hasDatabaseCode(caught, 'DATABASE_TRANSACTION_CONFLICT') || attempt === 8) throw caught;
        await new Promise((resolve) => setTimeout(resolve, Math.min(500, 20 * 2 ** attempt)));
      }
    }
    throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Transaction conflict retry limit reached');
  }
}
