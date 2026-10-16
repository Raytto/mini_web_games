(() => {
  const STORAGE_KEY = "mini_web_games_client_id";
  const COOKIE_KEY = "mini_web_games_client_id";
  const SESSION_STORAGE_KEY = "mini_web_games_session_start";
  const DEFAULT_HEARTBEAT_MS = 20000;
  const DEFAULT_BANKEND_BASE_URL = "https://xiaoxiao.cool/bankend";

  const normalizeBaseUrl = (url) => {
    if (!url) return "";
    return url.toString().replace(/\/+$/, "");
  };

  const resolveBankendBaseUrl = () => {
    const configured = normalizeBaseUrl(window.MINI_BANKEND_BASE_URL || DEFAULT_BANKEND_BASE_URL);
    if (configured) return configured;
    if (window.location && window.location.origin) {
      return normalizeBaseUrl(window.location.origin);
    }
    return "";
  };

  const resolveEndpoint = () => {
    if (window.MINI_TRACKING_ENDPOINT) {
      return window.MINI_TRACKING_ENDPOINT;
    }
    const baseUrl = resolveBankendBaseUrl();
    return baseUrl ? `${baseUrl}/api/v1/events` : "/api/v1/events";
  };

  if (window.MiniTracking) {
    return;
  }

  const safeJSON = (data) => {
    try {
      return JSON.stringify(data);
    } catch (e) {
      return "";
    }
  };

  const randomId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "id-" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  };

  const getOrCreateClientId = () => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) return existing;
      const cid = randomId();
      localStorage.setItem(STORAGE_KEY, cid);
      document.cookie = `${COOKIE_KEY}=${cid}; path=/; max-age=${60 * 60 * 24 * 365}`;
      return cid;
    } catch (e) {
      return randomId();
    }
  };

  const clientId = getOrCreateClientId();
  let currentGame = null;
  let gameStartMs = null;
  let heartbeatTimer = null;

  const makeEvent = (eventType, overrides = {}) => {
    const now = new Date();
    const payload = {
      event_id: randomId(),
      client_id: clientId,
      event_type: eventType,
      occurred_at: now.toISOString(),
      path: window.location ? window.location.pathname + window.location.search : undefined,
      referrer: document.referrer || undefined,
      game_id: currentGame?.id,
      game_name: currentGame?.name,
      ...overrides,
    };
    if (overrides.metadata) {
      payload.metadata = overrides.metadata;
    }
    return payload;
  };

  const sendPayload = (events, { useBeacon = false } = {}) => {
    const body = safeJSON({ events });
    if (!body) return;
    const endpoint = resolveEndpoint();
    if (!endpoint) return;

    const headers = { "Content-Type": "application/json" };
    const blob = new Blob([body], { type: "application/json" });

    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers,
      body,
      keepalive: useBeacon,
    }).catch(() => {
      /* swallow network errors */
    });
  };

  const trackPageView = () => {
    sendPayload([makeEvent("page_view")]);
  };

  const startGameSession = (gameInfo) => {
    currentGame = gameInfo;
    gameStartMs = Date.now();
    try { sessionStorage.setItem(SESSION_STORAGE_KEY, gameStartMs.toString()); } catch (_) { /* In-memory sessions still work when storage is disabled. */ }
    sendPayload([makeEvent("game_start")]);
    startHeartbeat();
  };

  const endGameSession = (reason) => {
    if (!gameStartMs) return;
    const duration = Math.max(0, Date.now() - gameStartMs);
    const metadata = reason ? { reason } : undefined;
    sendPayload([makeEvent("game_end", { duration_ms: duration, metadata })], { useBeacon: true });
    stopHeartbeat();
    currentGame = null;
    gameStartMs = null;
    try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch (_) { /* Session has already ended in memory. */ }
  };

  const heartbeat = (useBeacon = false) => {
    if (!gameStartMs) return;
    const duration = Math.max(0, Date.now() - gameStartMs);
    sendPayload([makeEvent("heartbeat", { duration_ms: duration })], { useBeacon });
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    const interval = window.MINI_TRACKING_HEARTBEAT_MS || DEFAULT_HEARTBEAT_MS;
    heartbeatTimer = window.setInterval(() => heartbeat(false), interval);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      heartbeat(true);
    }
  });

  window.addEventListener("beforeunload", () => {
    heartbeat(true);
    endGameSession("unload");
  });

  const autoStart = () => {
    const gameInfo = window.MINI_GAME || window.MINI_GAME_INFO;
    if (window.MINI_TRACKING_AUTO_PAGE_VIEW !== false) {
      trackPageView();
    }
    if (gameInfo) {
      startGameSession(gameInfo);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoStart);
  } else {
    autoStart();
  }

  window.MiniTracking = {
    clientId,
    trackPageView,
    startGameSession,
    endGameSession,
    heartbeat,
  };
})();
