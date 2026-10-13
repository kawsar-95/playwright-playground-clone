import { useEffect, useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
  city: string;
}
interface EmployeePage {
  employees: Employee[];
  total: number;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 5;
const SEARCH_DELAY = 300;

export default function DataGrid() {
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [data, setData] = useState<EmployeePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Map<number, Employee>>(new Map());
  const timer = useRef<number | null>(null);

  const onSearch = (value: string) => {
    setSearchText(value);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setLoading(true);
      setQuery(value.trim());
      setPageNumber(1);
    }, SEARCH_DELAY);
  };

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    let current = true;
    const params = new URLSearchParams({ page: String(pageNumber), pageSize: String(PAGE_SIZE), search: query });
    fetch(`/api/employees?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        return response.json() as Promise<EmployeePage>;
      })
      .then((result) => {
        if (current) {
          setData(result);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (current) setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [pageNumber, query]);

  const goTo = (target: number) => {
    setLoading(true);
    setPageNumber(target);
  };

  const rows = data?.employees ?? [];
  const allSelected = rows.length > 0 && rows.every((e) => selected.has(e.id));

  const toggleOne = (employee: Employee, checked: boolean) => {
    const next = new Map(selected);
    if (checked) next.set(employee.id, employee);
    else next.delete(employee.id);
    setSelected(next);
  };

  const toggleAll = (checked: boolean) => {
    const next = new Map(selected);
    for (const employee of rows) {
      if (checked) next.set(employee.id, employee);
      else next.delete(employee.id);
    }
    setSelected(next);
  };

  return (
    <>
      <PageHeader title="Data Grid">30 employees loaded from the API, 5 per page, with search and row selection.</PageHeader>
      <Lesson title="Search, paginate and select">
        <h3>The table reloads: wait for the new state</h3>
        <p>
          Each search and each page change sends a request. Until the response arrives, the old rows stay on the screen. A locator
          cannot tell old rows from new rows. First assert a value that changes, for example the page indicator. Then read the
          rows.
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Next page' }).click();
await expect(page.getByTestId('page-indicator')).toHaveText('Page 2 of 6');
await expect(page.locator('tbody').getByRole('row')).toHaveCount(5);
`}</Code>
        <h3>Use search instead of paging</h3>
        <p>To find one person, search for the person. Search is faster and does not depend on the order of the pages.</p>
        <Code>{`
await page.getByLabel('Search employees').fill('Quinn');
await expect(page.getByTestId('result-count')).toHaveText('1 employee found');
await expect(page.getByRole('row').filter({ hasText: 'Quinn Harris' })).toBeVisible();
`}</Code>
        <h3>If you must page: loop until you find the row</h3>
        <p>
          Check the current page. If the row is not there, go to the next page. <strong>Wait for the page to load</strong> before
          you check again.
        </p>
        <Code>{`
const target = page.getByRole('row').filter({ hasText: 'Owen Virtanen' });
const indicator = page.getByTestId('page-indicator');

for (let pageNumber = 1; !(await target.isVisible()); pageNumber++) {
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(indicator).toHaveText(\`Page \${pageNumber + 1} of 6\`);
}
`}</Code>
        <p>Without the indicator check, the loop can click Next before the page loads. Then it skips the row.</p>
        <h3>Checkboxes in rows</h3>
        <Code>{`
await page.getByRole('checkbox', { name: 'Select Liam Nowak' }).check();
await page.getByRole('checkbox', { name: 'Select all on this page' }).check();
await expect(page.getByTestId('selected-count')).toHaveText('5 selected');
`}</Code>
      </Lesson>
      <TestCard className="test-card data-grid">
        <div className="data-grid-toolbar">
          <div className="form-group">
            <label htmlFor="employee-search">Search employees</label>
            <input
              id="employee-search"
              type="search"
              placeholder="Name, department or city"
              value={searchText}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <div className="button-row">
            <span className="request-line" data-testid="selected-count">
              {selected.size} selected
            </span>
            <button type="button" className="secondary" onClick={() => setSelected(new Map())} disabled={selected.size === 0}>
              Clear selection
            </button>
          </div>
        </div>
        {error && (
          <div className="result" role="alert">
            Could not load employees. {error}
          </div>
        )}
        <table aria-busy={loading}>
          <caption>
            Employees
            {data && (
              <>
                {" · "}
                <span className="request-line" data-testid="result-count">
                  {data.total} {data.total === 1 ? "employee" : "employees"} found
                </span>
              </>
            )}
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allSelected}
                  disabled={rows.length === 0}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th scope="col">Name</th>
              <th scope="col">Department</th>
              <th scope="col">City</th>
            </tr>
          </thead>
          <tbody>
            {data && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  No employees match "{query}".
                </td>
              </tr>
            )}
            {rows.map((employee) => {
              const name = `${employee.firstName} ${employee.lastName}`;
              return (
                <tr key={employee.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${name}`}
                      checked={selected.has(employee.id)}
                      onChange={(e) => toggleOne(employee, e.target.checked)}
                    />
                  </td>
                  <td>{name}</td>
                  <td>{employee.department}</td>
                  <td>{employee.city}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pagination">
          <span data-testid="page-indicator">{data ? `Page ${data.page} of ${data.totalPages}` : "Loading..."}</span>
          <div className="button-row">
            <button
              type="button"
              className="secondary"
              aria-label="Previous page"
              onClick={() => goTo(pageNumber - 1)}
              disabled={loading || pageNumber <= 1}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="secondary"
              aria-label="Next page"
              onClick={() => goTo(pageNumber + 1)}
              disabled={loading || !data || pageNumber >= data.totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      </TestCard>
    </>
  );
}
