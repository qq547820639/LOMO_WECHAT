/**
 * 音频管理（Section 51）—— BGM/SFX、静音、生命周期挂起恢复。
 */
import { PlatformAdapter } from '../platform/platform';

interface AudioHandle { play(): void; stop(): void; destroy(): void; setVolume(v: number): void }

export class AudioManager {
  bgmOn = true;
  sfxOn = true;
  private bgm: AudioHandle | null = null;
  private sfxCache: Record<string, AudioHandle> = {};
  private pendingSfx: string[] = [];
  private lastPlayed: Record<string, number> = {};

  constructor(private platform: PlatformAdapter) {}

  playBgm(track: string): void {
    if (!this.bgmOn) return;
    this.bgm?.stop();
    const h = this.platform.audio(`assets/game/audio/bgm/${track}.mp3`, true, 0.6);
    h.play();
    this.bgm = h;
  }

  stopBgm(): void { this.bgm?.stop(); this.bgm = null; }

  playSfx(name: string): void {
    if (!this.sfxOn) return;
    // 同名 SFX 最短间隔 80ms，防止爆音
    const now = Date.now();
    if (now - (this.lastPlayed[name] ?? 0) < 80) return;
    this.lastPlayed[name] = now;
    let h = this.sfxCache[name];
    if (!h) { h = this.platform.audio(`assets/game/audio/sfx/${name}.mp3`, false, 0.9); this.sfxCache[name] = h; }
    h.play();
  }

  setMute(muted: boolean): void {
    this.bgmOn = !muted;
    this.sfxOn = !muted;
    if (muted) this.stopBgm();
  }

  onAppHide(): void { this.bgm?.stop(); }
  onAppShow(): void { if (this.bgmOn && this.bgm) this.bgm.play(); }

  release(): void {
    this.bgm?.destroy();
    for (const k of Object.keys(this.sfxCache)) this.sfxCache[k].destroy();
    this.sfxCache = {};
  }
}
