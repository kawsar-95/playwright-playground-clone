import { useState, type FormEvent } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

interface Shown {
  method: string;
  url: string;
  status: number;
  durationMs: number;
  body: unknown;
}

const ROLES = ["Admin", "Manager", "User"];

export default function ApiPlayground() {
  const [users, setUsers] = useState<User[]>([]);
  const [shown, setShown] = useState<Shown | null>(null);
  const [networkError, setNetworkError] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("User");

  async function call(method: string, url: string, body?: unknown): Promise<{ ok: boolean; body: unknown }> {
    setLoading(true);
    setShown(null);
    setNetworkError("");
    const started = performance.now();
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await response.text();
      const parsed: unknown = text ? JSON.parse(text) : null;
      setShown({ method, url, status: response.status, durationMs: Math.round(performance.now() - started), body: parsed });
      return { ok: response.ok, body: parsed };
    } catch (error) {
      setNetworkError(error instanceof Error ? error.message : "Unknown network error");
      return { ok: false, body: null };
    } finally {
      setLoading(false);
    }
  }

  async function getUsers() {
    const result = await call("GET", "/api/users");
    if (result.ok) setUsers((result.body as { users: User[] }).users);
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    const result = await call("POST", "/api/users", { firstName, lastName, role });
    if (result.ok) {
      setFirstName("");
      setLastName("");
    }
  }

  async function reset() {
    await call("POST", "/api/reset");
    setUsers([]);
  }

  return (
    <>
      <PageHeader title="API Playground">Practice working with HTTP requests, responses, delays, and API errors.</PageHeader>

      <Lesson title="Watching the network from a UI test">
        <h3>What happens when you click</h3>
        <p>
          Each button on this page sends a real HTTP request to the practice API. The page then shows the response. A
          good UI test checks two things: what the browser <em>sent and received</em>, and what the user{" "}
          <em>sees</em>.
        </p>
        <h3>Wait for the response, then assert</h3>
        <p>
          Start the wait <strong>before</strong> the click. A fast response can arrive before you start to listen. Then
          the wait ends with a timeout.
        </p>
        <Code>{`
const responsePromise = page.waitForResponse('**/api/users');
await page.getByRole('button', { name: 'GET Users' }).click();
const response = await responsePromise;

expect(response.status()).toBe(200);
const body = await response.json();

// The table shows what the API returned, plus one header row.
await expect(page.getByRole('row')).toHaveCount(body.users.length + 1);
`}</Code>
        <h3>Check what the page sent</h3>
        <p>
          Use <code>waitForRequest</code> to check the request that the UI built from your input. Check the method, the
          URL and the JSON body.
        </p>
        <Code>{`
const requestPromise = page.waitForRequest(
  (request) =>
    request.method() === 'POST' && request.url().endsWith('/api/users')
);

await page.getByLabel('First name').fill('Eve');
await page.getByLabel('Last name').fill('Adams');
await page.getByRole('button', { name: 'Create user' }).click();

const request = await requestPromise;
expect(request.postDataJSON()).toEqual({
  firstName: 'Eve',
  lastName: 'Adams',
  role: 'User',
});
`}</Code>
        <h3>Match URLs</h3>
        <ul>
          <li>
            A glob string such as <code>'**/api/users'</code> must match the <em>whole</em> URL. It does not match{" "}
            <code>/api/users/1</code> or <code>/api/users?role=Admin</code>.
          </li>
          <li>
            If the URL changes, use a regular expression such as <code>{"/\\/api\\/users\\/\\d+$/"}</code> or a
            predicate function.
          </li>
          <li>A predicate can also check the method. Then a GET and a POST to the same URL stay separate.</li>
        </ul>
        <h3>Listen to all traffic</h3>
        <Code>{`
page.on('response', (response) => {
  if (response.url().includes('/api/')) {
    console.log(response.status(), response.url());
  }
});
`}</Code>
        <div className="lesson-callout">
          This page has no validation in the browser. This is on purpose. Send the create form with empty fields. The API
          rejects the request with a <code>400</code> and the page shows the error.
        </div>
      </Lesson>

      <TestCard title="Users API">
        <div className="button-row">
          <button type="button" onClick={getUsers} disabled={loading}>
            GET Users
          </button>
          <button type="button" onClick={() => call("GET", "/api/users/1")} disabled={loading}>
            GET User 1
          </button>
          <button type="button" onClick={() => call("GET", "/api/users/999")} disabled={loading}>
            GET Missing User
          </button>
        </div>
      </TestCard>

      <TestCard title="Create User">
        <form onSubmit={createUser} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="api-first-name">First name</label>
              <input id="api-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="api-last-name">Last name</label>
              <input id="api-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="api-role">Role</label>
              <select id="api-role" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading}>
              Create user
            </button>
          </div>
        </form>
      </TestCard>

      <TestCard title="Delayed Response">
        <button type="button" onClick={() => call("GET", "/api/products?delay=2000")} disabled={loading}>
          GET Products — 2s Delay
        </button>
      </TestCard>

      <TestCard title="HTTP Errors">
        <div className="button-row">
          {[400, 404, 500].map((code) => (
            <button key={code} type="button" onClick={() => call("GET", `/api/status/${code}`)} disabled={loading}>
              HTTP {code}
            </button>
          ))}
        </div>
      </TestCard>

      <TestCard title="Test Data">
        <p>
          Your API data is private to you: other visitors cannot see or change it. Reset it to the three original users
          at any time.
        </p>
        <button type="button" className="danger" onClick={reset} disabled={loading}>
          Reset API data
        </button>
      </TestCard>

      {loading && (
        <div className="result" role="status" data-testid="api-loading">
          Loading...
        </div>
      )}
      {networkError && (
        <div className="result error" role="alert">
          Request failed: {networkError}
        </div>
      )}
      {shown && (
        <TestCard title="API Response">
          <div className="request-line">
            {shown.method} {shown.url} · {shown.durationMs} ms
          </div>
          <div className={shown.status < 400 ? "result success" : "result error"} data-testid="api-status">
            HTTP Status: {shown.status}
          </div>
          <pre className="api-response" data-testid="api-response">
            {shown.body === null ? "(no content)" : JSON.stringify(shown.body, null, 2)}
          </pre>
        </TestCard>
      )}

      {users.length > 0 && (
        <TestCard title="Users">
          <table>
            <caption>Users returned by the API</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">First Name</th>
                <th scope="col">Last Name</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.firstName}</td>
                  <td>{u.lastName}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TestCard>
      )}
    </>
  );
}
