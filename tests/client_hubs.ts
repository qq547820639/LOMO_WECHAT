import * as assert from 'node:assert';
import { HomeHub } from '../client/src/features/hubs';
import { featuresForTab } from '../client/src/features/registry';
import { NodePlatform } from '../client/src/platform/platform';
import { UI } from '../client/src/ui/widgets';

export function run(): void {
  const mine = new HomeHub('mine');
  mine.app = { api: {
    action() { throw new Error('The account hub must not send game actions'); },
    get() { throw new Error('The account hub uses existing player state'); },
  } };
  assert.doesNotThrow(() => mine.onEnter());
  assert.equal(mine.pollMs(), 0, 'account navigation does not poll unsupported daily noop actions');
  for (const height of [480, 667, 812]) {
    const texts: string[] = [];
    const clips: number[][] = [];
    const platform = new NodePlatform();
    const context = new Proxy(platform.createCanvas().getContext('2d'), {
      get(target, property: string) {
        if (property === 'fillText') return (text: string) => { texts.push(text); };
        if (property === 'rect') return (...rectangle: number[]) => { clips.push(rectangle); };
        return target[property];
      },
    });
    const ui = new UI(context, 375, height);
    let currentTab = '';
    const app = { ui, profile: 'wechat-release', player: { nick: '测试冒险者', level: 7, xp: 20, xpToNext: 100, balances: { COIN: 1234, ENERGY: 25, TICKET: 8 } }, router: { switchTab(tab: string) { currentTab = tab; } } };
    for (const tab of ['games', 'chaowan', 'mine']) {
      const hub = new HomeHub(tab);
      hub.app = app;
      const visited = new Set<string>();
      for (const offset of [0, 45, 350, 100000]) {
        ui.beginFrame();
        ui.scrollOffsets['hub-' + tab] = offset;
        hub.render();
        const [left, top, width, clipHeight] = clips[clips.length - 1];
        assert.equal(left, 0);
        assert.equal(width, ui.w);
        assert.ok(clipHeight > 0);
        assert.ok(ui.hits.length > 0);
        for (const hit of ui.hits) {
          assert.ok(hit.y >= top && hit.y + hit.h <= top + clipHeight, 'scrolled rows only accept taps inside the visible list');
          visited.add(hit.id);
        }
        for (const word of ['RELEASE', '服务端', '三层', '移除', '首发', '上线']) assert.ok(!texts.some((text) => text.includes(word)), `player copy excludes internal notes: ${word}`);
      }
      const features = featuresForTab(tab, 'wechat-release');
      assert.ok(visited.has('f-' + features[0].id));
      assert.ok(visited.has('f-' + features[features.length - 1].id), 'last feature remains reachable after scrolling');
      if (tab === 'mine') {
        assert.ok(visited.has('tool-daily') && visited.has('tool-profile'), 'account tools remain reachable in the scroll area');
        assert.ok(texts.includes('1234') && texts.includes('25') && texts.includes('8'), 'account displays real balances');
        assert.ok(texts.includes('猿岛 · 健康游戏，适度娱乐'), 'account footer remains visible at the end');
      }
    }
    assert.equal(featuresForTab('ape', 'wechat-release').length, 0, 'release removes the directory-style ape tab');
    assert.ok(texts.includes('逃生训练场') && texts.includes('BOT'), 'release labels simulated battle royale as a Bot training ground');
    const trade = new HomeHub('trade');
    trade.app = app;
    ui.beginFrame();
    trade.render();
    assert.equal(ui.hits.length, 1);
    assert.equal(ui.hits[0].id, 'browse-games');
    assert.ok(ui.hits[0].y + ui.hits[0].h <= height - 54, 'empty-state action clears bottom navigation');
    ui.hits[0].onTap();
    assert.equal(currentTab, 'games');
  }
  console.log('client-hubs ok: no invalid account polling, clipping, visible hit bounds, final row access, player copy, empty-state navigation');
}

if (require.main === module) run();
