import { useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const INITIAL_TASKS = ["Write tests", "Review PR", "Fix flaky test", "Update docs", "Deploy"];
const DRAG_THRESHOLD_PX = 5;
const COLUMNS = ["To do", "In progress", "Done"];
const INITIAL_CARDS = [
  { title: "Design login page", column: "To do" },
  { title: "Write release notes", column: "To do" },
  { title: "Set up CI", column: "In progress" },
  { title: "Plan sprint", column: "Done" },
];

function columnId(column: string): string {
  return `column-${column.toLowerCase().replace(/\s+/g, "-")}`;
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function DragAndDrop() {
  // Built-in drag and drop
  const [dropped, setDropped] = useState(false);

  // Sortable list
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const tasksRef = useRef(INITIAL_TASKS);
  const listRef = useRef<HTMLOListElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  // Kanban board
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [moved, setMoved] = useState<string | null>(null);

  const updateTasks = (next: string[]) => {
    tasksRef.current = next;
    setTasks(next);
  };

  /** Index of the list item at the given vertical position, or null if the pointer is in a gap. */
  const indexAt = (y: number): number | null => {
    const boxes = [...(listRef.current?.children ?? [])].map((child) => child.getBoundingClientRect());
    if (boxes.length === 0) return null;
    if (y < boxes[0].top) return 0;
    if (y > boxes[boxes.length - 1].bottom) return boxes.length - 1;
    const index = boxes.findIndex((box) => y >= box.top && y <= box.bottom);
    return index === -1 ? null : index;
  };

  const startPointerDrag = (event: PointerEvent<HTMLLIElement>, task: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const startY = event.clientY;
    const startIndex = tasksRef.current.indexOf(task);
    let started = false;

    const onMove = (move: globalThis.PointerEvent) => {
      if (!started) {
        if (Math.abs(move.clientY - startY) >= DRAG_THRESHOLD_PX) {
          started = true;
          setDragging(task);
        }
        return;
      }
      const target = indexAt(move.clientY);
      if (target === null) return;
      const current = tasksRef.current.indexOf(task);
      if (target !== current) updateTasks(moveItem(tasksRef.current, current, target));
    };
    const onEnd = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      if (started) {
        const end = tasksRef.current.indexOf(task);
        if (end !== startIndex) setStatus(`Moved ${task} to position ${end + 1}`);
      }
      setDragging(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (picked === null) {
        setPicked(index);
        setStatus(`Picked up ${tasks[index]}. Position ${index + 1} of ${tasks.length}.`);
      } else {
        setStatus(`Dropped ${tasks[picked]} at position ${picked + 1}`);
        setPicked(null);
      }
    } else if (picked !== null && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      const next = event.key === "ArrowDown" ? Math.min(picked + 1, tasks.length - 1) : Math.max(picked - 1, 0);
      if (next !== picked) {
        updateTasks(moveItem(tasksRef.current, picked, next));
        setPicked(next);
        setStatus(`${tasks[picked]} moved to position ${next + 1} of ${tasks.length}.`);
        requestAnimationFrame(() => {
          listRef.current?.children[next]?.querySelector("button")?.focus();
        });
      }
    } else if (picked !== null && event.key === "Escape") {
      event.preventDefault();
      setStatus(`Stopped moving ${tasks[picked]}`);
      setPicked(null);
    }
  };

  const dropOnColumn = (event: DragEvent<HTMLElement>, column: string) => {
    event.preventDefault();
    const title = event.dataTransfer.getData("text/plain");
    const card = cards.find((item) => item.title === title);
    if (card && card.column !== column) {
      setCards((current) => [...current.filter((item) => item.title !== title), { title, column }]);
      setMoved(`Moved ${title} to ${column}`);
    }
  };

  return (
    <>
      <PageHeader title="Drag & Drop">
        The browser's built-in drag and drop, a sortable list like the ones drag libraries build, and a Kanban
        board.
      </PageHeader>

      <Lesson title="Dragging that actually works">
        <h3>Built-in drag and drop: dragTo()</h3>
        <p>
          Elements with the <code>draggable</code> attribute use the drag events of the browser.{" "}
          <code>dragTo()</code> handles them.
        </p>
        <Code>{`
await page.getByTestId('drag-source').dragTo(page.getByTestId('drop-target'));
`}</Code>

        <h3>Drag libraries need real movement</h3>
        <p>
          Libraries such as dnd-kit and SortableJS listen to pointer moves. Most of them start a drag only
          after the pointer moves a few pixels. Then they track the pointer on later moves.{" "}
          <code>dragTo()</code> jumps from the source to the target in one move. The library starts the drag
          and never sees where it goes. Drive the mouse yourself, in steps.
        </p>
        <Code>{`
const list = page.getByRole('list', { name: 'Priorities' });
const handle = list.getByRole('button', { name: 'Reorder Deploy' });
const target = list.getByRole('listitem').first();

await handle.hover();
await page.mouse.down();
const box = (await target.boundingBox())!;
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
await page.mouse.up();

await expect(list.getByRole('listitem')).toHaveText(['Deploy', 'Write tests', /* … */]);
`}</Code>

        <h3>Or use the keyboard</h3>
        <p>
          Accessible drag libraries also work with the keyboard. Space picks up an item, the arrow keys move
          it, and Space drops it. This tests the same feature and needs no coordinates.
        </p>
        <Code>{`
const handle = list.getByRole('button', { name: 'Reorder Deploy' });

await handle.press('Space');
await handle.press('ArrowUp');
await page.keyboard.press('Space');
`}</Code>
        <div className="lesson-callout">
          Check the result, not the movement: the order of the items, the column of a card, a status message.
          The user cares about these.
        </div>
      </Lesson>

      <TestCard title="Built-in drag and drop">
        <div className="drag-drop-container">
          <div
            className="drag-source"
            draggable
            onDragStart={(event) => event.dataTransfer.setData("text/plain", "drag-item")}
            data-testid="drag-source"
          >
            Drag me
          </div>
          <div
            className={dropped ? "drop-target dropped" : "drop-target"}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (event.dataTransfer.getData("text/plain") === "drag-item") setDropped(true);
            }}
            data-testid="drop-target"
          >
            {dropped ? "Element dropped!" : "Drop here"}
          </div>
        </div>
        <p className="result" role="status" data-testid="drag-drop-result">
          {dropped ? "Drag and drop completed" : "Drag and drop not completed"}
        </p>
      </TestCard>

      <TestCard title="Sortable list">
        <p>Drag a row to reorder it. Or Tab to its handle and press Space, the arrow keys, then Space again.</p>
        <ol ref={listRef} className="sortable-list" aria-label="Priorities">
          {tasks.map((task, index) => (
            <li
              key={task}
              data-task={task}
              className={dragging === task || picked === index ? "sortable-item is-dragging" : "sortable-item"}
              onPointerDown={(event) => startPointerDrag(event, task)}
            >
              <button
                type="button"
                className="sortable-handle"
                aria-label={`Reorder ${task}`}
                aria-pressed={picked === index}
                onKeyDown={(event) => onHandleKey(event, index)}
              />
              {task}
            </li>
          ))}
        </ol>
        <p className="result" role="status" data-testid="sortable-status">
          {status || "Nothing moved yet"}
        </p>
      </TestCard>

      <TestCard title="Kanban board">
        <div className="kanban">
          {COLUMNS.map((column) => {
            const inColumn = cards.filter((card) => card.column === column);
            return (
              <section
                key={column}
                className="kanban-column"
                aria-labelledby={columnId(column)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => dropOnColumn(event, column)}
              >
                <h3 id={columnId(column)}>
                  {column} <span className="kanban-count">({inColumn.length})</span>
                </h3>
                <ul>
                  {inColumn.map((card) => (
                    <li
                      key={card.title}
                      className="kanban-card"
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", card.title)}
                    >
                      {card.title}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        {moved && (
          <p className="result success" role="status">
            {moved}
          </p>
        )}
      </TestCard>
    </>
  );
}
