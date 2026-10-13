import { test, expect } from "@playwright/test";

// Tests of the mock backend, called directly with the request fixture.
// Tests run in parallel and share one API, so each test uses its own data and never calls /api/reset.

const unique = () => `T${Date.now()}${Math.floor(Math.random() * 1e6)}`;

interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

test.describe("users", () => {
  test("lists the seed users and filters by role", async ({ request }) => {
    const response = await request.get("/api/users");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    const { users } = (await response.json()) as { users: User[] };
    expect(users).toEqual(
      expect.arrayContaining([
        { id: 1, firstName: "John", lastName: "Smith", role: "Admin" },
        { id: 2, firstName: "Anna", lastName: "Kowalski", role: "User" },
        { id: 3, firstName: "Michael", lastName: "Brown", role: "Manager" },
      ]),
    );

    const admins = await request.get("/api/users", { params: { role: "Admin" } });
    const adminBody = (await admins.json()) as { users: User[] };
    expect(adminBody.users.length).toBeGreaterThan(0);
    expect(adminBody.users.every((u) => u.role === "Admin")).toBe(true);
  });

  test("gets one user, rejects a bad id, reports a missing user", async ({ request }) => {
    expect(await (await request.get("/api/users/1")).json()).toEqual({
      id: 1,
      firstName: "John",
      lastName: "Smith",
      role: "Admin",
    });
    const bad = await request.get("/api/users/abc");
    expect(bad.status()).toBe(400);
    expect(await bad.json()).toEqual({ error: "id must be a number" });
    const missing = await request.get("/api/users/987654");
    expect(missing.status()).toBe(404);
    expect(await missing.json()).toEqual({ error: "User not found" });
  });

  test("creates, updates, replaces and deletes a user", async ({ request }) => {
    const name = unique();
    const created = await request.post("/api/users", { data: { firstName: name, lastName: "Adams", role: "User" } });
    expect(created.status()).toBe(201);
    const user = (await created.json()) as User;
    expect(user).toEqual({ id: expect.any(Number), firstName: name, lastName: "Adams", role: "User" });
    expect(created.headers()["location"]).toBe(`/api/users/${user.id}`);

    const patched = await request.patch(`/api/users/${user.id}`, { data: { role: "Manager" } });
    expect(patched.status()).toBe(200);
    expect(await patched.json()).toEqual({ ...user, role: "Manager" });

    const put = await request.put(`/api/users/${user.id}`, {
      data: { firstName: name, lastName: "Baker", role: "Admin" },
    });
    expect(await put.json()).toEqual({ id: user.id, firstName: name, lastName: "Baker", role: "Admin" });

    const incompletePut = await request.put(`/api/users/${user.id}`, { data: { role: "User" } });
    expect(incompletePut.status()).toBe(400);
    expect(await incompletePut.json()).toEqual({ error: "firstName is required" });

    const removed = await request.delete(`/api/users/${user.id}`);
    expect(removed.status()).toBe(204);
    expect(await removed.text()).toBe("");
    expect((await request.get(`/api/users/${user.id}`)).status()).toBe(404);
    expect((await request.delete(`/api/users/${user.id}`)).status()).toBe(404);
  });

  test("validates the create body", async ({ request }) => {
    const missingLast = await request.post("/api/users", { data: { firstName: "Eve" } });
    expect(missingLast.status()).toBe(400);
    expect(await missingLast.json()).toEqual({ error: "lastName is required" });

    const empty = await request.post("/api/users", { data: {} });
    expect(await empty.json()).toEqual({ error: "firstName is required" });

    const badRole = await request.post("/api/users", { data: { firstName: "Eve", lastName: "Adams", role: "Boss" } });
    expect(badRole.status()).toBe(400);
    expect(await badRole.json()).toEqual({ error: "role must be Admin, Manager or User" });

    const badJson = await request.post("/api/users", { headers: { "Content-Type": "application/json" }, data: "{oops" });
    expect(badJson.status()).toBe(400);
  });

  test("PATCH needs a valid field and a missing user answers 404", async ({ request }) => {
    expect((await request.patch("/api/users/1", { data: {} })).status()).toBe(400);
    expect((await request.patch("/api/users/1", { data: { role: "Boss" } })).status()).toBe(400);
    expect((await request.patch("/api/users/987654", { data: { role: "User" } })).status()).toBe(404);
  });
});

test.describe("routing", () => {
  test("unknown endpoint answers 404", async ({ request }) => {
    const response = await request.get("/api/nothing-here");
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: "Endpoint not found" });
  });

  test("wrong method answers 405 with an Allow header", async ({ request }) => {
    const login = await request.get("/api/auth/login");
    expect(login.status()).toBe(405);
    expect(login.headers()["allow"]).toBe("POST");
    expect(await login.json()).toEqual({ error: "Method not allowed. Use POST." });

    const users = await request.delete("/api/users");
    expect(users.status()).toBe(405);
    expect(users.headers()["allow"]).toBe("GET, POST");
  });

  test("status/:code answers the requested status", async ({ request }) => {
    for (const code of [200, 201, 400, 404, 418, 500, 503]) {
      const response = await request.get(`/api/status/${code}`);
      expect(response.status()).toBe(code);
      expect(await response.json()).toEqual({ status: code, message: `Response with status ${code}` });
    }
    expect((await request.get("/api/status/204")).status()).toBe(204);
    for (const bad of ["99", "600", "abc"]) {
      const response = await request.get(`/api/status/${bad}`);
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: "code must be an HTTP status between 200 and 599" });
    }
  });
});

