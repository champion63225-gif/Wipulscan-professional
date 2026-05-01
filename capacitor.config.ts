import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cobradynamics.wipulscan',
  appName: 'WIPULSCAN PRO',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#000005',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000005'
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  },
  ios: {
    scheme: 'WIPULSCAN PRO',
    contentInset: 'automatic'
  }
};

export default config;
