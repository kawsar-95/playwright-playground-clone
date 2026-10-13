import { Code, Lesson, PageHeader, TestCard } from "../../components";

interface Endpoint {
  method: string;
  path: string;
  body?: string;
  responses: string;
  notes?: string;
}

const REFERENCE: { group: string; endpoints: Endpoint[] }[] = [
  {
    group: "Users",
    endpoints: [
      { method: "GET", path: "/api/users", responses: "200 { users: User[] }", notes: "Optional ?role=Admin|Manager|User filter." },
      { method: "GET", path: "/api/users/:id", responses: "200 User · 400 non-numeric id · 404 not found" },
      {
        method: "POST",
        path: "/api/users",
        body: "{ firstName, lastName, role }",
        responses: "201 User + Location header · 400 validation error",
        notes: "All fields are required. role must be Admin, Manager or User.",
      },
      {
        method: "PUT",
        path: "/api/users/:id",
        body: "{ firstName, lastName, role }",
        responses: "200 User · 400 · 404",
        notes: "Replaces the user, so every field is required.",
      },
      {
        method: "PATCH",
        path: "/api/users/:id",
        body: "any of { firstName, lastName, role }",
        responses: "200 User · 400 · 404",
        notes: "Changes only the fields that you send.",
      },
      { method: "DELETE", path: "/api/users/:id", responses: "204 no body · 404" },
    ],
  },
  {
    group: "Authentication",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/login",
        body: "{ username, password }",
        responses: "200 { token } · 401",
        notes: "Demo credentials: TedBuckland / Alligator3.",
      },
      {
        method: "GET",
        path: "/api/me",
        responses: "200 { username, role } · 401",
        notes: "Needs an Authorization: Bearer <token> header.",
      },
    ],
  },
  {
    group: "Other",
    endpoints: [
      { method: "GET", path: "/api/products", responses: "200 { products: Product[] }", notes: "Optional ?search=text and ?delay=ms (maximum 10000)." },
      {
        method: "GET",
        path: "/api/employees",
        responses: "200 { employees, page, pageSize, total, totalPages } · 400",
        notes: "Read-only. Optional ?search=text, ?page=1, ?pageSize=5 (maximum 50).",
      },
      { method: "GET", path: "/api/notifications", responses: "200 { notifications: Notification[] }" },
      { method: "GET", path: "/api/cities", responses: "200 { cities: string[] }", notes: "Up to 8 matches for ?search=text. Optional ?delay=ms." },
      { method: "GET", path: "/api/usernames/:name", responses: "200 { username, available } · 400" },
      {
        method: "POST",
        path: "/api/register",
        body: "{ email, age }",
        responses: "201 { email, age } · 400 · 409 email taken",
        notes: "The API only checks the values and stores nothing. taken@example.com is always taken.",
      },
      {
        method: "POST",
        path: "/api/upload",
        body: 'multipart/form-data, "files" field',
        responses: "200 { files: { name, size, type }[], totalBytes } · 400 · 413",
        notes: "Maximum 2 MB in total. The API reads the files and does not store them.",
      },
      { method: "GET", path: "/api/reports/monthly", responses: "200 text file, Content-Disposition: attachment" },
      { method: "GET", path: "/api/checkout/cart", responses: "200 { items, subtotal }" },
      { method: "GET", path: "/api/checkout/shipping", responses: "200 { shipping }", notes: "This request takes about 1.5 seconds. This is on purpose." },
      {
        method: "POST",
        path: "/api/checkout/pay",
        body: "{ total }",
        responses: "201 { order } · 400 · 422 { error, code } when the total is wrong",
        notes: "Every response has an X-Request-Id header.",
      },
      {
        method: "GET",
        path: "/api/checkout/payments/:id",
        responses: "200 { id, failed }",
        notes: "failed is true for your own rejected payments.",
      },
      { method: "GET", path: "/api/status/:code", responses: "Answers with the status that you ask for (200–599)" },
      {
        method: "POST",
        path: "/api/reset",
        responses: "204 no body",
        notes: "Restores the three seed users and signs out your tokens.",
      },
    ],
  },
];

