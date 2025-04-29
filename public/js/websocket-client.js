(() => {
  const MAX_CONNECTION_ATTEMPTS = 5;
  const PAGE_EXPIRED_OVERLAY_ID = "page-expired-overlay";

  let reconnectAttempts = 0;
  function connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const id = window.location.pathname.substring(1);
    const ws = new WebSocket(`${protocol}//${host}/ws/${id}`);

    ws.onopen = () => {
      reconnectAttempts = 0;

      const overlay = document.getElementById(PAGE_EXPIRED_OVERLAY_ID);
      if (overlay) {
        overlay.remove();
      }
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.error("Error parsing message:", err);
      }

      if (data.type === "update") {
        document.body.innerHTML = data.body;
      } else if (data.type === "scripts_added") {
        updateScripts(data.scripts);
      } else if (data.type === "stylesheets_added") {
        updateStylesheets(data.stylesheets);
      } else if (data.type === "expired") {
        showExpiredMessage(data.message);
      }
    };

    ws.onclose = (event) => {
      if (event.code === 4000 && event.reason === "Page has been removed") {
        showExpiredMessage("This page has been removed");
        return;
      }
      if (event.code === 4001 && event.reason === "Page has expired") {
        showExpiredMessage("This page has expired");
        return;
      }

      if (reconnectAttempts < MAX_CONNECTION_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        console.log(
          `Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`,
        );
        setTimeout(connectWebSocket, delay);
      } else {
        showExpiredMessage("Connection lost. The page may have expired.");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  function showExpiredMessage(message) {
    if (!document.getElementById(PAGE_EXPIRED_OVERLAY_ID)) {
      const overlay = document.createElement("div");
      overlay.id = PAGE_EXPIRED_OVERLAY_ID;

      const messageEl = document.createElement("h2");
      messageEl.textContent = message;

      overlay.appendChild(messageEl);
      document.body.appendChild(overlay);
    }
  }

  function updateScripts(scripts) {
    for (const scriptData of scripts) {
      const scriptElement = document.createElement("script");

      if (scriptData.src) {
        scriptElement.src = scriptData.src;
      } else if (scriptData.content) {
        scriptElement.textContent = scriptData.content;
      }

      document.head.appendChild(scriptElement);
    }
  }

  function updateStylesheets(stylesheets) {
    for (const stylesheetData of stylesheets) {
      if (stylesheetData.href) {
        const linkElement = document.createElement("link");
        linkElement.rel = "stylesheet";
        linkElement.href = stylesheetData.href;
        document.head.appendChild(linkElement);
      }
    }
  }

  window.addEventListener("load", connectWebSocket);
})();
