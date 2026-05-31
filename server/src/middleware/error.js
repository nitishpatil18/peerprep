export function notFound(req, res) {
  res.status(404).json({ error: "not found" });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && status >= 500
      ? "server error"
      : err.message || "server error";
  res.status(status).json({ error: message });
}
