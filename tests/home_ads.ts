import * as assert from 'node:assert';
import { HomeLobbyScreen } from '../client/src/features/home_lobby';
import { NodePlatform } from '../client/src/platform/platform';
import { UI } from '../client/src/ui/widgets';

export async function run(): Promise<void> {
  const platform = new NodePlatform();
  const ui = new UI(platform.createCanvas().getContext('2d'), 375, 667);
  const calls: string[] = [];
  const app: any = {
    ui,
    profile: 'wechat-release',
    platform,
    api: {
      bootstrap: { rewardedAds: { slots: { energy_refill: { adUnitId: 'energy-unit' }, bonus_chest: { adUnitId: 'chest-unit' } } } },
      issueRewardedAd: async (slot: string) => { calls.push(`issue:${slot}`); return { ok: true, adId: slot + '-ad', claimToken: slot + '-token', adUnitId: slot + '-unit' }; },
      startRewardedAd: async (adId: string) => { calls.push(`start:${adId}`); return { ok: true, state: 'playing' }; },
      claimRewardedAd: async (adId: string, _token: string, result: any) => { calls.push(`claim:${adId}:${result.isEnded}`); return { ok: true, rewards: [] }; },
    },
    handleGameResponse(response: any) { calls.push(`handled:${response.ok}`); },
    showToast(message: string) { calls.push(`toast:${message}`); },
    router: { switchTab() {} },
    assets: null,
    frameDt: 16,
  };
  const screen = new HomeLobbyScreen();
  screen.app = app;
  ui.beginFrame();
  screen.render();
  const energyHit = ui.hits.find((hit) => hit.id === 'ad-energy-refill');
  const chestHit = ui.hits.find((hit) => hit.id === 'ad-bonus-chest');
  assert.ok(energyHit && chestHit, 'home exposes energy refill and bonus chest entries');
  energyHit!.onTap();
  chestHit!.onTap();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, [
    'issue:energy_refill', 'issue:bonus_chest',
    'start:energy_refill-ad', 'start:bonus_chest-ad',
    'claim:energy_refill-ad:true', 'claim:bonus_chest-ad:true',
    'handled:true', 'handled:true',
  ], 'home ad entries complete the issue/start/show/claim flow');
  assert.deepEqual(platform.rewardedAdsShown, ['energy-unit', 'chest-unit']);
  console.log('home-ads ok: energy refill and bonus chest entries complete rewarded flow');
}

if (require.main === module) run().catch((error) => { console.error(error); process.exitCode = 1; });
