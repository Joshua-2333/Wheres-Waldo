// client/config.js
export const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:10000"
    : "https://wheres-waldo-backend-fe40.onrender.com";