import { test, expect } from "@playwright/test";

// Tests run in parallel and share one API. Each test creates data with a unique name and deletes it.
const unique = (label: string) => `${label}${Date.now()}${Math.floor(Math.random() * 1000)}`;

interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

test("the seed users are present", async ({ request }) => {
  const response = await request.get("/api/users");
  await expect(response).toBeOK();
  const body = (await response.json()) as { users: User[] };

  expect(body.users).toContainEqual(expect.objectContaining({ firstName: "John", role: "Admin" }));
  expect(body.users).toContainEqual(expect.objectContaining({ firstName: "Anna", role: "User" }));
  expect(body.users).toContainEqual(expect.objectContaining({ firstName: "Michael", role: "Manager" }));
});

test("creates a user and returns the Location header", async ({ request }) => {
  const firstName = unique("Eve");
  const response = await request.post("/api/users", {
    data: { firstName, lastName: "Adams", role: "User" },
  });

  expect(response.status()).toBe(201);
  const user = (await response.json()) as User;
  expect(user).toEqual({ id: expect.any(Number), firstName, lastName: "Adams", role: "User" });
  expect(response.headers()["location"]).toBe(`/api/users/${user.id}`);

  const deleted = await request.delete(`/api/users/${user.id}`);
  expect(deleted.status()).toBe(204);
});

test("rejects a missing field and an invalid role", async ({ request }) => {
  const missing = await request.post("/api/users", { data: { firstName: "Eve" } });
  expect(missing.status()).toBe(400);
  expect(await missing.json()).toEqual({ error: "lastName is required" });

  const invalid = await request.post("/api/users", {
    data: { firstName: "Eve", lastName: "Adams", role: "Boss" },
  });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({ error: "role must be Admin, Manager or User" });
});

test("PUT replaces a user and PATCH changes only the fields that it gets", async ({ request }) => {
  const firstName = unique("Pat");
  const created = await request.post("/api/users", { data: { firstName, lastName: "Smith", role: "User" } });
  const user = (await created.json()) as User;

  // PATCH accepts one field.
  const patched = await request.patch(`/api/users/${user.id}`, { data: { role: "Manager" } });
  expect(patched.status()).toBe(200);
  expect(await patched.json()).toEqual({ ...user, role: "Manager" });

  // PUT needs every field. A body with only a role is not valid.
  const partialPut = await request.put(`/api/users/${user.id}`, { data: { role: "Admin" } });
  expect(partialPut.status()).toBe(400);

  const put = await request.put(`/api/users/${user.id}`, {
    data: { firstName, lastName: "Jones", role: "Admin" },
  });
  expect(put.status()).toBe(200);
  expect(await put.json()).toEqual({ id: user.id, firstName, lastName: "Jones", role: "Admin" });

  await request.delete(`/api/users/${user.id}`);
});

test("a token opens /api/me and a missing token does not", async ({ playwright, baseURL }) => {
  const anonymous = await playwright.request.newContext({ baseURL });
  const login = await anonymous.post("/api/auth/login", {
    data: { username: "TedBuckland", password: "Alligator3" },
  });
  expect(login.status()).toBe(200);
  const { token } = (await login.json()) as { token: string };

  const withoutToken = await anonymous.get("/api/me");
  expect(withoutToken.status()).toBe(401);

  const api = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  const me = await api.get("/api/me");
  expect(await me.json()).toEqual({ username: "TedBuckland", role: "Admin" });

  await anonymous.dispose();
  await api.dispose();
});

test("a wrong password answers 401", async ({ request }) => {
  const response = await request.post("/api/auth/login", {
    data: { username: "TedBuckland", password: "wrong" },
  });
  expect(response.status()).toBe(401);
});

test("a user that the API created appears on the API Playground page", async ({ page, request }) => {
  const lastName = unique("Setup");
  const created = await request.post("/api/users", {
    data: { firstName: "Zoe", lastName, role: "Manager" },
  });
  const user = (await created.json()) as User;

  await page.goto("/network/api");
  await page.getByRole("button", { name: "GET Users" }).click();
  await expect(page.getByRole("row").filter({ hasText: lastName })).toBeVisible();

  await request.delete(`/api/users/${user.id}`);
});
