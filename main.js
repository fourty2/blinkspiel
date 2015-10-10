var blink1 = undefined;

function onAppWindowClosed() {
  if (blink1) {
    blink1.disconnect();
  }
  window.close();
}

function onAppWindowCreated(appWindow) {
  appWindow.onClosed.addListener(onAppWindowClosed);
}

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "blinkspiel.html", {
        id: "blinkspiel",
        outerBounds: { width: 640, height: 480 },
        resizable: true
      }, onAppWindowCreated);
});
