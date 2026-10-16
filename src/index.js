import express from "express";
import employeesRouter from "./routes/employees.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/employees", employeesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((error, _req, res, _next) => {
  if (error.status === 400 || error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body must contain valid JSON." });
  }

  return res.status(500).json({ error: "Internal server error." });
});

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}".`);
}

app.listen(port, "0.0.0.0", () => {
  console.info(`Employee API listening on port ${port}`);
});
