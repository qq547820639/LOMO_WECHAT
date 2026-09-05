/**
 * P0-1 AssetManager —— 图集/帧资源加载与生命周期（对应 PAG_BAKE_PLAN.md 执行表 P0-1③）。
 *
 * 职责:
 *  - manifest 加载（包内 assets/game/manifest.json 或 CDN URL → platform.readTextFile / http）
 *  - 图像加载（platform.createImage，异步 onload）
 *  - LRU 缓存（张数+字节双预算，超限驱逐最旧并 destroy）
 *  - 缺图兜底：manifest 缺失/加载失败 → 程序化占位（FrameClip 画脉冲色块），不抛错不断帧
 *
 * 帧元数据两种形态:
 *  A. packed atlas: { file: 'atlas.png', frames: [{name,x,y,w,h,dur?}] } —— P0-3 烘焙产物
 *  B. 逐帧文件:     { frames: [{name, file, w, h, dur?}] }      —— 现有 APK 帧序列直用
 */
import { PlatformAdapter, ImageLike } from '../platform/platform';

export interface AtlasFrame {
  name: string;
  x?: number;
  y?: number;
  w: number;
  h: number;
  dur?: number; // 覆盖统一 fps 的帧时长 ms
  file?: string; // 形态 B
}

export interface AtlasEntry {
  id: string;
  file?: string; // 形态 A 单图
  frames: AtlasFrame[];
  fps?: number;
  hash?: string; // 内容哈希（构建期计算，命名/校验约定）
  bytes?: number;
}

export interface GameManifest {
  version: string;
  base: string; // 'assets/game/' 或 'https://cdn...'
  atlases: AtlasEntry[];
}

export interface LoadedAtlas {
  entry: AtlasEntry;
  /** 形态 A：单图；形态 B：name → image 映射 */
  sheet: ImageLike | null;
  frameImages: Map<string, ImageLike> | null;
  loadedAt: number;
}

export interface AssetStats { textures: number; estBytes: number; hits: number; misses: number; evictions: number }

const DEFAULT_MAX_TEXTURES = 32;
const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

export class AssetManager {
  private manifest: GameManifest | null = null;
  private manifestPromise: Promise<GameManifest | null> | null = null;
  private cache = new Map<string, LoadedAtlas>(); // Map 顺序即 LRU 顺序（最近使用在最后）
  private loading = new Map<string, Promise<LoadedAtlas | null>>();
  stats: AssetStats = { textures: 0, estBytes: 0, hits: 0, misses: 0, evictions: 0 };

  constructor(
    private platform: PlatformAdapter,
    private opts: { maxTextures?: number; maxBytes?: number } = {},
  ) {}

  /** manifest 加载：优先内置版本比对；platform.readTextFile（包内）→ http（CDN）。重复调用复用同一 promise */
  async loadManifest(manifestPath = 'assets/game/manifest.json'): Promise<GameManifest | null> {
    if (this.manifest) return this.manifest;
    if (this.manifestPromise) return this.manifestPromise;
    this.manifestPromise = this.loadManifestInner(manifestPath);
    return this.manifestPromise;
  }

  private async loadManifestInner(manifestPath: string): Promise<GameManifest | null> {
    const text = this.platform.readTextFile(manifestPath);
    if (text) {
      try {
        this.manifest = JSON.parse(text);
        return this.manifest;
      } catch { /* 损坏 manifest 按缺资源处理 */ }
    }
    // CDN 路径：约定 manifestPath 为 URL 时走 http
    if (/^https?:\/\//.test(manifestPath)) {
      try {
        const res = await this.platform.httpRequest({ url: manifestPath, method: 'GET', timeout: 10000 });
        if (res.statusCode === 200 && res.data) {
          this.manifest = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          return this.manifest;
        }
      } catch { /* 网络失败走占位 */ }
    }
    return null;
  }

  get manifestVersion(): string | null { return this.manifest?.version ?? null; }

  private entry(id: string): AtlasEntry | null {
    return this.manifest?.atlases.find((a) => a.id === id) ?? null;
  }

