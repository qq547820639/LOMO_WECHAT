/**
 * 程序化音频生成器（COMPLETENESS_EVALUATION 缺口 C 处置）。
 * chiptune 合成：方波/三角波/噪声 + 包络 + 音序器 → WAV → ffmpeg 转 mp3。
 * 产出：BGM×3（主城/战斗/结算）+ SFX×12 → game-assets/audio/{bgm,sfx}/
 * 依赖 tools/bin/ffmpeg（已就绪）；ffmpeg 缺失时保留 WAV（微信 InnerAudioContext 亦支持）。
 * 运行：node dist/tools/src/gen_audio.js
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as cp from 'node:child_process';
import { rootPath } from '../../shared/src/paths';

const SR = 22050;

// ---------- 合成基元 ----------
function synthNote(buf: Float32Array, startSec: number, durSec: number, freq: number, vol: number, wave: 'square' | 'tri' | 'saw' | 'noise' | 'sine'): void {
  const start = Math.floor(startSec * SR);
  const n = Math.floor(durSec * SR);
  for (let i = 0; i < n; i++) {
    const idx = start + i;
    if (idx >= buf.length) break;
    const t = i / SR;
    const ph = (t * freq) % 1;
    let v: number;
    switch (wave) {
      case 'square': v = ph < 0.5 ? 1 : -1; break;
      case 'tri': v = 4 * Math.abs(ph - 0.5) - 1; break;
      case 'saw': v = 2 * ph - 1; break;
      case 'noise': v = Math.random() * 2 - 1; break;
      default: v = Math.sin(2 * Math.PI * freq * t);
    }
    // ADSR 简化：10ms attack + 指数 decay
    const env = Math.min(1, i / (SR * 0.01)) * Math.exp(-t * (2.2 / Math.max(0.08, durSec)));
    buf[idx] += v * vol * env;
  }
}

const NOTE: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(note: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) return 440;
  const semis = NOTE[m[1]] + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (semis - 69) / 12);
}

interface Voice { wave: 'square' | 'tri' | 'saw' | 'noise' | 'sine'; vol: number; seq: Array<[string | null, number]> } // [音符,null=休止,拍数]
function renderVoices(voices: Voice[], bpm: number, loopPadSec = 0): { buf: Float32Array; dur: number } {
  const beat = 60 / bpm;
  const dur = voices.reduce((mx, v) => Math.max(mx, v.seq.reduce((s, x) => s + x[1], 0) * beat), 0) + loopPadSec;
  const buf = new Float32Array(Math.ceil(dur * SR));
  for (const v of voices) {
    let t = 0;
    for (const [note, beats] of v.seq) {
      if (note) synthNote(buf, t, beats * beat * 0.95, freq(note), v.vol, v.wave);
      t += beats * beat;
    }
  }
  return { buf, dur };
}

function toWav(buf: Float32Array): Buffer {
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    const v = Math.max(-1, Math.min(1, buf[i]));
    data.writeInt16LE(Math.round(v * 32000), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// ---------- BGM ×3 ----------
function bgmHome(): Buffer {
  // 明亮五声循环（C 大调宫调式），120bpm，两声部
  const lead: Array<[string | null, number]> = [
    ['C5', 1], ['E5', 1], ['G5', 1], ['A5', 1], ['G5', 0.5], ['E5', 0.5], ['C5', 1], [null, 1],
    ['D5', 1], ['F5', 1], ['A5', 1], ['G5', 1], ['E5', 0.5], ['C5', 0.5], ['D5', 1], [null, 1],
  ];
  const bass: Array<[string | null, number]> = [
    ['C3', 2], ['G3', 2], ['A3', 2], ['E3', 2], ['F3', 2], ['C3', 2], ['G3', 2], ['C3', 2],
  ];
  return toWav(renderVoices([{ wave: 'square', vol: 0.16, seq: lead }, { wave: 'tri', vol: 0.22, seq: bass }], 132).buf);
}
function bgmBattle(): Buffer {
  // 紧张小调驱动（A 小调），140bpm
  const lead: Array<[string | null, number]> = [
    ['A4', 0.5], ['A4', 0.5], ['C5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 1],
    ['A4', 0.5], ['A4', 0.5], ['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['E5', 0.5], ['D5', 1],
  ];
  const bass: Array<[string | null, number]> = [
    ['A2', 0.5], ['A2', 0.5], ['A2', 0.5], ['A2', 0.5], ['F2', 0.5], ['F2', 0.5], ['G2', 0.5], ['G2', 0.5],
    ['A2', 0.5], ['A2', 0.5], ['A2', 0.5], ['A2', 0.5], ['D3', 0.5], ['D3', 0.5], ['E3', 0.5], ['E3', 0.5],
  ];
  return toWav(renderVoices([{ wave: 'square', vol: 0.15, seq: lead }, { wave: 'saw', vol: 0.16, seq: bass }], 148).buf);
}
function bgmSettle(): Buffer {
  // 结算号角（C-降E-F-G 上行），once
  const seq: Array<[string | null, number]> = [['C5', 0.75], ['C5', 0.75], ['C5', 0.75], ['E5', 1.5], ['D5', 0.75], ['E5', 0.75], ['F5', 0.75], ['G5', 2.25], [null, 0.5]];
  const pad: Array<[string | null, number]> = [['C3', 3], ['F3', 3], ['G3', 2.5]];
  return toWav(renderVoices([{ wave: 'square', vol: 0.17, seq }, { wave: 'tri', vol: 0.2, seq: pad }], 120).buf);
}

// ---------- SFX ×12 ----------
function sfx(name: string): Buffer {
  const b = new Float32Array(SR); // 1s 容量
  switch (name) {
    case 'click': synthNote(b, 0, 0.05, 880, 0.3, 'square'); break;
    case 'nav': synthNote(b, 0, 0.05, 660, 0.25, 'square'); synthNote(b, 0.05, 0.06, 990, 0.25, 'square'); break;
    case 'reward': ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => synthNote(b, i * 0.07, 0.12, freq(n), 0.28, 'square')); break;
    case 'fail': synthNote(b, 0, 0.12, freq('E4'), 0.3, 'square'); synthNote(b, 0.12, 0.2, freq('C4'), 0.3, 'square'); break;
    case 'hit': for (let i = 0; i < SR * 0.09; i++) b[i] += (Math.random() * 2 - 1) * Math.exp(-i / (SR * 0.02)) * 0.5; synthNote(b, 0, 0.06, 180, 0.4, 'sine'); break;
    case 'win': ['G4', 'C5', 'E5', 'G5', 'C6'].forEach((n, i) => synthNote(b, i * 0.09, 0.18, freq(n), 0.3, 'square')); break;
    case 'lose': ['E5', 'D5', 'C5', 'A4'].forEach((n, i) => synthNote(b, i * 0.11, 0.16, freq(n), 0.26, 'tri')); break;
    case 'coin': synthNote(b, 0, 0.05, 1318, 0.3, 'square'); synthNote(b, 0.06, 0.12, 1760, 0.3, 'square'); break;
    case 'levelup': for (let i = 0; i < 8; i++) synthNote(b, i * 0.05, 0.1, 440 * Math.pow(2, i / 6), 0.24, 'square'); break;
    case 'checkin': synthNote(b, 0, 0.09, freq('E5'), 0.28, 'square'); synthNote(b, 0.1, 0.14, freq('A5'), 0.28, 'square'); break;
    case 'open': for (let i = 0; i < SR * 0.22; i++) { const t = i / SR; b[i] += Math.sin(2 * Math.PI * (300 + t * 2400) * t) * 0.3 * (1 - t / 0.22); } break;
    case 'tick': synthNote(b, 0, 0.03, 660, 0.22, 'square'); break;
  }
  return toWav(b);
}

export function generate(): void {
  const ffmpeg = rootPath('tools', 'bin', 'ffmpeg');
  const hasFfmpeg = fs.existsSync(ffmpeg);
  const bgmDir = rootPath('game-assets', 'audio', 'bgm');
  const sfxDir = rootPath('game-assets', 'audio', 'sfx');
  fs.mkdirSync(bgmDir, { recursive: true });
  fs.mkdirSync(sfxDir, { recursive: true });
  const writeAudio = (dir: string, name: string, wav: Buffer): void => {
    const base = path.join(dir, name);
    if (hasFfmpeg) {
      const tmp = base + '.wav';
      fs.writeFileSync(tmp, wav);
      try {
        cp.execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', tmp, '-codec:a', 'libmp3lame', '-b:a', '96k', base + '.mp3']);
        fs.unlinkSync(tmp);
        return;
      } catch { /* lame 不可用时保留 wav */ }
    }
    if (!fs.existsSync(base + '.mp3')) fs.writeFileSync(base + '.wav', wav);
  };
  writeAudio(bgmDir, 'home', bgmHome());
  writeAudio(bgmDir, 'battle', bgmBattle());
  writeAudio(bgmDir, 'settle', bgmSettle());
  const sfxNames = ['click', 'nav', 'reward', 'fail', 'hit', 'win', 'lose', 'coin', 'levelup', 'checkin', 'open', 'tick'];
  for (const n of sfxNames) writeAudio(sfxDir, n, sfx(n));
  console.log(`[gen_audio] BGM×3 + SFX×${sfxNames.length} → game-assets/audio/ (${hasFfmpeg ? 'mp3' : 'wav'})`);
}

if (require.main === module) generate();
