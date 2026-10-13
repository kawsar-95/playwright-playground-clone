import { Code, Lesson, PageHeader, TestCard } from "../../components";

const users = [
  { firstName: "John", lastName: "Smith", email: "john@example.com", age: 32, role: "Admin" },
  { firstName: "Anna", lastName: "Kowalski", email: "anna@example.com", age: 28, role: "User" },
  { firstName: "Michael", lastName: "Brown", email: "michael@example.com", age: 41, role: "Manager" },
  { firstName: "Sarah", lastName: "Wilson", email: "sarah@example.com", age: 35, role: "User" },
];

export default function BasicTable() {
  return (
    <>
      <PageHeader title="Basic Table">Practice reading and locating table data.</PageHeader>
      <Lesson title="Rows, cells and columns">
        <h3>Find the row first, then the cell</h3>
        <p>
          A table is a grid of <code>row</code> and <code>cell</code> roles. Find the row with a text that only that row has.
          Then search inside that row.
        </p>
        <Code>{`
const michael = page.getByRole('row').filter({ hasText: 'Michael' });

await expect(michael.getByRole('cell').nth(2)).toHaveText('michael@example.com');
`}</Code>
        <h3>The header and the footer are rows too</h3>
        <p>
          <code>getByRole('row')</code> counts the header row and the footer row. To count only the data, search inside the{" "}
          <code>&lt;tbody&gt;</code>.
        </p>
        <Code>{`
await expect(page.getByRole('row')).toHaveCount(6); // header + 4 users + footer
await expect(page.locator('tbody').getByRole('row')).toHaveCount(4);
`}</Code>
        <h3>Find a cell by the name of its column</h3>
        <p>
          Playwright has no locator for "the cell in column X". Read the headers and find the position of the column. Then use
          that position in the row. The test still works if the columns change order.
        </p>
        <Code>{`
const headers = await page.getByRole('columnheader').allTextContents();
const roleColumn = headers.indexOf('Role');

const anna = page.getByRole('row').filter({ hasText: 'Anna' });
await expect(anna.getByRole('cell').nth(roleColumn)).toHaveText('User');
`}</Code>
        <h3>Check a whole column in one step</h3>
        <p>
          <code>toHaveText()</code> accepts an array. It checks each element, in order.
        </p>
        <Code>{`
await expect(page.getByRole('columnheader')).toHaveText([
  'First Name', 'Last Name', 'Email', 'Age', 'Role',
]);
`}</Code>
      </Lesson>
      <TestCard title="Users">
        <table>
          <caption>List of users</caption>
          <thead>
            <tr>
              <th scope="col">First Name</th>
              <th scope="col">Last Name</th>
              <th scope="col">Email</th>
              <th scope="col">Age</th>
              <th scope="col">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email}>
                <td>{u.firstName}</td>
                <td>{u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.age}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} data-testid="table-total">
                Total: {users.length} users
              </td>
            </tr>
          </tfoot>
        </table>
      </TestCard>
    </>
  );
}