  private url(entry: AtlasEntry, file: string): string {
    if (/^https?:\/\//.test(file)) return file;
    return (entry && this.manifest ? this.manifest.base : 'assets/game/') + file.replace(/^\//, '');
  }

  private loadImage(url: string, expectW?: number, expectH?: number): Promise<ImageLike> {
    return new Promise((resolve, reject) => {
      const img = this.platform.createImage();
      img.onload = () => {
        if (expectW) img.width = expectW;
        if (expectH) img.height = expectH;
        resolve(img);
      };
      img.onerror = (e) => reject(new Error(`image load fail: ${url} ${String(e ?? '')}`));
      img.src = url;
    });
  }

  /**
   * 取图集（LRU）。未命中加载；命中刷新位置并计 hits。
   * manifest 缺该 id → resolve(null)（调用方走占位渲染）。
   */
  async getAtlas(id: string): Promise<LoadedAtlas | null> {
    // manifest 与首屏加载天然竞态：未就绪时先等 manifest（含失败路径，只等一次）
    if (!this.manifest) await this.loadManifest();
    const hit = this.cache.get(id);
    if (hit) {
      this.cache.delete(id);
      this.cache.set(id, hit);
      this.stats.hits++;
      return hit;
    }
    this.stats.misses++;
    const inflight = this.loading.get(id);
    if (inflight) return inflight;
    const entry = this.entry(id);
    if (!entry) return null;
    const p = this.loadEntry(entry);
    this.loading.set(id, p);
    try {
      const loaded = await p;
      if (!loaded) return null;
      this.cache.set(id, loaded);
      this.evictIfNeeded();
      this.stats.textures = this.cache.size;
      return loaded;
    } finally {
      this.loading.delete(id);
    }
  }

  private async loadEntry(entry: AtlasEntry): Promise<LoadedAtlas | null> {
    try {
      if (entry.file) {
        const sheet = await this.loadImage(this.url(entry, entry.file));
        return { entry, sheet, frameImages: null, loadedAt: Date.now() };
      }
      const frameImages = new Map<string, ImageLike>();
      for (const f of entry.frames) {
        if (!f.file) continue;
        frameImages.set(f.name, await this.loadImage(this.url(entry, f.file), f.w, f.h));
      }
      return { entry, sheet: null, frameImages, loadedAt: Date.now() };
    } catch {
      return null; // 缺图 → 占位
    }
  }

  /** LRU 驱逐：超过张数/字节预算时从最旧开始 destroy+移除（永不驱逐仍在加载的） */
  private evictIfNeeded(): void {
    const maxTextures = this.opts.maxTextures ?? DEFAULT_MAX_TEXTURES;
    const maxBytes = this.opts.maxBytes ?? DEFAULT_MAX_BYTES;
    while (this.cache.size > maxTextures || this.estBytes() > maxBytes) {
      const oldest = this.cache.keys().next().value as string | undefined;
      if (!oldest) break;
      const evicted = this.cache.get(oldest)!;
      if (evicted.sheet?.destroy) evicted.sheet.destroy();
      if (evicted.frameImages) for (const img of evicted.frameImages.values()) img.destroy?.();
      this.cache.delete(oldest);
      this.stats.evictions++;
    }
  }

  private estBytes(): number {
    let n = 0;
    for (const a of this.cache.values()) {
      if (a.entry.bytes) { n += a.entry.bytes; continue; }
      if (a.sheet) n += a.sheet.width * a.sheet.height * 4;
      if (a.frameImages) for (const f of a.entry.frames) n += f.w * f.h * 4;
    }
    this.stats.estBytes = n;
    return n;
  }

  /**
   * 槽位解析（v3）：大小写不敏感的包含语义。
   * 兼容三类命名空间：视频桶（anims/pag__*）、图集桶（*）、目录相对（anims/*）。
   * 找不到时返回原值（调用方已有占位降级）。
   */
  resolveSlotId(prefix: string): string {
    if (!this.manifest) return prefix;
    const p = prefix.toLowerCase();
    const hit = this.manifest.atlases.find((a) => String(a.id).toLowerCase().includes(p));
    return hit ? String(hit.id) : prefix;
  }

  /** 独立加载（绕过 LRU）：AmbienceWindow 等长驻轮播专用，避免驱逐屏内正在使用的图集 */
  async loadStandalone(id: string): Promise<{ frames: Array<{ name: string; w: number; h: number }>; frameImages: Map<string, any> } | null> {
    if (!this.manifest) await this.loadManifest();
    const entry = this.manifest?.atlases.find((a) => a.id === id);
    if (!entry) return null;
    const frameImages = new Map<string, any>();
    for (const f of entry.frames) {
      if (!f.file) continue;
      try {
        const img = await this.loadImage(this.url(entry as any, f.file), f.w, f.h);
        frameImages.set(f.name, img);
      } catch { /* 单帧失败跳过 */ }
    }
    return frameImages.size ? { frames: entry.frames as any, frameImages } : null;
  }

  /** 手动释放（屏幕 onExit / 预算压力） */
  release(id: string): void {
    const a = this.cache.get(id);
    if (!a) return;
    if (a.sheet?.destroy) a.sheet.destroy();
    if (a.frameImages) for (const img of a.frameImages.values()) img.destroy?.();
    this.cache.delete(id);
    this.stats.textures = this.cache.size;
  }

  releaseAll(): void {
    for (const id of Array.from(this.cache.keys())) this.release(id);
  }
}

/** manifest 校验（单测用）：返回问题清单；空 frames/负尺寸/形态缺失均视为错误 */
export function validateManifest(m: GameManifest): string[] {
  const errors: string[] = [];
  if (!m.version) errors.push('manifest.version missing');
  if (!m.base) errors.push('manifest.base missing');
  const ids = new Set<string>();
  for (const a of m.atlases) {
    if (!a.id) errors.push('atlas.id missing');
    if (ids.has(a.id)) errors.push(`duplicate atlas id: ${a.id}`);
    ids.add(a.id);
    if (!a.frames?.length) errors.push(`atlas ${a.id}: empty frames`);
    const packed = !!a.file;
    for (const f of a.frames) {
      if (!f.name) errors.push(`atlas ${a.id}: frame.name missing`);
      if (!(f.w > 0) || !(f.h > 0)) errors.push(`atlas ${a.id}/${f.name}: bad size`);
      if (packed && (f.file || f.x == null || f.y == null)) errors.push(`atlas ${a.id}/${f.name}: packed form requires file-less x/y`);
      if (!packed && (!f.file || f.x != null || f.y != null)) errors.push(`atlas ${a.id}/${f.name}: loose form requires file, no x/y`);
    }
  }
  return errors;
}
