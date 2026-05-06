import { registerPlugin } from '@capacitor/core';
import type { WifiScanPlugin } from './definitions';

const WifiScan = registerPlugin<WifiScanPlugin>('WifiScan', {
  web: () => import('./web').then(m => new m.WifiScanWeb()),
});

export * from './definitions';
export { WifiScan };
