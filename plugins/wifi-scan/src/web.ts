import { WebPlugin } from '@capacitor/core';
import type { WifiScanPlugin } from './definitions';

export class WifiScanWeb extends WebPlugin implements WifiScanPlugin {
  async scan(): Promise<{ networks: any[] }> {
    return { networks: [] };
  }

  async getCurrentSignal(): Promise<{ ssid: string; signal: number; frequency: number }> {
    return { ssid: 'unknown', signal: -70, frequency: 2400 };
  }

  async requestPermissions(): Promise<{ granted: boolean }> {
    return { granted: true };
  }
}