export default function ApiTesting() {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <>
      <PageHeader title="API Testing">Test the practice API directly with the request fixture of Playwright. No browser is needed.</PageHeader>

      <Lesson title="API tests with the request fixture">
        <h3>Why test the API directly?</h3>
        <p>
          An API test does not start a browser. It runs in milliseconds and fails with a precise reason. Use it to check
          business rules and error handling. Use it also to make test data fast for your UI tests.
        </p>
        <h3>Your first request</h3>
        <p>
          The <code>request</code> fixture uses the <code>baseURL</code> from <code>playwright.config.ts</code>. Because
          of this, relative paths work. Set <code>baseURL</code> to <code>{origin}</code>.
        </p>
        <Code>{`
import { expect, test } from '@playwright/test';

test('lists users', async ({ request }) => {
  const response = await request.get('/api/users');

  await expect(response).toBeOK(); // any 2xx status
  const body = await response.json();

  expect(body.users).toContainEqual(
    expect.objectContaining({ firstName: 'John', role: 'Admin' })
  );
});
`}</Code>
        <h3>Create, verify, clean up</h3>
        <Code>{`
test('creates a user', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: { firstName: 'Eve', lastName: 'Adams', role: 'User' },
  });

  expect(response.status()).toBe(201);
  const user = await response.json();

  expect(user).toEqual({
    id: expect.any(Number),
    firstName: 'Eve',
    lastName: 'Adams',
    role: 'User',
  });
  expect(response.headers()['location']).toBe(\`/api/users/\${user.id}\`);

  // Leave the API as you found it.
  await request.delete(\`/api/users/\${user.id}\`);
});
`}</Code>
        <p>
          Playwright sends <code>data</code> as JSON and sets the <code>Content-Type</code> header. Use{" "}
          <code>params</code> for the query string, for example{" "}
          <code>request.get('/api/users', {"{ params: { role: 'Admin' } }"})</code>.
        </p>
        <h3>Test the unhappy paths</h3>
        <p>
          APIs break most often in error responses. Assert the status <em>and</em> the error message.
        </p>
        <Code>{`
const response = await request.post('/api/users', {
  data: { firstName: 'Eve' },
});

expect(response.status()).toBe(400);
expect(await response.json()).toEqual({ error: 'lastName is required' });
`}</Code>
        <h3>Authenticated requests</h3>
        <p>Log in one time. Then send the token with each request. Use a separate request context for this.</p>
        <Code>{`
test('reads the current user', async ({ playwright, baseURL }) => {
  const anonymous = await playwright.request.newContext({ baseURL });
  const login = await anonymous.post('/api/auth/login', {
    data: { username: 'TedBuckland', password: 'Alligator3' },
  });
  const { token } = await login.json();

  const api = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Authorization: \`Bearer \${token}\` },
  });

  const me = await api.get('/api/me');
  expect(await me.json()).toEqual({ username: 'TedBuckland', role: 'Admin' });

  await anonymous.dispose();
  await api.dispose();
});
`}</Code>
        <h3>Use the API to prepare UI tests</h3>
        <p>
          Data that you create through the UI is slow and fragile. Create it with an API call. Then test only the screen
          that you care about.
        </p>
        <Code>{`
test('new user appears in the table', async ({ page, request }) => {
  const created = await request.post('/api/users', {
    data: { firstName: 'Zoe', lastName: 'Setup', role: 'Manager' },
  });
  const user = await created.json();

  await page.goto('/network/api');
  await page.getByRole('button', { name: 'GET Users' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Setup' })).toBeVisible();

  await request.delete(\`/api/users/\${user.id}\`);
});
`}</Code>
        <div className="lesson-callout">
          <strong>Your tests share the same data.</strong> Playwright runs tests in parallel. Do not assert the exact
          number of users. Do not call <code>/api/reset</code> from a test, because another test can use the data that
          you delete. Create data with a unique name, assert on it, and delete it at the end. If you must reset, do it one
          time before the run, in a global setup.
        </div>
      </Lesson>

      <TestCard title="API Reference">
        <p>
          Base URL: <code>{origin}</code>. Request and response bodies are JSON. Errors look like{" "}
          <code>{'{ "error": "message" }'}</code>. A known endpoint that gets the wrong method answers <code>405</code>
          , with an <code>Allow</code> header that lists the accepted methods. An unknown endpoint answers{" "}
          <code>404</code>.
        </p>
        <table className="api-reference">
          <caption>Practice API endpoints</caption>
          <thead>
            <tr>
              <th scope="col">Endpoint</th>
              <th scope="col">Request body</th>
              <th scope="col">Responses</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          {REFERENCE.map(({ group, endpoints }) => (
            <tbody key={group}>
              <tr>
                <th scope="rowgroup" colSpan={4}>
                  {group}
                </th>
              </tr>
              {endpoints.map((e) => (
                <tr key={`${e.method} ${e.path}`}>
                  <td>
                    <span className="method">{e.method}</span>
                    <code>{e.path}</code>
                  </td>
                  <td>{e.body ?? "—"}</td>
                  <td>{e.responses}</td>
                  <td>{e.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </TestCard>

      <TestCard title="Data Models">
        <pre className="api-response">{`type User = {
  id: number;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Manager' | 'User';
};

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
  city: string;
};

type Notification = {
  id: number;
  message: string;
};`}</pre>
      </TestCard>
    </>
  );
}
