import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}
type Field = "firstName" | "lastName" | "email";
type Errors = Partial<Record<Field, string>>;

const initialUsers: User[] = [
  { id: 1, firstName: "John", lastName: "Smith", email: "john@example.com" },
  { id: 2, firstName: "Anna", lastName: "Kowalski", email: "anna@example.com" },
  { id: 3, firstName: "Michael", lastName: "Brown", email: "michael@example.com" },
  { id: 4, firstName: "Sarah", lastName: "Wilson", email: "sarah@example.com" },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyUser: User = { id: 0, firstName: "", lastName: "", email: "" };

function validate(user: User): Errors {
  const errors: Errors = {};
  if (!user.firstName.trim()) errors.firstName = "First name is required.";
  if (!user.lastName.trim()) errors.lastName = "Last name is required.";
  if (!user.email.trim()) errors.email = "Email is required.";
  else if (!emailPattern.test(user.email.trim())) errors.email = "Enter a valid email address.";
  return errors;
}

const newFields: [Field, string, string][] = [
  ["firstName", "First name", "text"],
  ["lastName", "Last name", "text"],
  ["email", "Email", "email"],
];

export default function TableActions() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<User | null>(null);
  const [editErrors, setEditErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState<User>(emptyUser);
  const [newErrors, setNewErrors] = useState<Errors>({});

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setDraft({ ...user });
    setEditErrors({});
    setMessage(`Editing ${user.firstName} ${user.lastName}`);
  };

  const changeDraft = (field: Field, value: string) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
    if (editErrors[field]) setEditErrors({ ...editErrors, [field]: undefined });
  };

  const stopEdit = () => {
    setEditingId(null);
    setDraft(null);
    setEditErrors({});
  };

  const save = (id: number) => {
    if (!draft) return;
    const errors = validate(draft);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    const clean: User = {
      ...draft,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
    };
    setUsers(users.map((u) => (u.id === id ? clean : u)));
    setMessage(`Updated ${clean.firstName} ${clean.lastName} successfully.`);
    stopEdit();
  };

  const cancelEdit = () => {
    stopEdit();
    setMessage("Edit cancelled.");
  };

  const askDelete = (user: User) => {
    setDeletingId(user.id);
    setMessage(`Delete ${user.firstName} ${user.lastName}?`);
  };

  const confirmDelete = (id: number) => {
    const user = users.find((u) => u.id === id);
    setUsers(users.filter((u) => u.id !== id));
    if (editingId === id) stopEdit();
    setDeletingId(null);
    if (user) setMessage(`${user.firstName} ${user.lastName} was deleted.`);
  };

  const keepUser = (user: User) => {
    setDeletingId(null);
    setMessage(`${user.firstName} ${user.lastName} was kept.`);
  };

  const closeForm = () => {
    setAdding(false);
    setNewUser(emptyUser);
    setNewErrors({});
  };

  const create = (event: FormEvent) => {
    event.preventDefault();
    const errors = validate(newUser);
    if (Object.keys(errors).length > 0) {
      setNewErrors(errors);
      return;
    }
    const user: User = {
      id: Math.max(0, ...users.map((u) => u.id)) + 1,
      firstName: newUser.firstName.trim(),
      lastName: newUser.lastName.trim(),
      email: newUser.email.trim(),
    };
    setUsers([...users, user]);
    setMessage(`Added ${user.firstName} ${user.lastName}.`);
    closeForm();
  };

  const onRowKey = (event: KeyboardEvent, id: number) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save(id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  };

  const editInput = (field: Field, label: string, type: string) => (
    <td>
      <input
        type={type}
        value={draft?.[field] ?? ""}
        onChange={(e) => changeDraft(field, e.target.value)}
        aria-label={label}
        aria-invalid={!!editErrors[field]}
      />
      {editErrors[field] && (
        <span className="error-message" role="alert">
          {editErrors[field]}
        </span>
      )}
    </td>
  );

  return (
    <>
      <PageHeader title="Table Actions">Practice interacting with buttons inside table rows.</PageHeader>
      <Lesson title="Acting on one specific row">
        <h3>Scope every action to its row</h3>
        <p>
          Each row has its own Edit and Delete buttons. A page-wide <code>getByRole('button', {"{ name: 'Delete' }"})</code> matches
          four buttons. Find the row first. Then find the button inside the row.
        </p>
        <Code>{`
const anna = page.getByRole('row').filter({ hasText: 'Anna' });

await anna.getByRole('button', { name: 'Delete' }).click();
await anna.getByRole('button', { name: 'Yes, delete' }).click();

await expect(page.getByRole('row').filter({ hasText: 'Anna' })).toHaveCount(0);
`}</Code>
        <h3>Rows change while you use them</h3>
        <p>
          In edit mode, the names become input <em>values</em>. <code>filter({"{ hasText }"})</code> reads text only, so it does not
          find the row any more. Find the row that is in edit mode by the elements it contains.
        </p>
        <Code>{`
const editingRow = page.getByRole('row').filter({
  has: page.getByRole('textbox', { name: 'Email' }),
});

await editingRow.getByRole('textbox', { name: 'Email' }).fill('anna@test.dev');
await editingRow.getByRole('button', { name: 'Save' }).click();
`}</Code>
        <h3>Scope forms too</h3>
        <p>
          The add form also has the fields First name, Last name and Email. If a row is in edit mode at the same time, a page-wide{" "}
          <code>getByLabel()</code> finds both. Scope the locator to the form.
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Add user' }).click();

const form = page.getByRole('form', { name: 'New user' });
await form.getByLabel('First name').fill('Zoe');
`}</Code>
        <h3>Empty tables</h3>
        <p>
          After you delete the last user, the table shows a message row and no data. Test this state too. It is easy to forget and
          easy to break.
        </p>
      </Lesson>
      <TestCard title="User Management">
        <table>
          <caption>User management table</caption>
          <thead>
            <tr>
              <th scope="col">First Name</th>
              <th scope="col">Last Name</th>
              <th scope="col">Email</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  No users left. Add one below.
                </td>
              </tr>
            )}
            {users.map((user) =>
              editingId === user.id && draft ? (
                <tr key={user.id} onKeyDown={(e) => onRowKey(e, user.id)}>
                  {editInput("firstName", "First Name", "text")}
                  {editInput("lastName", "Last Name", "text")}
                  {editInput("email", "Email", "email")}
                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => save(user.id)}>
                        Save
                      </button>
                      <button type="button" className="secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={user.id}>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.email}</td>
                  <td>
                    {deletingId === user.id ? (
                      <div className="table-actions">
                        <button type="button" className="danger" onClick={() => confirmDelete(user.id)}>
                          Yes, delete
                        </button>
                        <button type="button" className="secondary" onClick={() => keepUser(user)}>
                          Keep
                        </button>
                      </div>
                    ) : (
                      <div className="table-actions">
                        <button type="button" className="secondary" onClick={() => startEdit(user)}>
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => askDelete(user)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {adding ? (
          <form className="add-user-form" aria-label="New user" onSubmit={create} noValidate>
            <h3>New user</h3>
            <div className="form-row">
              {newFields.map(([field, label, type]) => (
                <div className="form-group" key={field}>
                  <label htmlFor={`new-user-${field}`}>{label}</label>
                  <input
                    id={`new-user-${field}`}
                    type={type}
                    value={newUser[field]}
                    onChange={(e) => setNewUser({ ...newUser, [field]: e.target.value })}
                    aria-invalid={!!newErrors[field]}
                    aria-describedby={newErrors[field] ? `new-user-${field}-error` : undefined}
                  />
                  {newErrors[field] && (
                    <span id={`new-user-${field}-error`} className="error-message" role="alert">
                      {newErrors[field]}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="button-row">
              <button type="submit">Create</button>
              <button type="button" className="secondary" onClick={closeForm}>
                Discard
              </button>
            </div>
          </form>
        ) : (
          <div className="settings-actions">
            <button type="button" className="secondary" onClick={() => setAdding(true)}>
              Add user
            </button>
          </div>
        )}
        {message && (
          <div className="result" role="status" data-testid="table-action-result">
            {message}
          </div>
        )}
      </TestCard>
    </>
  );
}
