// CAPACITOR PLUGIN – Android WiFi RSSI Bridge
// Place this in: android/app/src/main/java/com/cobradynamics/wipulscan/WifiInfoPlugin.java
// Register in MainActivity: registerPlugin(WifiInfoPlugin.class);

package com.cobradynamics.wipulscan;

import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WifiInfo")
public class WifiInfoPlugin extends Plugin {

    @PluginMethod()
    public void getRSSI(PluginCall call) {
        try {
            WifiManager wifiManager = (WifiManager) getContext()
                .getApplicationContext()
                .getSystemService(Context.WIFI_SERVICE);

            if (wifiManager == null) {
                call.reject("WifiManager not available");
                return;
            }

            WifiInfo wifiInfo = wifiManager.getConnectionInfo();
            if (wifiInfo == null) {
                call.reject("WifiInfo not available");
                return;
            }

            JSObject result = new JSObject();
            result.put("rssi", wifiInfo.getRssi());
            result.put("ssid", wifiInfo.getSSID().replace("\"", ""));
            result.put("bssid", wifiInfo.getBSSID());
            result.put("linkSpeed", wifiInfo.getLinkSpeed());
            result.put("frequency", wifiInfo.getFrequency());
            result.put("networkId", wifiInfo.getNetworkId());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to get WiFi info: " + e.getMessage());
        }
    }

    @PluginMethod()
    public void isConnected(PluginCall call) {
        try {
            WifiManager wifiManager = (WifiManager) getContext()
                .getApplicationContext()
                .getSystemService(Context.WIFI_SERVICE);

            JSObject result = new JSObject();
            result.put("connected", wifiManager != null && wifiManager.isWifiEnabled());
            call.resolve(result);
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("connected", false);
            call.resolve(result);
        }
    }
}
