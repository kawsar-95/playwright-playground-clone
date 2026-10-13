import { useEffect, useRef, useState, type FormEvent } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import Modal, { type CloseReason } from "./Modal";
import { useTimers } from "./useTimers";

const SEND_DELAY = 1500;
const SHOP_LOAD_DELAY = 1000;
const products = ["Mechanical keyboard", "USB-C hub", "Desk lamp"];

export default function ModalsOverlays() {
  const { later } = useTimers();
  const nativeDialog = useRef<HTMLDialogElement>(null);

  // Native dialog
  const [projectName, setProjectName] = useState("Apollo");
  const [projectDraft, setProjectDraft] = useState("Apollo");
  const [renameResult, setRenameResult] = useState<string | null>(null);

  // Custom modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  // Modal over a modal
  const [postTitle, setPostTitle] = useState("Hello world");
  const [postDraft, setPostDraft] = useState("");
  const [postOpen, setPostOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);

  // Shop with a random popup
  const [shopReady, setShopReady] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [cart, setCart] = useState<string[]>([]);

  useEffect(() => {
    later(() => setShopReady(true), SHOP_LOAD_DELAY);
    // The newsletter popup shows at a random time between 0.8 s and 2 s.
    later(() => setNewsletterOpen(true), 800 + Math.random() * 1200);
  }, [later]);

  const openRename = () => {
    setProjectDraft(projectName);
    nativeDialog.current?.showModal();
  };

  const saveRename = (event: FormEvent) => {
    event.preventDefault();
    const name = projectDraft.trim();
    if (!name) return;
    setProjectName(name);
    setRenameResult(`Project renamed to ${name}`);
    nativeDialog.current?.close();
  };

  const closeInvite = (reason: CloseReason | "Cancel") => {
    if (sending) return;
    setInviteOpen(false);
    setInviteResult(`Invite cancelled (${reason})`);
  };

  const sendInvite = (event: FormEvent) => {
    event.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteError("Enter an email address");
      return;
    }
    setInviteError(null);
    setSending(true);
    later(() => {
      setSending(false);
      setInviteOpen(false);
      setInviteResult(`Invite sent to ${inviteEmail.trim()} as ${inviteRole}`);
    }, SEND_DELAY);
  };

  const openPost = () => {
    setPostDraft(postTitle);
    setPostOpen(true);
  };

  const closePost = () => {
    if (postDraft === postTitle) {
      setPostOpen(false);
      setPostResult("Closed without changes");
    } else {
      setDiscardOpen(true);
    }
  };

  return (
    <>
      <PageHeader title="Modals & Overlays">
        Dialogs built into the page: a native <code>&lt;dialog&gt;</code>, a custom modal, one modal on top of another, and a
        popup that appears when it likes.
      </PageHeader>
      <Lesson title="Testing modals">
        <h3>Find the dialog, then look inside it</h3>
        <p>
          A modal is a <code>dialog</code> with a name. Scope each locator to the dialog. Buttons such as "Close" or "Cancel" often
          exist in other places on the page too.
        </p>
        <Code>{`
const invite = page.getByRole('dialog', { name: 'Invite teammate' });
await invite.getByLabel('Email').fill('ada@example.com');
await invite.getByRole('button', { name: 'Send invite' }).click();
await expect(invite).toBeHidden();
`}</Code>
        <h3>The page behind a modal</h3>
        <p>
          A native <code>&lt;dialog&gt;</code> that opens with <code>showModal()</code> makes the rest of the page inert. Playwright
          waits until an inert button can be clicked, so the click times out. This shows that the modal works. A custom modal only
          covers the page with a backdrop. For a custom modal, the error says that another element "intercepts pointer events".
        </p>
        <Code>{`
// A short trial click proves that the page behind is blocked.
await expect(
  page.getByRole('button', { name: 'Rename project' }).click({ trial: true, timeout: 1000 })
).rejects.toThrow();
`}</Code>
        <h3>Focus</h3>
        <p>
          A good modal moves focus inside when it opens. It keeps Tab inside while it is open. It gives focus back to the button
          that opened it. Check all three with <code>toBeFocused()</code>.
        </p>
        <h3>A modal on top of a modal</h3>
        <p>Both dialogs are in the page at the same time. Give each dialog its own locator by name. Assert which dialogs are still open.</p>
        <h3>Popups that appear when they like</h3>
        <p>
          Newsletter popups and cookie popups appear at random times and block clicks. A <code>try</code>/<code>catch</code> around
          each click cannot cover all of them. Register one handler. Before each action, Playwright checks if the overlay is
          visible. If it is, Playwright runs your handler first.
        </p>
        <Code>{`
await page.addLocatorHandler(
  page.getByRole('dialog', { name: 'Join our newsletter' }),
  async (overlay) => {
    await overlay.getByRole('button', { name: 'No thanks' }).click();
  }
);
`}</Code>
      </Lesson>
      <TestCard title="Native dialog">
        <p>
          Project: <strong data-testid="project-name">{projectName}</strong>
        </p>
        <button type="button" onClick={openRename}>
          Rename project
        </button>
        {renameResult && (
          <p className="result" role="status">
            {renameResult}
          </p>
        )}
        <dialog
          ref={nativeDialog}
          className="modal native-modal"
          aria-labelledby="rename-title"
          onCancel={() => setRenameResult("Rename cancelled")}
        >
          <form onSubmit={saveRename}>
            <h2 id="rename-title">Rename project</h2>
            <div className="form-group">
              <label htmlFor="project-name-input">Project name</label>
              <input
                id="project-name-input"
                type="text"
                value={projectDraft}
                onChange={(e) => setProjectDraft(e.target.value)}
                required
              />
            </div>
            <div className="button-row">
              <button type="submit">Save</button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  nativeDialog.current?.close();
                  setRenameResult("Rename cancelled");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </dialog>
      </TestCard>
      <TestCard title="Custom modal">
        <p>Sending an invite takes a moment.</p>
        <button
          type="button"
          onClick={() => {
            setInviteEmail("");
            setInviteRole("Viewer");
            setInviteError(null);
            setInviteOpen(true);
          }}
        >
          Invite teammate
        </button>
        {inviteResult && (
          <p className="result" role="status">
            {inviteResult}
          </p>
        )}
        {inviteOpen && (
          <Modal title="Invite teammate" onClose={closeInvite}>
            <form onSubmit={sendInvite} noValidate>
              <div className="form-group">
                <label htmlFor="invite-email">Email</label>
                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={sending}
                  aria-invalid={inviteError ? true : undefined}
                  aria-describedby={inviteError ? "invite-error" : undefined}
                />
                {inviteError && (
                  <span id="invite-error" className="error-message" role="alert">
                    {inviteError}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="invite-role">Role</label>
                <select id="invite-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} disabled={sending}>
                  <option>Viewer</option>
                  <option>Editor</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="button-row">
                <button type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Send invite"}
                </button>
                <button type="button" className="secondary" disabled={sending} onClick={() => closeInvite("Cancel")}>
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}
      </TestCard>
      <TestCard title="Modal over a modal">
        <p>
          Post: <strong data-testid="post-title">{postTitle}</strong>
        </p>
        <button type="button" onClick={openPost}>
          Edit post
        </button>
        {postResult && (
          <p className="result" role="status">
            {postResult}
          </p>
        )}
        {postOpen && (
          <Modal title="Edit post" onClose={closePost}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPostTitle(postDraft);
                setPostOpen(false);
                setPostResult(`Post saved: ${postDraft}`);
              }}
            >
              <div className="form-group">
                <label htmlFor="post-title-input">Title</label>
                <input id="post-title-input" type="text" value={postDraft} onChange={(e) => setPostDraft(e.target.value)} />
              </div>
              <div className="button-row">
                <button type="submit">Save</button>
                <button type="button" className="secondary" onClick={closePost}>
                  Cancel
                </button>
              </div>
            </form>
            {discardOpen && (
              <Modal title="Discard changes?" onClose={() => setDiscardOpen(false)}>
                <p>Your edits to this post will be lost.</p>
                <div className="button-row">
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setDiscardOpen(false);
                      setPostOpen(false);
                      setPostResult("Changes discarded");
                    }}
                  >
                    Discard
                  </button>
                  <button type="button" className="secondary" onClick={() => setDiscardOpen(false)}>
                    Keep editing
                  </button>
                </div>
              </Modal>
            )}
          </Modal>
        )}
      </TestCard>
      <TestCard title="Shop">
        <p>
          Cart:{" "}
          <strong data-testid="cart-count">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </strong>
        </p>
        {shopReady ? (
          <ul className="shop-list" aria-label="Products">
            {products.map((name) => (
              <li className="file-row" key={name}>
                <span>{name}</span>
                <button type="button" onClick={() => setCart((items) => [...items, name])}>
                  Add to cart
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="result">Loading products…</p>
        )}
        {newsletterOpen && (
          <div className="modal-backdrop">
            <div className="modal newsletter" role="dialog" aria-modal="true" aria-labelledby="newsletter-title">
              <h2 id="newsletter-title">Join our newsletter</h2>
              <p>Deals and new arrivals, once a week. No spam.</p>
              <div className="button-row">
                <button type="button" onClick={() => setNewsletterOpen(false)}>
                  Subscribe
                </button>
                <button type="button" className="secondary" onClick={() => setNewsletterOpen(false)}>
                  No thanks
                </button>
              </div>
            </div>
          </div>
        )}
      </TestCard>
    </>
  );
}
