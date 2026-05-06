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
        let ret = JSObject()
        ret["networks"] = JSArray()
        call.resolve(ret)
    }
}
