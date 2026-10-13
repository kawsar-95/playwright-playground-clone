import type { PageModule } from "../../pageTypes";
import BasicTable from "./BasicTable";
import SortableTable from "./SortableTable";
import TableActions from "./TableActions";
import DataGrid from "./DataGrid";
import basicSolution from "../../../e2e/tables/basic.spec.ts?raw";
import sortableSolution from "../../../e2e/tables/sortable.spec.ts?raw";
import actionsSolution from "../../../e2e/tables/actions.spec.ts?raw";
import dataGridSolution from "../../../e2e/tables/data-grid.spec.ts?raw";
import "./tables.css";

export const pages: Record<string, PageModule> = {
  "/tables/basic": {
    Component: BasicTable,
    brief: {
      goal: "Read data from a table and find it with locators.",
      steps: [
        "Assert that the table has 4 data rows. Do not count the header row or the footer row.",
        "Find the row of Michael and assert his email.",
        "Assert all column headers, in order, with one assertion.",
        "Write a helper that finds a cell by the name of its column. Use it to assert the role of Anna.",
        'Collect all roles and assert that "User" appears exactly two times.',
      ],
      apis: ["getByRole('row')", "filter({ hasText })", "locator('tbody')", "allTextContents()", "toHaveText([...])"],
      hint: 'getByRole("row") also counts the header row and the footer row. For the helper, find the position of the header with indexOf(). Then use nth() on the cells of the row.',
    },
    solution: basicSolution,
  },
  "/tables/sortable": {
    Component: SortableTable,
    brief: {
      goal: "Prove that a table is sorted correctly in both directions.",
      steps: [
        "Sort by Age. Assert that aria-sort is ascending on the header. Click again and assert descending.",
        "Read the whole Age column and compare it with a sorted copy.",
        "Sort by Score and check the order as numbers. First try without a conversion to numbers. The test fails, but the table is correct.",
        "Assert that the table starts sorted by First Name in alphabetical order. Click First Name and assert that the order is reversed.",
      ],
      apis: ["toHaveAttribute('aria-sort')", "allTextContents()", ".map(Number)", "toEqual", "getByRole('columnheader')"],
      hint: 'allTextContents() returns strings. A text sort puts "10" before "7". Wait until aria-sort changes, then read the column.',
    },
    solution: sortableSolution,
  },
  "/tables/actions": {
    Component: TableActions,
    brief: {
      goal: "Edit, delete and add rows with the controls inside the rows.",
      steps: [
        "Edit the email of Anna to an invalid value and assert the error. Then enter a valid email and save.",
        "Start an edit, press Escape and assert that nothing changed.",
        'Delete Sarah: click Delete, then "Yes, delete". Assert that 3 rows remain.',
        "Click Delete for Michael and choose Keep. Assert that he is still in the table.",
        "Delete every user and assert the message for the empty table.",
        "Add a new user with the form. Assert the new row. Also assert the validation errors for an empty form.",
      ],
      apis: ["filter({ hasText })", "filter({ has })", "getByRole in a row", "getByRole('form', { name })", "press('Escape')"],
      hint: "In edit mode the names are input values, so filter({ hasText }) does not find the row. Find the row by the textbox in it. If the add form is open during an edit, scope getByLabel() to the form.",
    },
    solution: actionsSolution,
  },
  "/tables/data-grid": {
    Component: DataGrid,
    brief: {
      goal: "Work with a table that loads from a server: search, page and select rows.",
      steps: [
        "Go to page 2 and assert the page indicator and that 5 rows show.",
        'Search for "Quinn" and assert that there is exactly one result.',
        "Search for a name that does not exist and assert the empty message.",
        'Find "Owen Virtanen" by paging until he appears. Do not skip a page.',
        "Select two employees on page 1, go to page 2, select all on that page and assert 7 selected.",
        "Assert that Previous is disabled on page 1 and that Next is disabled on the last page.",
      ],
      apis: ["toHaveText", "isVisible()", "loops", "getByRole('checkbox', { name })", "toBeDisabled", "page.waitForResponse()"],
      hint: "After a click, the old rows stay on the screen until the new page arrives. Wait for the page indicator to change before you read rows or click Next again.",
    },
    solution: dataGridSolution,
  },
};
