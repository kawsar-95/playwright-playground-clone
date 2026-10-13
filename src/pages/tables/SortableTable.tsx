import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

type Key = "firstName" | "lastName" | "age" | "score" | "role";

const columns: { key: Key; label: string }[] = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "age", label: "Age" },
  { key: "score", label: "Score" },
  { key: "role", label: "Role" },
];

const rows = [
  { id: 1, firstName: "John", lastName: "Smith", age: 32, score: 9, role: "Admin" },
  { id: 2, firstName: "Anna", lastName: "Kowalski", age: 28, score: 100, role: "User" },
  { id: 3, firstName: "Michael", lastName: "Brown", age: 41, score: 42, role: "Manager" },
  { id: 4, firstName: "Sarah", lastName: "Wilson", age: 35, score: 10, role: "User" },
  { id: 5, firstName: "Tom", lastName: "Becker", age: 25, score: 85, role: "User" },
  { id: 6, firstName: "Lena", lastName: "Novak", age: 38, score: 7, role: "Manager" },
  { id: 7, firstName: "Piotr", lastName: "Zając", age: 30, score: 64, role: "User" },
  { id: 8, firstName: "Grace", lastName: "Okafor", age: 27, score: 91, role: "Admin" },
  { id: 9, firstName: "Omar", lastName: "Haddad", age: 36, score: 23, role: "User" },
  { id: 10, firstName: "Yuki", lastName: "Tanaka", age: 33, score: 58, role: "Manager" },
];

export default function SortableTable() {
  const [sortKey, setSortKey] = useState<Key>("firstName");
  const [ascending, setAscending] = useState(true);

  const sortBy = (key: Key) => {
    if (sortKey === key) {
      setAscending((value) => !value);
    } else {
      setSortKey(key);
      setAscending(true);
    }
  };

  const sorted = [...rows].sort((a, b) => {
    const x = a[sortKey];
    const y = b[sortKey];
    if (x < y) return ascending ? -1 : 1;
    if (x > y) return ascending ? 1 : -1;
    return 0;
  });

  return (
    <>
      <PageHeader title="Sortable Table">Practice sorting table data.</PageHeader>
      <Lesson title="Proving a table is sorted">
        <h3>Read the direction from aria-sort</h3>
        <p>
          The header of the sorted column has <code>aria-sort="ascending"</code> or <code>"descending"</code>. The other headers
          have <code>"none"</code>. Screen readers announce this value. It is the most reliable way to check the direction.
        </p>
        <Code>{`
const ageHeader = page.getByRole('columnheader', { name: 'Age' });

await page.getByRole('button', { name: 'Age' }).click();
await expect(ageHeader).toHaveAttribute('aria-sort', 'ascending');
`}</Code>
        <h3>Compare the column with a sorted copy</h3>
        <p>Read the whole column. Sort a copy in your test. Compare the two lists. A check of the first row only proves very little.</p>
        <Code>{`
// Score is the 4th column (index 3).
const scoreCells = page.locator('tbody tr').locator('td:nth-child(4)');

await page.getByRole('button', { name: 'Score' }).click();
await expect(page.getByRole('columnheader', { name: 'Score' }))
  .toHaveAttribute('aria-sort', 'ascending');

const scores = (await scoreCells.allTextContents()).map(Number);
expect(scores).toEqual([...scores].sort((a, b) => a - b));
`}</Code>
        <h3>The number trap</h3>
        <p>
          <code>allTextContents()</code> returns <strong>strings</strong>. A text sort puts <code>"10"</code> before{" "}
          <code>"7"</code>. If you forget <code>.map(Number)</code>, your copy has the wrong order. The correct table then does not
          match your copy, and the test fails. The Score column shows this problem on purpose.
        </p>
        <div className="lesson-callout">
          Read the column only after the <code>aria-sort</code> assertion passes. Then you know that the table has rendered again
          before you read it.
        </div>
      </Lesson>
      <TestCard title="Sortable Users">
        <table>
          <caption>Click a column header to sort the table</caption>
          <thead>
            <tr>
              {columns.map(({ key, label }) => {
                const active = sortKey === key;
                return (
                  <th key={key} scope="col" aria-sort={active ? (ascending ? "ascending" : "descending") : "none"}>
                    <button type="button" onClick={() => sortBy(key)} className="table-sort-button">
                      {label}
                      {active && <span aria-hidden="true">{ascending ? " ↑" : " ↓"}</span>}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id}>
                <td>{r.firstName}</td>
                <td>{r.lastName}</td>
                <td>{r.age}</td>
                <td>{r.score}</td>
                <td>{r.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TestCard>
    </>
  );
}
