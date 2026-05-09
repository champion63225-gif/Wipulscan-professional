
(function(){
  window._hasNativeWifi=false;
  window._nativeSignal=-100;
  window._nativeSSID='';
  window._nativeNetworks=[];

  // Check if Capacitor is available
  if(typeof window!=='undefined' && window.Capacitor && window.Capacitor.Plugins){
    var Plugins=window.Capacitor.Plugins;
    if(Plugins.WifiScan){
      var WifiScan=Plugins.WifiScan;
      window._hasNativeWifi=true;
      console.log('✅ Native WiFi plugin detected');

      // Request permissions on app start
      WifiScan.requestPermissions().then(function(perm){
        if(perm.granted){
          console.log('WiFi permissions granted');
          // Start polling current signal
          setInterval(function(){
            WifiScan.getCurrentSignal().then(function(res){
              if(res && res.signal!==undefined){
                window._nativeSignal=res.signal;
                window._nativeSSID=res.ssid||'';
                // Update signal label if available
                var lbl=document.getElementById('signal-label');
                if(lbl && window._nativeSSID) lbl.textContent='Signal: '+window._nativeSSID;
              }
            }).catch(function(){});
          },1000);

          // Periodic scan for networks
          setInterval(function(){
            WifiScan.scan().then(function(res){
              if(res && res.networks) window._nativeNetworks=res.networks;
            }).catch(function(){});
          },5000);
        }else{
          console.warn('WiFi permissions denied');
        }
      }).catch(function(err){console.log('Permission request failed',err);});
    }
  }else{
    console.log('Web mode — device sensors for signal detection');
  }
})();
