(() => {
  // Central place to configure the tracking backend base URL.
  const DEFAULT_BANKEND_BASE_URL = "https://xiaoxiao.cool/bankend";
  if (!window.MINI_BANKEND_BASE_URL) {
    window.MINI_BANKEND_BASE_URL = DEFAULT_BANKEND_BASE_URL;
  }
})();
