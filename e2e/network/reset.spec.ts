import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { createApiHandler } from "../../server/api";

// /api/reset changes data for every client. These tests run against their own
// instance of the backend, so they cannot disturb the other specs.

test.describe.configure({ mode: "serial" });

let server: Server;
let api: APIRequestContext;

test.beforeAll(async ({ playwright }) => {
  const handler = createApiHandler();
  server = createServer((req, res) =>
    handler(req, res, () => {
      res.statusCode = 404;
      res.end();
    }),
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  api = await playwright.request.newContext({ baseURL: `http://127.0.0.1:${port}` });
});

test.afterAll(async () => {
  await api.dispose();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("reset restores the three seed users and signs out tokens", async () => {
  const created = await api.post("/api/users", { data: { firstName: "Temp", lastName: "User", role: "User" } });
  const user = (await created.json()) as { id: number };
  expect(user.id).toBe(4);
  await api.delete("/api/users/1");

  const login = await api.post("/api/auth/login", { data: { username: "TedBuckland", password: "Alligator3" } });
  const { token } = (await login.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };
  expect((await api.get("/api/me", { headers })).status()).toBe(200);

  const reset = await api.post("/api/reset");
  expect(reset.status()).toBe(204);

  const { users } = (await (await api.get("/api/users")).json()) as { users: { id: number }[] };
  expect(users.map((u) => u.id)).toEqual([1, 2, 3]);
  expect((await api.get("/api/me", { headers })).status()).toBe(401);

  const next = await api.post("/api/users", { data: { firstName: "Again", lastName: "User", role: "User" } });
  expect(((await next.json()) as { id: number }).id).toBe(4);
});

test("reset needs POST", async () => {
  const response = await api.get("/api/reset");
  expect(response.status()).toBe(405);
  expect(response.headers()["allow"]).toBe("POST");
});
