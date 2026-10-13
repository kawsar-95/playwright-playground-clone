import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

/**
 * Mock backend for the practice site. It runs as middleware under `/api`
 * for both `vite dev` and `vite preview`. All data lives in memory and is
 * shared by every client of one server process.
 */

type Role = "Admin" | "Manager" | "User";
interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: Role;
}

const ROLES: Role[] = ["Admin", "Manager", "User"];
const DEMO_USERNAME = "TedBuckland";
const DEMO_PASSWORD = "Alligator3";
const SHIPPING = 7.5;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const SEED_USERS: User[] = [
  { id: 1, firstName: "John", lastName: "Smith", role: "Admin" },
  { id: 2, firstName: "Anna", lastName: "Kowalski", role: "User" },
  { id: 3, firstName: "Michael", lastName: "Brown", role: "Manager" },
];

const PRODUCTS = [
  { id: 1, name: "Laptop", price: 4999, category: "Computers" },
  { id: 2, name: "Keyboard", price: 299, category: "Accessories" },
  { id: 3, name: "Mouse", price: 149, category: "Accessories" },
  { id: 4, name: "Monitor", price: 1299, category: "Computers" },
  { id: 5, name: "Headphones", price: 399, category: "Audio" },
];

const NOTIFICATIONS = [
  { id: 1, message: "Your test run finished: 42 passed" },
  { id: 2, message: "A new comment was added to your bug report" },
];

const CART = [
  { name: "Mechanical keyboard", price: 32 },
  { name: "Mouse pad", price: 8 },
];

const CITIES = [
  "Amsterdam, Netherlands",
  "Athens, Greece",
  "Barcelona, Spain",
  "Berlin, Germany",
  "Boston, United States",
  "Budapest, Hungary",
  "Cape Town, South Africa",
  "Chicago, United States",
  "Copenhagen, Denmark",
  "Dublin, Ireland",
  "Edinburgh, United Kingdom",
  "Frankfurt, Germany",
  "Gdańsk, Poland",
  "Helsinki, Finland",
  "Istanbul, Turkey",
  "Lisbon, Portugal",
  "London, Canada",
  "London, United Kingdom",
  "Los Angeles, United States",
  "Lyon, France",
  "Madrid, Spain",
  "Milan, Italy",
  "Montreal, Canada",
  "Munich, Germany",
  "New York, United States",
  "Oslo, Norway",
  "Paris, France",
  "Paris, United States",
  "Prague, Czechia",
  "Rome, Italy",
  "San Francisco, United States",
  "Seattle, United States",
  "Stockholm, Sweden",
  "Sydney, Australia",
  "Tokyo, Japan",
  "Toronto, Canada",
  "Vienna, Austria",
  "Warsaw, Poland",
  "Zurich, Switzerland",
];

const EMPLOYEES = [
  [1, "Olivia", "Martin", "Engineering", "Warsaw"],
  [2, "Liam", "Nowak", "Sales", "Berlin"],
  [3, "Emma", "Fischer", "Marketing", "London"],
  [4, "Noah", "Kowalczyk", "Engineering", "Krakow"],
  [5, "Ava", "Schmidt", "Support", "Munich"],
  [6, "Lucas", "Dubois", "Finance", "Paris"],
  [7, "Mia", "Wójcik", "Engineering", "Warsaw"],
  [8, "Ethan", "Rossi", "Sales", "Milan"],
  [9, "Sophia", "Novak", "Support", "Prague"],
  [10, "Mason", "Jensen", "Marketing", "Copenhagen"],
  [11, "Isabella", "Garcia", "Finance", "Madrid"],
  [12, "Logan", "Kamińska", "Engineering", "Gdansk"],
  [13, "Amelia", "Weber", "Sales", "Hamburg"],
  [14, "James", "Taylor", "Support", "London"],
  [15, "Harper", "Lewandowski", "Engineering", "Poznan"],
  [16, "Elijah", "Bauer", "Finance", "Vienna"],
  [17, "Evelyn", "Moreau", "Marketing", "Lyon"],
  [18, "Benjamin", "Zieliński", "Sales", "Wroclaw"],
  [19, "Abigail", "Hansen", "Engineering", "Oslo"],
  [20, "Henry", "Bianchi", "Support", "Rome"],
  [21, "Emily", "Dvořák", "Finance", "Brno"],
  [22, "Alexander", "Meyer", "Engineering", "Berlin"],
  [23, "Ella", "Lindqvist", "Marketing", "Stockholm"],
  [24, "Daniel", "Szymański", "Sales", "Lodz"],
  [25, "Scarlett", "Laurent", "Support", "Brussels"],
  [26, "Quinn", "Harris", "Engineering", "Dublin"],
  [27, "Grace", "Horvat", "Finance", "Zagreb"],
  [28, "Jack", "Wagner", "Sales", "Zurich"],
  [29, "Chloe", "Kovač", "Marketing", "Ljubljana"],
  [30, "Owen", "Virtanen", "Engineering", "Helsinki"],
].map(([id, firstName, lastName, department, city]) => ({ id, firstName, lastName, department, city }));

