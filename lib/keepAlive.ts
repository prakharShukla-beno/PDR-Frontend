export const startKeepAlive = () => {
  if (typeof window === "undefined") return;

  // Proxied via next.config rewrites → backend /health
  const healthUrl = "/health";

  setInterval(async () => {
    try {
      await fetch(healthUrl);
    } catch (err) {
      console.log("Keep-alive ping failed");
    }
  }, 10 * 60 * 1000);
};
