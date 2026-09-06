/**
 * 服务端内存存储（可 JSON 快照持久化）。
 * Auth Gateway / Player / Session / Rank / Mail / Market / Telemetry。
 */
import { Ledger } from '../../shared/src/ledger';
import { AssetId } from '../../shared/src/assets';
import { CardTemplate } from '../../shared/src/registry';

export interface InventoryEntry { qty: number; lockedQty: number; attrs?: Record<string, number | string | boolean> }

export interface PlayerRecord {
  playerId: string;
  openId: string;
  nick: string;
  level: number;
  xp: number;
  counters: Record<string, number>;
  timestamps: Record<string, number>;
  inventory: Record<string, InventoryEntry>;
  createdAt: number;
}

export interface SessionRecord {
  sessionId: string;
  playerId: string;
  featureId: string;
  mechanicId?: string;
  seed: string;
  createdAt: number;
  updatedAt: number;
  clientSeq: number;
  serverSeq: number;
  data: Record<string, unknown>;
  finished: boolean;
}

export interface MailRecord {
  mailId: string;
  playerId: string;
  title: string;
  body: string;
  rewards: { assetId: AssetId; delta: number }[];
  items?: { templateId: string; qty: number }[];
  claimed: boolean;
  read: boolean;
  createdAt: number;
}

export interface ListingRecord {
  listingId: string;
  sellerId: string;
  assetId?: AssetId;
  templateId?: string;
  qty: number;
  unitPrice: number;
  kind: 'market' | 'consignment' | 'auction';
  createdAt: number;
  expiresAt: number;
  topBid?: number;
  topBidder?: string;
  closed?: boolean;
}

export interface StoreData {
  players: Record<string, PlayerRecord>;
  openIdIndex: Record<string, string>;
  sessions: Record<string, SessionRecord>;
  mails: MailRecord[];
  listings: Record<string, ListingRecord>;
  ranks: Record<string, Record<string, number>>;
  history: Record<string, Array<{ id: string; featureId: string; summary: string; createdAt: number; rewards?: { assetId: AssetId; delta: number }[] }>>;
  telemetry: { name: string; at: number; props?: Record<string, unknown> }[];
  inviteTokens: Record<string, { inviterId: string; createdAt: number; usedBy?: string }>;
  audit: Array<{ at: number; playerId: string; kind: string; detail?: unknown }>;
}

export class Store {
  data: StoreData = {
    players: {}, openIdIndex: {}, sessions: {}, mails: [], listings: {}, ranks: {}, history: {}, telemetry: [], inviteTokens: {}, audit: [],
  };
  ledger: Ledger;
  cards: CardTemplate[] = [];
  private persistPath: string | null = null;
  private dirty = false;

  constructor(txnIdGen: () => string, persistPath?: string) {
    this.ledger = new Ledger(txnIdGen);
    this.persistPath = persistPath ?? null;
    if (this.persistPath) {
      try {
        const fs = require('node:fs') as typeof import('node:fs');
        const path = require('node:path') as typeof import('node:path');
        fs.mkdirSync(path.dirname(this.persistPath), { recursive: true, mode: 0o700 });
      } catch { /* persistence remains best-effort */ }
      this.tryRestore();
    }
  }

  setCards(cards: CardTemplate[]): void { this.cards = cards; }

  // ---- players ----
  player(playerId: string): PlayerRecord | undefined { return this.data.players[playerId]; }

  ensurePlayer(openId: string, nick: string, now: number): { player: PlayerRecord; isNew: boolean } {
    const existing = this.data.openIdIndex[openId];
    if (existing && this.data.players[existing]) return { player: this.data.players[existing], isNew: false };
    let playerId = '';
    do { playerId = 'p_' + Math.random().toString(36).slice(2, 10); } while (this.data.players[playerId]);
    const player: PlayerRecord = {
      playerId, openId, nick, level: 1, xp: 0, counters: {}, timestamps: {}, inventory: {}, createdAt: now,
    };
    this.data.players[playerId] = player;
    this.data.openIdIndex[openId] = playerId;
    this.touch();
    return { player, isNew: true };
  }

