package com.cobradynamics.wifiscan;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "WifiScan",
    permissions = {
        @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION }, alias = "location"),
        @Permission(strings = { Manifest.permission.ACCESS_WIFI_STATE }, alias = "wifi"),
        @Permission(strings = { Manifest.permission.CHANGE_WIFI_STATE }, alias = "changeWifi")
    }
)
public class WifiScanPlugin extends Plugin {

    private WifiManager wifiManager;

    @Override
    public void load() {
        wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                call.resolve(ret);
            } else {
                requestPermissionForAlias("location", call, "locationPermsCallback");
            }
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void locationPermsCallback(PluginCall call) {
        JSObject ret = new JSObject();
        if (getPermissionState("location") == PermissionState.GRANTED) {
            ret.put("granted", true);
        } else {
            ret.put("granted", false);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void getCurrentSignal(PluginCall call) {
        if (wifiManager == null) {
            call.reject("WifiManager not available");
            return;
        }

        WifiInfo wifiInfo = wifiManager.getConnectionInfo();
        JSObject ret = new JSObject();
        ret.put("ssid", wifiInfo.getSSID());
        ret.put("signal", wifiInfo.getRssi());
        ret.put("frequency", wifiInfo.getFrequency());
        call.resolve(ret);
    }

    @PluginMethod
    public void scan(PluginCall call) {
        // Privacy-first: only return the CURRENTLY CONNECTED network
        // Never scan or expose neighboring/friend networks
        if (wifiManager == null) {
            call.reject("WifiManager not available");
            return;
        }

        WifiInfo wifiInfo = wifiManager.getConnectionInfo();
        if (wifiInfo == null || wifiInfo.getNetworkId() == -1) {
            call.reject("Not connected to any WiFi network");
            return;
        }

        JSObject network = new JSObject();
        network.put("ssid", wifiInfo.getSSID());
        network.put("bssid", wifiInfo.getBSSID());
        network.put("signal", wifiInfo.getRssi());
        network.put("frequency", wifiInfo.getFrequency());
        network.put("capabilities", "[CURRENT]");
        network.put("isHome", true);

        JSObject ret = new JSObject();
        ret.put("networks", new com.getcapacitor.JSArray().put(network));
        call.resolve(ret);
    }
}
