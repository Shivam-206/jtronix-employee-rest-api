import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { after, before, test } from "node:test";

let serverProcess;
let baseUrl;

async function findFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return port;
}

async function waitForServer() {
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`API server exited with code ${serverProcess.exitCode}.`);
    }

    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch {
      // The server may need a moment to start listening.
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error("API server did not start within five seconds.");
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

before(async () => {
  const port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ["src/index.js"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore",
  });
  await waitForServer();
});

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill("SIGTERM");
    await new Promise((resolve) => serverProcess.once("exit", resolve));
  }
});

test("Employee REST API", async (t) => {
  await t.test("health check responds successfully", async () => {
    const { response, body } = await request("/healthz");
    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "ok" });
  });

  await t.test("GET /employees returns the three seeded employees", async () => {
    const { response, body } = await request("/employees");
    assert.equal(response.status, 200);
    assert.deepEqual(body, [
      { id: 1, name: "Rahul Sharma", department: "Engineering", status: "Active" },
      { id: 2, name: "Priya Patel", department: "HR", status: "Active" },
      { id: 3, name: "Amit Verma", department: "Engineering", status: "Inactive" },
    ]);
  });

  await t.test("GET /employees/:id returns an employee or the right error", async () => {
    const found = await request("/employees/2");
    assert.equal(found.response.status, 200);
    assert.deepEqual(found.body, {
      id: 2,
      name: "Priya Patel",
      department: "HR",
      status: "Active",
    });

    const invalid = await request("/employees/not-a-number");
    assert.equal(invalid.response.status, 400);
    assert.equal(typeof invalid.body.error, "string");

    const missing = await request("/employees/999");
    assert.equal(missing.response.status, 404);
    assert.equal(typeof missing.body.error, "string");
  });

  await t.test("GET /employees filters by department when requested", async () => {
    const { response, body } = await request("/employees?department=Engineering");
    assert.equal(response.status, 200);
    assert.deepEqual(body.map(({ id }) => id), [1, 3]);

    const noMatches = await request("/employees?department=Finance");
    assert.equal(noMatches.response.status, 200);
    assert.deepEqual(noMatches.body, []);
  });

  await t.test("POST /employees creates an active employee and rejects bad input", async () => {
    const created = await request("/employees", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: " Neha Singh ", department: " Engineering " }),
    });
    assert.equal(created.response.status, 201);
    assert.deepEqual(created.body, {
      id: 4,
      name: "Neha Singh",
      department: "Engineering",
      status: "Active",
    });

    const filtered = await request("/employees?department=Engineering");
    assert.equal(filtered.response.status, 200);
    assert.deepEqual(
    filtered.body.map(({ id }) => id),
    [1, 3, 4]
    );

    for (const invalidBody of [
      {},
      { name: "   ", department: "Engineering" },
      { name: "Neha Singh", department: "  " },
    ]) {
      const invalid = await request("/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(invalidBody),
      });
      assert.equal(invalid.response.status, 400);
      assert.equal(typeof invalid.body.error, "string");
    }

    const malformedJson = await fetch(`${baseUrl}/employees`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    assert.equal(malformedJson.status, 400);
    assert.equal(typeof (await malformedJson.json()).error, "string");
  });

  await t.test("PATCH /employees/:id/status updates only valid statuses", async () => {
    const updated = await request("/employees/1/status", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "Inactive" }),
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.status, "Inactive");

    const invalidStatus = await request("/employees/1/status", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    assert.equal(invalidStatus.response.status, 400);
    assert.equal(typeof invalidStatus.body.error, "string");

    const missingStatus = await request("/employees/1/status", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(missingStatus.response.status, 400);
    assert.equal(typeof missingStatus.body.error, "string");

    const invalidId = await request("/employees/abc/status", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "Active" }),
    });
    assert.equal(invalidId.response.status, 400);

    const missingEmployee = await request("/employees/999/status", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "Active" }),
    });
    assert.equal(missingEmployee.response.status, 404);
  });

  await t.test("unknown routes return a JSON 404", async () => {
    const { response, body } = await request("/not-a-route");
    assert.equal(response.status, 404);
    assert.equal(typeof body.error, "string");
  });
});
