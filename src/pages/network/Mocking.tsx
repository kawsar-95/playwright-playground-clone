import { useState, type FormEvent } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Notification {
  id: number;
  message: string;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return (await response.json()) as T;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function ProductTable({ products, caption }: { products: Product[]; caption: string }) {
  return (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Name</th>
          <th scope="col">Price</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td>{p.id}</td>
            <td>{p.name}</td>
            <td>{p.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Mocking() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);

  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Product[] | null>(null);
  const [searchError, setSearchError] = useState("");

  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [notifyError, setNotifyError] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);

  async function loadProducts() {
    setProductsLoading(true);
    setProducts([]);
    setProductsError("");
    try {
      const data = await getJson<{ products: Product[] }>("/api/products");
      setProducts(data.products);
    } catch (error) {
      setProductsError(errorText(error));
    } finally {
      setProductsLoading(false);
    }
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    setSearching(true);
    setResults(null);
    setSearchError("");
    try {
      const data = await getJson<{ products: Product[] }>(`/api/products?${new URLSearchParams({ search: term })}`);
      setResults(data.products);
    } catch (error) {
      setSearchError(errorText(error));
    } finally {
      setSearching(false);
    }
  }

  async function loadNotifications() {
    setNotifyLoading(true);
    setNotifyError("");
    try {
      const data = await getJson<{ notifications: Notification[] }>("/api/notifications");
      setNotifications(data.notifications);
    } catch (error) {
      setNotifications(null);
      setNotifyError(errorText(error));
    } finally {
      setNotifyLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Network Mocking">Practice intercepting and controlling network responses with Playwright.</PageHeader>

      <Lesson title="Intercepting requests with page.route()">
        <h3>Why mock?</h3>
        <p>
          A real backend seldom gives you an empty list, a 500 error, a 10-second delay or a dropped connection at the
          moment that you need one. With <code>page.route()</code>, your test decides what the browser receives. You can
          test these states on demand, and each run gives the same result.
        </p>
        <h3>What a route handler can do</h3>
        <ul>
          <li>
            <code>route.fulfill()</code>: answer with your own response. The request does not reach the server.
          </li>
          <li>
            <code>route.abort()</code>: fail the request, as if the network dropped.
          </li>
          <li>
            <code>route.continue()</code>: send the request to the server. You can change the URL, method, headers or
            body.
          </li>
          <li>
            <code>route.fetch()</code>: get the real response, so that you can change it before you fulfill the request.
          </li>
        </ul>
        <h3>Register the route before the request</h3>
        <Code>{`
await page.route('**/api/products', (route) =>
  route.fulfill({
    json: { products: [{ id: 99, name: 'Mock Product', price: 1 }] },
  })
);

await page.goto('/network/mocking');
await page.getByRole('button', { name: 'Load Products' }).click();
await expect(page.getByRole('cell', { name: 'Mock Product' })).toBeVisible();
`}</Code>
        <p>
          <code>{"{ json }"}</code> sets the body and the <code>Content-Type</code> header. Use{" "}
          <code>{"{ status: 500 }"}</code> to simulate a server error.
        </p>
        <h3>Change a real response</h3>
        <Code>{`
await page.route('**/api/products?*', async (route) => {
  const response = await route.fetch();
  const body = await response.json();

  body.products.push({ id: 100, name: 'Injected Product', price: 1 });

  await route.fulfill({ response, json: body });
});
`}</Code>
        <p>
          The real server answered. The status, the headers and the other products are real. You changed only what the
          test needs.
        </p>
        <h3>Fail only the first time</h3>
        <Code>{`
await page.route(
  '**/api/notifications',
  (route) => route.fulfill({ status: 503 }),
  { times: 1 }
);
`}</Code>
        <p>
          After one use, the route removes itself. Later requests reach the real server. This makes it easy to test retry
          buttons. <code>page.unroute()</code> removes a route by hand.
        </p>
        <h3>Match requests</h3>
        <ul>
          <li>
            A glob pattern matches the whole URL. <code>'**/api/products'</code> does not match{" "}
            <code>/api/products?search=mo</code>.
          </li>
          <li>
            For query strings, use a regular expression such as <code>{"/\\/api\\/products\\?search=/"}</code>. You can
            also read <code>new URL(route.request().url()).searchParams</code> in the handler. Call{" "}
            <code>route.fallback()</code> for the requests that you do not want to handle.
          </li>
          <li>
            <code>page.route()</code> works for one page. <code>context.route()</code> also covers popups and new tabs.
          </li>
        </ul>
        <h3>Record and replay</h3>
        <p>
          <code>{"page.routeFromHAR(path, { update: true })"}</code> records real traffic to a HAR file. Run it again
          without <code>update</code>. Then the HAR file answers each matching request. This gives you a realistic,
          offline backend.
        </p>
        <div className="lesson-callout">
          A mock proves that the UI handles a response correctly. It does not prove that the real API returns that
          response. Use API tests together with mocks (see the API Testing page).
        </div>
      </Lesson>

      <TestCard title="Products API">
        <p>The application requests products from the API. Playwright can intercept this request and return a custom response.</p>
        <button type="button" onClick={loadProducts} disabled={productsLoading}>
          Load Products
        </button>
        {productsLoading && (
          <div className="result" role="status" data-testid="products-loading">
            Loading products...
          </div>
        )}
        {productsError && (
          <div className="result" role="alert" data-testid="products-message">
            {productsError}
          </div>
        )}
        {products.length > 0 && <ProductTable products={products} caption="Products returned by the API" />}
      </TestCard>

      <TestCard title="Product Search">
        <p>
          The page sends the search term as a query string, for example <code>/api/products?search=mo</code>.
        </p>
        <form onSubmit={search}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="product-search">Search products</label>
              <input id="product-search" type="search" value={term} onChange={(e) => setTerm(e.target.value)} />
            </div>
            <button type="submit" disabled={searching}>
              Search
            </button>
          </div>
        </form>
        {searching && (
          <div className="result" role="status">
            Searching...
          </div>
        )}
        {searchError && (
          <div className="result" role="alert">
            Search failed: {searchError}
          </div>
        )}
        {results && results.length === 0 && (
          <div className="result" role="status">
            No products found
          </div>
        )}
        {results && results.length > 0 && <ProductTable products={results} caption="Search results" />}
      </TestCard>

      <TestCard title="Notifications">
        <p>The page shows an error with a retry button when the request fails.</p>
        <button type="button" onClick={loadNotifications} disabled={notifyLoading}>
          Load notifications
        </button>
        {notifyError && (
          <div className="result" role="alert">
            Could not load notifications. {notifyError}
            <div className="settings-actions">
              <button type="button" onClick={loadNotifications} disabled={notifyLoading}>
                Retry
              </button>
            </div>
          </div>
        )}
        {notifications && (
          <ul className="notification-list" aria-label="Notifications">
            {notifications.map((n) => (
              <li key={n.id}>{n.message}</li>
            ))}
          </ul>
        )}
      </TestCard>
    </div>
  );
}
