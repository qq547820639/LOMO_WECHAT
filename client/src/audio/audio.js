"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioManager = void 0;
class AudioManager {
    constructor(platform) {
        this.platform = platform;
        this.bgmOn = true;
        this.sfxOn = true;
        this.bgm = null;
        this.sfxCache = {};
        this.pendingSfx = [];
        this.lastPlayed = {};
    }
    playBgm(track) {
        var _a;
        if (!this.bgmOn)
            return;
        (_a = this.bgm) === null || _a === void 0 ? void 0 : _a.stop();
        const h = this.platform.audio(`assets/game/audio/bgm/${track}.mp3`, true, 0.6);
        h.play();
        this.bgm = h;
    }
    stopBgm() { var _a; (_a = this.bgm) === null || _a === void 0 ? void 0 : _a.stop(); this.bgm = null; }
    playSfx(name) {
        var _a;
        if (!this.sfxOn)
            return;
        // 同名 SFX 最短间隔 80ms，防止爆音
        const now = Date.now();
        if (now - ((_a = this.lastPlayed[name]) !== null && _a !== void 0 ? _a : 0) < 80)
            return;
        this.lastPlayed[name] = now;
        let h = this.sfxCache[name];
        if (!h) {
            h = this.platform.audio(`assets/game/audio/sfx/${name}.mp3`, false, 0.9);
            this.sfxCache[name] = h;
        }
        h.play();
    }
    setMute(muted) {
        this.bgmOn = !muted;
        this.sfxOn = !muted;
        if (muted)
            this.stopBgm();
    }
    onAppHide() { var _a; (_a = this.bgm) === null || _a === void 0 ? void 0 : _a.stop(); }
    onAppShow() { if (this.bgmOn && this.bgm)
        this.bgm.play(); }
    release() {
        var _a;
        (_a = this.bgm) === null || _a === void 0 ? void 0 : _a.destroy();
        for (const k of Object.keys(this.sfxCache))
            this.sfxCache[k].destroy();
        this.sfxCache = {};
    }
}
exports.AudioManager = AudioManager;