/** Names that are not available for registration (compared in lower case). */
const TAKEN_USERNAMES = new Set(["admin"]);
const TAKEN_EMAIL = "taken@example.com";

// ---------------------------------------------------------------- state

interface State {
  users: User[];
  nextId: number;
  tokens: Map<string, string>;
  failedPayments: Set<string>;
}

function freshState(): State {
  return {
    users: SEED_USERS.map((u) => ({ ...u })),
    nextId: 4,
    tokens: new Map(),
    failedPayments: new Set(),
  };
}

// ---------------------------------------------------------------- helpers

type Handler = (ctx: Ctx) => void | Promise<void>;

interface Ctx {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  params: string[];
  state: State;
}

function sendJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", Buffer.byteLength(payload));
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(payload);
}

function sendError(res: ServerResponse, status: number, error: string, extra: Record<string, unknown> = {}): void {
  sendJson(res, status, { error, ...extra });
}

function sendEmpty(res: ServerResponse, status: number): void {
  res.statusCode = status;
  res.end();
}

function readBody(req: IncomingMessage, limit: number): Promise<Buffer | "too-large"> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        tooLarge = true;
        return; // keep draining, drop the data
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(tooLarge ? "too-large" : Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

type JsonResult = { ok: true; value: Record<string, unknown> } | { ok: false };

async function readJson(req: IncomingMessage): Promise<JsonResult> {
  const body = await readBody(req, 1024 * 1024);
  if (body === "too-large") return { ok: false };
  const text = body.toString("utf8").trim();
  if (text === "") return { ok: true, value: {} };
  try {
    const value: unknown = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) return { ok: false };
    return { ok: true, value: value as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}

function fold(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function requestId(): string {
  return `req_${randomBytes(5).toString("hex")}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseUserId(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

// ---------------------------------------------------------------- handlers

const usersList: Handler = ({ res, url, state }) => {
  const role = url.searchParams.get("role");
  const users = role ? state.users.filter((u) => u.role === role) : state.users;
  sendJson(res, 200, { users });
};

const usersCreate: Handler = async ({ req, res, state }) => {
  const json = await readJson(req);
  if (!json.ok) return sendError(res, 400, "Invalid JSON body");
  const { firstName, lastName, role } = json.value;
  if (!nonEmptyString(firstName)) return sendError(res, 400, "firstName is required");
  if (!nonEmptyString(lastName)) return sendError(res, 400, "lastName is required");
  if (!nonEmptyString(role)) return sendError(res, 400, "role is required");
  if (!ROLES.includes(role as Role)) return sendError(res, 400, "role must be Admin, Manager or User");
  const user: User = { id: state.nextId++, firstName: firstName.trim(), lastName: lastName.trim(), role: role as Role };
  state.users.push(user);
  sendJson(res, 201, user, { Location: `/api/users/${user.id}` });
};

function withUser(fn: (ctx: Ctx, user: User, id: number) => void | Promise<void>): Handler {
  return (ctx) => {
    const id = parseUserId(ctx.params[0]);
    if (id === null) return sendError(ctx.res, 400, "id must be a number");
    const user = ctx.state.users.find((u) => u.id === id);
    if (!user) return sendError(ctx.res, 404, "User not found");
    return fn(ctx, user, id);
  };
}

const userGet = withUser(({ res }, user) => sendJson(res, 200, user));

const userPut = withUser(async ({ req, res }, user) => {
  const json = await readJson(req);
  if (!json.ok) return sendError(res, 400, "Invalid JSON body");
  const { firstName, lastName, role } = json.value;
  if (!nonEmptyString(firstName)) return sendError(res, 400, "firstName is required");
  if (!nonEmptyString(lastName)) return sendError(res, 400, "lastName is required");
  if (!nonEmptyString(role)) return sendError(res, 400, "role is required");
  if (!ROLES.includes(role as Role)) return sendError(res, 400, "role must be Admin, Manager or User");
  user.firstName = firstName.trim();
  user.lastName = lastName.trim();
  user.role = role as Role;
  sendJson(res, 200, user);
});

const userPatch = withUser(async ({ req, res }, user) => {
  const json = await readJson(req);
  if (!json.ok) return sendError(res, 400, "Invalid JSON body");
  const { firstName, lastName, role } = json.value;
  if (firstName === undefined && lastName === undefined && role === undefined) {
    return sendError(res, 400, "Send at least one of firstName, lastName or role");
  }
  if (firstName !== undefined && !nonEmptyString(firstName)) return sendError(res, 400, "firstName must be a non-empty string");
  if (lastName !== undefined && !nonEmptyString(lastName)) return sendError(res, 400, "lastName must be a non-empty string");
  if (role !== undefined && !ROLES.includes(role as Role)) return sendError(res, 400, "role must be Admin, Manager or User");
  if (firstName !== undefined) user.firstName = (firstName as string).trim();
  if (lastName !== undefined) user.lastName = (lastName as string).trim();
  if (role !== undefined) user.role = role as Role;
  sendJson(res, 200, user);
});

const userDelete = withUser(({ res, state }, user) => {
  state.users = state.users.filter((u) => u.id !== user.id);
  sendEmpty(res, 204);
});

const login: Handler = async ({ req, res, state }) => {
  const json = await readJson(req);
  const body = json.ok ? json.value : {};
  if (body.username === DEMO_USERNAME && body.password === DEMO_PASSWORD) {
    const token = randomBytes(24).toString("hex");
    state.tokens.set(token, DEMO_USERNAME);
    return sendJson(res, 200, { token });
  }
  sendError(res, 401, "Invalid username or password");
};

const me: Handler = ({ req, res, state }) => {
  const header = req.headers.authorization ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  const username = match ? state.tokens.get(match[1]) : undefined;
  if (!username) return sendError(res, 401, "Missing or invalid bearer token");
  sendJson(res, 200, { username, role: "Admin" });
};

const products: Handler = async ({ res, url }) => {
  const rawDelay = Number(url.searchParams.get("delay"));
  if (Number.isFinite(rawDelay) && rawDelay > 0) await sleep(Math.min(rawDelay, 10000));
  const search = fold((url.searchParams.get("search") ?? "").trim());
  const list = search ? PRODUCTS.filter((p) => fold(p.name).includes(search)) : PRODUCTS;
  sendJson(res, 200, { products: list });
};

const employees: Handler = ({ res, url }) => {
  const pageRaw = url.searchParams.get("page") ?? "1";
  const sizeRaw = url.searchParams.get("pageSize") ?? "5";
  if (!/^\d+$/.test(pageRaw) || Number(pageRaw) < 1) return sendError(res, 400, "page must be a positive integer");
  if (!/^\d+$/.test(sizeRaw) || Number(sizeRaw) < 1 || Number(sizeRaw) > 50) {
    return sendError(res, 400, "pageSize must be an integer between 1 and 50");
  }
  const page = Number(pageRaw);
  const pageSize = Number(sizeRaw);
  const search = fold((url.searchParams.get("search") ?? "").trim());
  const matches = search
    ? EMPLOYEES.filter((e) => fold(`${e.firstName} ${e.lastName} ${e.department} ${e.city}`).includes(search))
    : EMPLOYEES;
  const start = (page - 1) * pageSize;
  sendJson(res, 200, {
    employees: matches.slice(start, start + pageSize),
    page,
    pageSize,
    total: matches.length,
    totalPages: Math.ceil(matches.length / pageSize),
  });
};

const notifications: Handler = ({ res }) => sendJson(res, 200, { notifications: NOTIFICATIONS });

const cities: Handler = async ({ res, url }) => {
  const delay = Number(url.searchParams.get("delay"));
  if (Number.isFinite(delay) && delay > 0) await sleep(Math.min(delay, 10000));
  const search = fold((url.searchParams.get("search") ?? "").trim());
  const found = search
    ? CITIES.filter((c) => fold(c).includes(search))
        .sort((a, b) => fold(a).localeCompare(fold(b)))
        .slice(0, 8)
    : [];
  sendJson(res, 200, { cities: found });
};

const usernames: Handler = ({ res, params }) => {
  let name: string;
  try {
    name = decodeURIComponent(params[0]);
  } catch {
    name = "";
  }
  if (!/^[a-z0-9_]{3,20}$/i.test(name)) {
    return sendError(res, 400, "username must be 3–20 letters, digits or underscores");
  }
  sendJson(res, 200, { username: name, available: !TAKEN_USERNAMES.has(name.toLowerCase()) });
};

const register: Handler = async ({ req, res }) => {
  const json = await readJson(req);
  if (!json.ok) return sendError(res, 400, "Invalid JSON body");
  const { email, age } = json.value;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, 400, "email must be a valid email address");
  }
  if (typeof age !== "number" || !Number.isFinite(age) || age < 18 || age > 100) {
    return sendError(res, 400, "age must be a number between 18 and 100");
  }
  if (email.toLowerCase() === TAKEN_EMAIL) return sendError(res, 409, "Email is already registered");
  sendJson(res, 201, { email, age });
};

const upload: Handler = async ({ req, res }) => {
  const contentType = req.headers["content-type"] ?? "";
  if (!/^multipart\/form-data/i.test(contentType)) {
    return sendError(res, 400, "Send the files as multipart/form-data");
  }
  const declared = Number(req.headers["content-length"]);
  const body = await readBody(req, MAX_UPLOAD_BYTES + 64 * 1024);
  if (body === "too-large" || (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES + 64 * 1024)) {
    return sendError(res, 413, "Files are too large. The limit is 2 MB in total");
  }
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(body), { headers: { "content-type": contentType } }).formData();
  } catch {
    return sendError(res, 400, "Could not read the multipart body");
  }
  const files = form.getAll("files").filter((v): v is File => typeof v !== "string");
  if (files.length === 0) return sendError(res, 400, 'No files found in the "files" field');
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > MAX_UPLOAD_BYTES) return sendError(res, 413, "Files are too large. The limit is 2 MB in total");
  sendJson(res, 200, {
    files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    totalBytes,
  });
};

const monthlyReport: Handler = ({ res }) => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const text = `Monthly report ${month}\n\nTests run: 412\nPassed: 398\nFailed: 9\nSkipped: 5\n`;
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="report-${month}.txt"`);
  res.setHeader("Content-Length", Buffer.byteLength(text));
  res.end(text);
};

const cart: Handler = ({ res }) => {
  const subtotal = CART.reduce((sum, i) => sum + i.price, 0);
  sendJson(res, 200, { items: CART, subtotal });
};

const shipping: Handler = async ({ res }) => {
  await sleep(1500);
  sendJson(res, 200, { shipping: SHIPPING });
};

const pay: Handler = async ({ req, res, state }) => {
  const json = await readJson(req);
  if (!json.ok) return sendError(res, 400, "Invalid JSON body");
  const { total } = json.value;
  if (typeof total !== "number" || !Number.isFinite(total) || total <= 0) {
    return sendError(res, 400, "total must be a positive number");
  }
  const expected = CART.reduce((sum, i) => sum + i.price, 0) + SHIPPING;
  if (Math.abs(total - expected) > 0.005) {
    state.failedPayments.add(String(res.getHeader("X-Request-Id")));
    return sendError(res, 422, "Total does not match the order", { code: "TOTAL_MISMATCH" });
  }
  sendJson(res, 201, { order: `ORD-${randomBytes(3).toString("hex").toUpperCase()}` });
};

const payment: Handler = ({ res, params, state }) => {
  let id: string;
  try {
    id = decodeURIComponent(params[0]);
  } catch {
    id = params[0];
  }
  sendJson(res, 200, { id, failed: state.failedPayments.has(id) });
};

const statusCode: Handler = ({ res, params }) => {
  const raw = params[0];
  const code = /^\d{3}$/.test(raw) ? Number(raw) : NaN;
  if (!(code >= 200 && code <= 599)) {
    return sendError(res, 400, "code must be an HTTP status between 200 and 599");
  }
  if (code === 204 || code === 205 || code === 304) return sendEmpty(res, code);
  sendJson(res, code, { status: code, message: `Response with status ${code}` });
};

const reset: Handler = ({ res, state }) => {
  state.users = SEED_USERS.map((u) => ({ ...u }));
  state.nextId = 4;
  state.tokens.clear();
  sendEmpty(res, 204);
};

// ---------------------------------------------------------------- routing

interface Route {
  pattern: RegExp;
  methods: Record<string, Handler>;
  requestId?: boolean;
}

const ROUTES: Route[] = [
  { pattern: /^\/users$/, methods: { GET: usersList, POST: usersCreate } },
  {
    pattern: /^\/users\/([^/]+)$/,
    methods: { GET: userGet, PUT: userPut, PATCH: userPatch, DELETE: userDelete },
  },
  { pattern: /^\/auth\/login$/, methods: { POST: login } },
  { pattern: /^\/me$/, methods: { GET: me } },
  { pattern: /^\/products$/, methods: { GET: products } },
  { pattern: /^\/employees$/, methods: { GET: employees } },
  { pattern: /^\/notifications$/, methods: { GET: notifications } },
  { pattern: /^\/cities$/, methods: { GET: cities } },
  { pattern: /^\/usernames\/([^/]+)$/, methods: { GET: usernames } },
  { pattern: /^\/register$/, methods: { POST: register } },
  { pattern: /^\/upload$/, methods: { POST: upload } },
  { pattern: /^\/reports\/monthly$/, methods: { GET: monthlyReport } },
  { pattern: /^\/checkout\/cart$/, methods: { GET: cart }, requestId: true },
  { pattern: /^\/checkout\/shipping$/, methods: { GET: shipping }, requestId: true },
  { pattern: /^\/checkout\/pay$/, methods: { POST: pay }, requestId: true },
  { pattern: /^\/checkout\/payments\/([^/]+)$/, methods: { GET: payment }, requestId: true },
  { pattern: /^\/status\/([^/]+)$/, methods: { GET: statusCode } },
  { pattern: /^\/reset$/, methods: { POST: reset } },
];

/** Creates one API handler with its own in-memory state. Tests can mount it on a plain Node server. */
export function createApiHandler(): (req: IncomingMessage, res: ServerResponse, next: () => void) => void {
  const state = freshState();
  return (req, res, next) => {
    const rawUrl = req.url ?? "/";
    const url = new URL(rawUrl, "http://localhost");
    if (!(url.pathname === "/api" || url.pathname.startsWith("/api/"))) return next();
    const path = url.pathname.slice(4) || "/";
    const method = (req.method ?? "GET").toUpperCase();

    for (const route of ROUTES) {
      const match = route.pattern.exec(path);
      if (!match) continue;
      if (route.requestId) res.setHeader("X-Request-Id", requestId());
      const effective = method === "HEAD" && route.methods.GET ? "GET" : method;
      const handler = route.methods[effective];
      if (!handler) {
        const allowed = Object.keys(route.methods);
        const text = allowed.length === 1 ? `Use ${allowed[0]}.` : `Use ${allowed.join(", ")}.`;
        res.setHeader("Allow", allowed.join(", "));
        sendError(res, 405, `Method not allowed. ${text}`);
        return;
      }
      const ctx: Ctx = { req, res, url, params: match.slice(1), state };
      Promise.resolve(handler(ctx)).catch(() => {
        if (!res.headersSent) sendError(res, 500, "Internal server error");
        else res.end();
      });
      return;
    }
    sendError(res, 404, "Endpoint not found");
  };
}

export function apiPlugin(): Plugin {
  const handler = createApiHandler();
  return {
    name: "practice-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