test.describe("authentication", () => {
  test("login returns a token that /api/me accepts", async ({ playwright, baseURL }) => {
    const anonymous = await playwright.request.newContext({ baseURL });
    const login = await anonymous.post("/api/auth/login", {
      data: { username: "TedBuckland", password: "Alligator3" },
    });
    expect(login.status()).toBe(200);
    const { token } = (await login.json()) as { token: string };
    expect(token).toEqual(expect.any(String));

    expect((await anonymous.get("/api/me")).status()).toBe(401);
    const noBearer = await anonymous.get("/api/me", { headers: { Authorization: "Bearer not-a-token" } });
    expect(noBearer.status()).toBe(401);
    expect(await noBearer.json()).toEqual({ error: "Missing or invalid bearer token" });

    const me = await anonymous.get("/api/me", { headers: { Authorization: `Bearer ${token}` } });
    expect(me.status()).toBe(200);
    expect(await me.json()).toEqual({ username: "TedBuckland", role: "Admin" });
    await anonymous.dispose();
  });

  test("login rejects wrong credentials", async ({ request }) => {
    const response = await request.post("/api/auth/login", { data: { username: "TedBuckland", password: "nope" } });
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid username or password" });
    expect((await request.post("/api/auth/login", { data: {} })).status()).toBe(401);
  });
});

test.describe("products, employees, notifications and cities", () => {
  test("products can be searched", async ({ request }) => {
    const all = (await (await request.get("/api/products")).json()) as { products: { name: string }[] };
    expect(all.products).toHaveLength(5);
    const found = (await (await request.get("/api/products", { params: { search: "mo" } })).json()) as {
      products: { name: string }[];
    };
    expect(found.products.map((p) => p.name)).toEqual(["Mouse", "Monitor"]);
    const none = await request.get("/api/products?search=zzz");
    expect(await none.json()).toEqual({ products: [] });
  });

  test("products honour the delay parameter", async ({ request }) => {
    const started = Date.now();
    const response = await request.get("/api/products?delay=600");
    expect(response.ok()).toBe(true);
    expect(Date.now() - started).toBeGreaterThanOrEqual(550);
  });

  test("employees are paged and searchable", async ({ request }) => {
    const first = await request.get("/api/employees");
    const body = (await first.json()) as { employees: { id: number }[]; page: number; pageSize: number; total: number; totalPages: number };
    expect(body).toMatchObject({ page: 1, pageSize: 5, total: 30, totalPages: 6 });
    expect(body.employees.map((e) => e.id)).toEqual([1, 2, 3, 4, 5]);

    const page2 = (await (await request.get("/api/employees?page=2&pageSize=10")).json()) as {
      employees: { id: number }[];
    };
    expect(page2.employees[0].id).toBe(11);
    expect(page2.employees).toHaveLength(10);

    const search = (await (await request.get("/api/employees?search=engineering&pageSize=50")).json()) as {
      employees: { department: string }[];
      total: number;
    };
    expect(search.total).toBe(9);
    expect(search.employees.every((e) => e.department === "Engineering")).toBe(true);

    const beyond = (await (await request.get("/api/employees?page=99")).json()) as { employees: unknown[] };
    expect(beyond.employees).toEqual([]);
  });

  test("employees reject bad paging", async ({ request }) => {
    const size = await request.get("/api/employees?pageSize=51");
    expect(size.status()).toBe(400);
    expect(await size.json()).toEqual({ error: "pageSize must be an integer between 1 and 50" });
    const page = await request.get("/api/employees?page=0");
    expect(page.status()).toBe(400);
    expect(await page.json()).toEqual({ error: "page must be a positive integer" });
  });

  test("notifications are listed", async ({ request }) => {
    const { notifications } = (await (await request.get("/api/notifications")).json()) as {
      notifications: { id: number; message: string }[];
    };
    expect(notifications).toHaveLength(2);
    expect(notifications[0]).toEqual({ id: 1, message: "Your test run finished: 42 passed" });
  });

  test("cities match without case or accents, with a limit of 8", async ({ request }) => {
    const da = (await (await request.get("/api/cities?search=da")).json()) as { cities: string[] };
    expect(da.cities).toEqual([
      "Amsterdam, Netherlands",
      "Budapest, Hungary",
      "Gdańsk, Poland",
      "London, Canada",
      "Montreal, Canada",
      "Toronto, Canada",
    ]);
    const paris = (await (await request.get("/api/cities?search=PARIS")).json()) as { cities: string[] };
    expect(paris.cities).toEqual(["Paris, France", "Paris, United States"]);
    const many = (await (await request.get("/api/cities?search=a")).json()) as { cities: string[] };
    expect(many.cities).toHaveLength(8);
    expect((await (await request.get("/api/cities")).json()) as unknown).toEqual({ cities: [] });
  });
});

