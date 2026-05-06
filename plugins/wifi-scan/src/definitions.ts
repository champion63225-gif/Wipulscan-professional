export interface WifiScanPlugin {
  scan(): Promise<{ networks: WifiNetwork[] }>;
  getCurrentSignal(): Promise<{ ssid: string; signal: number; frequency: number }>;
  requestPermissions(): Promise<{ granted: boolean }>;
}

export interface WifiNetwork {
  ssid: string;
  bssid: string;
  signal: number;
  frequency: number;
  capabilities: string;
}
