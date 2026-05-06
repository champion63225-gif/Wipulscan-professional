package com.cobradynamics.wifihunter.plugins;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

@CapacitorPlugin(name = "WifiScan")
public class WifiScanPlugin extends Plugin {
    private static final String TAG = "WifiScanPlugin";
    private WifiManager wifiManager;
    private PluginCall pendingCall;

    @Override
    public void load() {
        wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String[] permissions = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_WIFI_STATE,
                Manifest.permission.CHANGE_WIFI_STATE
            };
            boolean allGranted = true;
            for (String perm : permissions) {
                if (ContextCompat.checkSelfPermission(getContext(), perm) != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            JSObject ret = new JSObject();
            ret.put("granted", allGranted);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void scan(PluginCall call) {
        if (!wifiManager.isWifiEnabled()) {
            call.reject("WiFi is disabled");
            return;
        }
        pendingCall = call;
        IntentFilter filter = new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION);
        getContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                boolean success = intent.getBooleanExtra(WifiManager.EXTRA_RESULTS_UPDATED, false);
                if (success) {
                    sendScanResults();
                } else {
                    if (pendingCall != null) {
                        pendingCall.reject("Scan failed");
                        pendingCall = null;
                    }
                }
                getContext().unregisterReceiver(this);
            }
        }, filter);
        wifiManager.startScan();
    }

    @PluginMethod
    public void getCurrentSignal(PluginCall call) {
        int rssi = wifiManager.getConnectionInfo().getRssi();
        String ssid = wifiManager.getConnectionInfo().getSSID();
        int freq = wifiManager.getConnectionInfo().getFrequency();
        if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
            ssid = ssid.substring(1, ssid.length() - 1);
        }
        JSObject ret = new JSObject();
        ret.put("ssid", ssid);
        ret.put("signal", rssi);
        ret.put("frequency", freq);
        call.resolve(ret);
    }

    private void sendScanResults() {
        List<ScanResult> results = wifiManager.getScanResults();
        JSONArray networks = new JSONArray();
        for (ScanResult result : results) {
            try {
                JSONObject net = new JSONObject();
                net.put("ssid", result.SSID);
                net.put("bssid", result.BSSID);
                net.put("signal", result.level);
                net.put("frequency", result.frequency);
                net.put("capabilities", result.capabilities);
                networks.put(net);
            } catch (JSONException e) {
                Log.e(TAG, "JSON error", e);
            }
        }
        JSObject ret = new JSObject();
        ret.put("networks", networks);
        if (pendingCall != null) {
            pendingCall.resolve(ret);
            pendingCall = null;
        }
    }
}
