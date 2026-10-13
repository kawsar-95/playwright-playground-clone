import { useState } from "react";
import { PageHeader } from "../../components";

const products = [
  { name: "Wireless Mouse", price: 149 },
  { name: "Mechanical Keyboard", price: 299 },
  { name: "USB-C Hub", price: 199 },
  { name: "Wireless Keyboard", price: 249 },
];

interface Task {
  title: string;
  status: "Done" | "Overdue" | "Pending";
}

const initialTasks: Task[] = [
  { title: "Write test plan", status: "Done" },
  { title: "Fix flaky login test", status: "Overdue" },
  { title: "Review pull request", status: "Pending" },
  { title: "Update CI pipeline", status: "Overdue" },
  { title: "Triage bug reports", status: "Pending" },
];

// A small inline SVG, so the logo needs no extra file.
const logo =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" rx="8" fill="#2f5fd0"/><text x="18" y="24" font-size="16" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#fff">QA</text></svg>',
  );

export default function Challenges() {
  const [cart, setCart] = useState<string[]>([]);
  const [saved, setSaved] = useState("");
  const [deleted, setDeleted] = useState("");
  const [tasks, setTasks] = useState(initialTasks);
  const [archived, setArchived] = useState<string[]>([]);
  const [toolbarAction, setToolbarAction] = useState("");
  const [search, setSearch] = useState("");

  const archive = (title: string) => {
    setTasks((list) => list.filter((task) => task.title !== title));
    setArchived((list) => [...list, title]);
  };

  return (
    <>
      <PageHeader title="Locator Challenges">
        Similar-looking elements, repeated names and no test ids. Pick the one element you mean.
      </PageHeader>

      <section className="test-card" aria-labelledby="products-heading">
        <h2 id="products-heading">1. Product cards</h2>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.name}>
              <h3>{product.name}</h3>
              <p>{product.price} PLN</p>
              <button type="button" onClick={() => setCart((items) => [...items, product.name])}>
                Add to cart
              </button>
            </article>
          ))}
        </div>
        <div className="result" role="status">
          Cart ({cart.length}): {cart.length ? cart.join(", ") : "empty"}
        </div>
      </section>

      <section className="test-card" aria-labelledby="settings-heading">
        <h2 id="settings-heading">2. Same button, different sections</h2>
        <div className="settings-grid">
          <section className="settings-panel" aria-labelledby="profile-settings-heading">
            <h3 id="profile-settings-heading">Profile settings</h3>
            <div className="checkbox-group">
              <label>
                <input type="checkbox" defaultChecked />
                Public profile
              </label>
            </div>
            <div className="settings-actions">
              <button type="button" onClick={() => setSaved("Profile settings saved")}>
                Save
              </button>
            </div>
          </section>
          <section className="settings-panel" aria-labelledby="notification-settings-heading">
            <h3 id="notification-settings-heading">Notification settings</h3>
            <div className="checkbox-group">
              <label>
                <input type="checkbox" />
                Email notifications
              </label>
            </div>
            <div className="settings-actions">
              <button type="button" onClick={() => setSaved("Notification settings saved")}>
                Save
              </button>
            </div>
          </section>
        </div>
        {saved && (
          <div className="result" role="status">
            {saved}
          </div>
        )}
      </section>

      <section className="test-card" aria-labelledby="exact-heading">
        <h2 id="exact-heading">3. Exact names</h2>
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => setDeleted("Last delete undone")}>
            Undo delete
          </button>
          <button type="button" className="danger" onClick={() => setDeleted("Deleted all items")}>
            Delete all
          </button>
          <button type="button" className="danger" onClick={() => setDeleted("Deleted the selected item")}>
            Delete
          </button>
        </div>
        {deleted && (
          <div className="result" role="status">
            {deleted}
          </div>
        )}
      </section>

      <section className="test-card" aria-labelledby="tasks-heading">
        <h2 id="tasks-heading">4. Filter by state</h2>
        <ul className="task-list" aria-label="Team tasks">
          {tasks.map((task) => (
            <li key={task.title}>
              <span>{task.title}</span>
              <span className={`status-badge ${task.status.toLowerCase()}`}>{task.status}</span>
              <button type="button" className="secondary" onClick={() => archive(task.title)}>
                Archive
              </button>
            </li>
          ))}
        </ul>
        <div className="result" role="status">
          Archived: {archived.length ? archived.join(", ") : "nothing yet"}
        </div>
      </section>

      <section className="test-card" aria-labelledby="no-text-heading">
        <h2 id="no-text-heading">5. Elements without text</h2>
        <div className="toolbar">
          <img src={logo} alt="QA Playground logo" />
          <input type="search" placeholder="Search the docs" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="button" className="icon-button" title="Open settings" onClick={() => setToolbarAction("Settings opened")}>
            ⚙
          </button>
          <button type="button" className="icon-button" title="Show help" onClick={() => setToolbarAction("Help opened")}>
            ?
          </button>
        </div>
        <div className="result" role="status">
          {toolbarAction || "No toolbar action yet"}
          {search && ` · Searching for: ${search}`}
        </div>
      </section>
    </>
  );
}
