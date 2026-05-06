package com.cobradynamics.wifiscan;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.List;

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
        if (wifiManager == null) {
            call.reject("WifiManager not available");
            return;
        }

        boolean success = wifiManager.startScan();
        if (!success) {
            call.reject("Scan failed to start");
            return;
        }

        List<ScanResult> results = wifiManager.getScanResults();
        JSArray networks = new JSArray();

        for (ScanResult result : results) {
            JSObject network = new JSObject();
            network.put("ssid", result.SSID);
            network.put("bssid", result.BSSID);
            network.put("signal", result.level);
            network.put("frequency", result.frequency);
            network.put("capabilities", result.capabilities);
            networks.put(network);
        }

        JSObject ret = new JSObject();
        ret.put("networks", networks);
        call.resolve(ret);
    }
}
