
// Optional Capacitor bridge loader — only in native app, silently fails in browser
(function(){
  if(window.location.protocol==='file:' || /capacitor/.test(navigator.userAgent)){
    var s=document.createElement('script');s.src='capacitor.js';s.onerror=function(){};document.head.appendChild(s)
  }
})()
