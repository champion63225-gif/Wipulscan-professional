import Foundation
import Capacitor
import CoreLocation
import SystemConfiguration.CaptiveNetwork

@objc(WifiScanPlugin)
public class WifiScanPlugin: CAPPlugin {

    @objc func requestPermissions(_ call: CAPPluginCall) {
        let ret = JSObject()
        ret["granted"] = true
        call.resolve(ret)
    }

    @objc func getCurrentSignal(_ call: CAPPluginCall) {
        var ssid = "unknown"
        var signal = -70
        var frequency = 2400

        #if !os(macOS)
        if let interfaces = CNCopySupportedInterfaces() as? [String] {
            for interface in interfaces {
                if let info = CNCopyCurrentNetworkInfo(interface as CFString) as NSDictionary? {
                    ssid = info[kCNNetworkInfoKeySSID as String] as? String ?? "unknown"
                }
            }
        }
        #endif

        let ret = JSObject()
        ret["ssid"] = ssid
        ret["signal"] = signal
        ret["frequency"] = frequency
        call.resolve(ret)
    }

    @objc func scan(_ call: CAPPluginCall) {
        // Privacy-first: only return the CURRENTLY CONNECTED network
        // iOS cannot measure true dBm signal, but we return the active SSID
        var ssid = "unknown"
        var bssid = "unknown"
        
        #if !os(macOS)
        if let interfaces = CNCopySupportedInterfaces() as? [String] {
            for interface in interfaces {
                if let info = CNCopyCurrentNetworkInfo(interface as CFString) as NSDictionary? {
                    ssid = info[kCNNetworkInfoKeySSID as String] as? String ?? "unknown"
                    bssid = info[kCNNetworkInfoKeyBSSID as String] as? String ?? "unknown"
                }
            }
        }
        #endif
        
        let network = JSObject()
        network["ssid"] = ssid
        network["bssid"] = bssid
        network["signal"] = -65  // Estimated mid-range value (iOS blocks true dBm)
        network["frequency"] = 2400
        network["capabilities"] = "[CURRENT]"
        network["isHome"] = true
        
        let networks = JSArray()
        networks.put(network)
        
        let ret = JSObject()
        ret["networks"] = networks
        call.resolve(ret)
    }
}
