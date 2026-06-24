const LOCAL_READER_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function readBrowserLocation(win) {
  return win?.location ?? {};
}

function isLocalReaderHost(hostname = "") {
  return LOCAL_READER_HOSTS.has(hostname) || hostname.endsWith(".localhost");
}

export function detectRuntimeEnvironment(win = window) {
  const location = readBrowserLocation(win);
  const hostname = location.hostname ?? "";
  const protocol = location.protocol ?? "";
  const isLocalMode = protocol === "file:" || isLocalReaderHost(hostname);
  const firebaseBridgeIsReady = win?.firebaseReady === true;
  const firebaseBridgeIsSignaling = Object.prototype.hasOwnProperty.call(win ?? {}, "firebaseReady");

  return {
    mode: isLocalMode ? "local" : "cloud",
    hostname,
    protocol,
    isLocalMode,
    isCloudMode: !isLocalMode,
    firebaseBridgeIsReady,
    firebaseBridgeIsSignaling,
    shouldWaitForFirebaseBridge: !isLocalMode && firebaseBridgeIsSignaling && !firebaseBridgeIsReady,
  };
}

export function createReaderRuntime(win = window) {
  const environment = detectRuntimeEnvironment(win);

  return {
    ...environment,
    shouldBootImmediately: environment.isLocalMode || !environment.shouldWaitForFirebaseBridge,
    connectFirebaseReady(bootReaderDesk) {
      win.onFirebaseReady = bootReaderDesk;
      if (environment.firebaseBridgeIsReady) {
        bootReaderDesk();
      }
    },
  };
}

export const readerRuntime = createReaderRuntime();
