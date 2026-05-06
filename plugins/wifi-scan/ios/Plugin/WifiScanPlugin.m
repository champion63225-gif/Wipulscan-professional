#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(WifiScanPlugin, "WifiScan",
    CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getCurrentSignal, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(scan, CAPPluginReturnPromise);
)
