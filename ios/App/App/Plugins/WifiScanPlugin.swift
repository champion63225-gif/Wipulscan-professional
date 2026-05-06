import Foundation
import Capacitor
import CoreWLAN
import SystemConfiguration.CaptiveNetwork

@objc(WifiScanPlugin)
public class WifiScanPlugin: CAPPlugin {
    
    @objc func requestPermissions(_ call: CAPPluginCall) {
        call.resolve(["granted": true])
    }
    
    @objc func scan(_ call: CAPPluginCall) {
        // iOS does not allow WiFi scanning for third-party apps
        // Return empty array with note
        call.resolve(["networks": []])
    }
    
    @objc func getCurrentSignal(_ call: CAPPluginCall) {
        var ssid = "unknown"
        var signal = -70
        var frequency = 2400
        
        #if os(iOS)
        if let interfaces = CNCopySupportedInterfaces() as? [String] {
            for interface in interfaces {
                if let info = CNCopyCurrentNetworkInfo(interface as CFString) as NSDictionary? {
                    ssid = info[kCNNetworkInfoKeySSID as String] as? String ?? "unknown"
                }
            }
        }
        #else
        if let client = CWWiFiClient.shared().interface() {
            ssid = client.ssid() ?? "unknown"
            signal = Int(client.rssiValue())
            frequency = Int(client.channel()?.channelNumber ?? 0)
        }
        #endif
        
        call.resolve([
            "ssid": ssid,
            "signal": signal,
            "frequency": frequency
        ])
    }
}