test.describe("registration helpers", () => {
  test("usernames are checked", async ({ request }) => {
    expect(await (await request.get("/api/usernames/new_user1")).json()).toEqual({ username: "new_user1", available: true });
    expect(await (await request.get("/api/usernames/Admin")).json()).toEqual({ username: "Admin", available: false });
    const bad = await request.get("/api/usernames/a%20b");
    expect(bad.status()).toBe(400);
    expect(await bad.json()).toEqual({ error: "username must be 3–20 letters, digits or underscores" });
    expect((await request.get("/api/usernames/ab")).status()).toBe(400);
  });

  test("register validates and detects a taken email", async ({ request }) => {
    const ok = await request.post("/api/register", { data: { email: "new@example.com", age: 30 } });
    expect(ok.status()).toBe(201);
    expect(await ok.json()).toEqual({ email: "new@example.com", age: 30 });

    const taken = await request.post("/api/register", { data: { email: "taken@example.com", age: 30 } });
    expect(taken.status()).toBe(409);

    expect((await request.post("/api/register", { data: { email: "nope", age: 30 } })).status()).toBe(400);
    expect((await request.post("/api/register", { data: { email: "new@example.com", age: 17 } })).status()).toBe(400);
    expect((await request.post("/api/register", { data: { email: "new@example.com", age: "x" } })).status()).toBe(400);
  });
});

test.describe("files", () => {
  test("upload reads the files field", async ({ request }) => {
    const response = await request.post("/api/upload", {
      multipart: {
        files: { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
      },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      files: [{ name: "notes.txt", size: 5, type: "text/plain" }],
      totalBytes: 5,
    });
  });

  test("upload rejects a missing file and a too large upload", async ({ request }) => {
    const none = await request.post("/api/upload", { multipart: { other: "x" } });
    expect(none.status()).toBe(400);
    const big = await request.post("/api/upload", {
      multipart: {
        files: { name: "big.bin", mimeType: "application/octet-stream", buffer: Buffer.alloc(2 * 1024 * 1024 + 1) },
      },
    });
    expect(big.status()).toBe(413);
    expect(await big.json()).toHaveProperty("error");
    const notMultipart = await request.post("/api/upload", { data: { files: [] } });
    expect(notMultipart.status()).toBe(400);
  });

  test("monthly report is an attachment", async ({ request }) => {
    const response = await request.get("/api/reports/monthly");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    expect(response.headers()["content-disposition"]).toMatch(/^attachment; filename="report-\d{4}-\d{2}\.txt"$/);
    expect(await response.text()).toContain("Monthly report");
  });
});

test.describe("checkout", () => {
  test("cart and shipping give a total of 47.5", async ({ request }) => {
    const cart = (await (await request.get("/api/checkout/cart")).json()) as { items: unknown[]; subtotal: number };
    expect(cart.subtotal).toBe(40);
    expect(cart.items).toHaveLength(2);
    const started = Date.now();
    const shipping = await request.get("/api/checkout/shipping");
    expect(Date.now() - started).toBeGreaterThanOrEqual(1400);
    expect(await shipping.json()).toEqual({ shipping: 7.5 });
  });

  test("a payment with the wrong total fails with 422 and is recorded", async ({ request }) => {
    const bad = await request.post("/api/checkout/pay", { data: { total: 40 } });
    expect(bad.status()).toBe(422);
    expect(await bad.json()).toEqual({ error: expect.any(String), code: "TOTAL_MISMATCH" });
    const id = bad.headers()["x-request-id"];
    expect(id).toMatch(/^req_[a-z0-9]+$/);

    const recorded = await request.get(`/api/checkout/payments/${id}`);
    expect(await recorded.json()).toEqual({ id, failed: true });
    const unknown = await request.get("/api/checkout/payments/req_unknown");
    expect(await unknown.json()).toEqual({ id: "req_unknown", failed: false });
  });

  test("a payment with the right total succeeds", async ({ request }) => {
    const ok = await request.post("/api/checkout/pay", { data: { total: 47.5 } });
    expect(ok.status()).toBe(201);
    expect(await ok.json()).toEqual({ order: expect.any(String) });
    expect(ok.headers()["x-request-id"]).toMatch(/^req_/);
    const good = await request.get(`/api/checkout/payments/${ok.headers()["x-request-id"]}`);
    expect(((await good.json()) as { failed: boolean }).failed).toBe(false);
  });

  test("a payment without a numeric total answers 400", async ({ request }) => {
    expect((await request.post("/api/checkout/pay", { data: {} })).status()).toBe(400);
    expect((await request.post("/api/checkout/pay", { data: { total: "47.5" } })).status()).toBe(400);
  });
});
