const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export const startKeepAlive = () => {
  if (typeof window === "undefined") return;
  if (!BACKEND_URL) return;

  // Health endpoint is at /health (not under /api)
  const healthUrl = `${BACKEND_URL.replace(/\/api\/?$/, "")}/health`;

  setInterval(async () => {
    try {
      await fetch(healthUrl);
    } catch (err) {
      console.log("Keep-alive ping failed");
    }
  }, 10 * 60 * 1000);
};
