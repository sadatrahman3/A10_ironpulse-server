export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate entry" });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};
