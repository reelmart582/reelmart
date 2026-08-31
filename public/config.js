const API_BASE =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "";

const MEDIA_BASE = API_BASE + "/uploads/";