  // ---- sessions ----
  createSession(playerId: string, featureId: string, seed: string, mechanicId?: string, now = Date.now()): SessionRecord {
    const sessionId = 's_' + Math.random().toString(36).slice(2, 14);
    const rec: SessionRecord = { sessionId, playerId, featureId, mechanicId, seed, createdAt: now, updatedAt: now, clientSeq: 0, serverSeq: 0, data: {}, finished: false };
    this.data.sessions[sessionId] = rec;
    this.touch();
    return rec;
  }

  session(id: string): SessionRecord | undefined { return this.data.sessions[id]; }

  // ---- ranks ----
  rankScore(board: string, playerId: string): number {
    const scores = Object.prototype.hasOwnProperty.call(this.data.ranks, board) ? this.data.ranks[board] : undefined;
    return scores && Object.prototype.hasOwnProperty.call(scores, playerId) ? scores[playerId] : 0;
  }

  rankAdd(board: string, playerId: string, delta: number): number {
    if (board === '__proto__' || board === 'constructor' || board === 'prototype') return 0;
    if (!Object.prototype.hasOwnProperty.call(this.data.ranks, board)) this.data.ranks[board] = {};
    const cur = this.data.ranks[board][playerId] ?? 0;
    const next = cur + delta;
    this.data.ranks[board][playerId] = next;
    this.touch();
    return next;
  }

  rankTop(board: string, limit: number): Array<{ playerId: string; score: number }> {
    const m = Object.prototype.hasOwnProperty.call(this.data.ranks, board) ? this.data.ranks[board] : {};
    return Object.entries(m).map(([playerId, score]) => ({ playerId, score })).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // ---- history ----
  pushHistory(playerId: string, featureId: string, summary: string, rewards?: { assetId: AssetId; delta: number }[]): void {
    if (!this.data.history[playerId]) this.data.history[playerId] = [];
    this.data.history[playerId].push({ id: 'h_' + Math.random().toString(36).slice(2, 12), featureId, summary, createdAt: Date.now(), rewards });
    if (this.data.history[playerId].length > 500) this.data.history[playerId].shift();
    this.touch();
  }

  history(playerId: string, featureId?: string, limit = 50) {
    const list = (this.data.history[playerId] || []).filter((h) => !featureId || h.featureId === featureId);
    return list.slice(-limit).reverse();
  }

  // ---- mails ----
  sendMail(mail: Omit<MailRecord, 'mailId' | 'claimed' | 'read' | 'createdAt'>): MailRecord {
    const rec: MailRecord = { ...mail, mailId: 'm_' + Math.random().toString(36).slice(2, 12), claimed: false, read: false, createdAt: Date.now() };
    this.data.mails.push(rec);
    this.touch();
    return rec;
  }

  mails(playerId: string): MailRecord[] { return this.data.mails.filter((m) => m.playerId === playerId).sort((a, b) => b.createdAt - a.createdAt); }

  // ---- audit ----
  audit(playerId: string, kind: string, detail?: unknown): void {
    this.data.audit.push({ at: Date.now(), playerId, kind, detail });
    if (this.data.audit.length > 2000) this.data.audit.shift();
  }

  telemetry(name: string, props?: Record<string, unknown>): void {
    this.data.telemetry.push({ name, at: Date.now(), props });
    if (this.data.telemetry.length > 5000) this.data.telemetry.shift();
  }

  touch(): void { this.dirty = true; }

  /** 防抖落盘 */
  maybePersist(force = false): void {
    if (!this.persistPath || (!this.dirty && !force)) return;
    try {
      const fs = require('node:fs') as typeof import('node:fs');
      const snapshot = JSON.stringify({ ...this.data, _ledger: this.ledger.dump() });
      const tmpPath = `${this.persistPath}.tmp`;
      fs.writeFileSync(tmpPath, snapshot, { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(tmpPath, this.persistPath);
      this.dirty = false;
    } catch { /* 持久化失败不阻塞游戏 */ }
  }

  private tryRestore(): void {
    try {
      const fs = require('node:fs') as typeof import('node:fs');
      if (!fs.existsSync(this.persistPath!)) return;
      const raw = JSON.parse(fs.readFileSync(this.persistPath!, 'utf8'));
      const { _ledger, ...data } = raw;
      this.data = { ...this.data, ...data };
      if (_ledger) this.ledger.restore(_ledger);
    } catch { /* 损坏快照按新档处理 */ }
  }
}
