import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const FILES = ["budget.xlsx", "contract.pdf", "logo.png", "notes.txt", "report.docx", "photo.jpg"];
const ROWS = ["A", "B", "C", "D", "E"];
const SEATS_PER_ROW = 8;
const SEAT_SIZE = 40;
const SEAT_PITCH = 50;
const MARGIN = 20;
const MAP_WIDTH = 430;
const MAP_HEIGHT = 40 + ROWS.length * SEAT_SIZE + (ROWS.length - 1) * 10;
const TAKEN = new Set(["A1", "A2", "C4", "C5", "E8"]);
const MIN_SIGNATURE_LENGTH = 150;

type Point = { x: number; y: number };
type SignatureState = "empty" | "short" | "accepted";

/** Name of the seat under a canvas point, or null if the point is not on a seat. */
function seatAt(x: number, y: number): string | null {
  const col = Math.floor((x - MARGIN) / SEAT_PITCH);
  const row = Math.floor((y - MARGIN) / SEAT_PITCH);
  const insideX = (x - MARGIN) % SEAT_PITCH < SEAT_SIZE;
  const insideY = (y - MARGIN) % SEAT_PITCH < SEAT_SIZE;
  if (col < 0 || row < 0 || col >= SEATS_PER_ROW || row >= ROWS.length || !insideX || !insideY) return null;
  return `${ROWS[row]}${col + 1}`;
}

/** Convert page coordinates to canvas pixels, so CSS scaling does not matter. */
function toCanvas(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) * canvas.width) / rect.width,
    y: ((clientY - rect.top) * canvas.height) / rect.height,
  };
}

export default function MouseActions() {
  // Select files
  const [selected, setSelected] = useState<string[]>([]);
  const anchor = useRef<number | null>(null);

  // Seat map
  const seatCanvas = useRef<HTMLCanvasElement>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [seatError, setSeatError] = useState<string | null>(null);

  // Signature pad
  const padCanvas = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef<Point | null>(null);
  const drawn = useRef(0);
  const [signature, setSignature] = useState<SignatureState>("empty");

  // Zoom
  const zoomBox = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);

  // Slider
  const track = useRef<HTMLDivElement>(null);
  const sliding = useRef(false);
  const [volume, setVolume] = useState(30);

  const selectFile = (event: MouseEvent, index: number) => {
    const file = FILES[index];
    if (event.shiftKey && anchor.current !== null) {
      const [from, to] = [anchor.current, index].sort((a, b) => a - b);
      setSelected(FILES.slice(from, to + 1));
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      setSelected((current) => (current.includes(file) ? current.filter((item) => item !== file) : [...current, file]));
      anchor.current = index;
      return;
    }
    setSelected([file]);
    anchor.current = index;
  };
  const selectedInOrder = FILES.filter((file) => selected.includes(file));

  useEffect(() => {
    const context = seatCanvas.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    context.font = "bold 13px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    ROWS.forEach((row, rowIndex) => {
      for (let number = 1; number <= SEATS_PER_ROW; number++) {
        const seat = `${row}${number}`;
        const x = MARGIN + (number - 1) * SEAT_PITCH;
        const y = MARGIN + rowIndex * SEAT_PITCH;
        context.fillStyle = TAKEN.has(seat) ? "#c8c8c8" : seats.includes(seat) ? "#2f5fd0" : "#eaf0fc";
        context.beginPath();
        context.roundRect(x, y, SEAT_SIZE, SEAT_SIZE, 6);
        context.fill();
        context.fillStyle = seats.includes(seat) ? "#fff" : "#333";
        context.fillText(seat, x + SEAT_SIZE / 2, y + SEAT_SIZE / 2);
      }
    });
  }, [seats]);

  const clickSeat = (event: MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toCanvas(event.currentTarget, event.clientX, event.clientY);
    const seat = seatAt(x, y);
    if (!seat) {
      setSeatError("That is not a seat");
    } else if (TAKEN.has(seat)) {
      setSeatError(`Seat ${seat} is taken`);
    } else {
      setSeatError(null);
      setSeats((current) => (current.includes(seat) ? current.filter((item) => item !== seat) : [...current, seat]));
    }
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPoint.current = toCanvas(event.currentTarget, event.clientX, event.clientY);
  };
  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    const from = lastPoint.current;
    const context = event.currentTarget.getContext("2d");
    if (!from || !context) return;
    const to = toCanvas(event.currentTarget, event.clientX, event.clientY);
    context.strokeStyle = "#111";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    lastPoint.current = to;
    drawn.current += Math.hypot(to.x - from.x, to.y - from.y);
  };
  const stopDrawing = () => {
    if (!lastPoint.current) return;
    lastPoint.current = null;
    setSignature(drawn.current >= MIN_SIGNATURE_LENGTH ? "accepted" : "short");
  };
  const clearSignature = () => {
    const canvas = padCanvas.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    drawn.current = 0;
    setSignature("empty");
  };

  useEffect(() => {
    const box = zoomBox.current;
    if (!box) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((value) => Math.min(200, Math.max(50, value + (event.deltaY < 0 ? 10 : -10))));
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, []);

  const moveSlider = (clientX: number) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setVolume(Math.round(ratio * 10) * 10);
  };

  return (
    <>
      <PageHeader title="Mouse Actions">
        Modifier clicks, clicking at a position, drawing, scrolling the wheel and dragging a slider: the
        low-level mouse API.
      </PageHeader>

      <Lesson title="The low-level mouse">
        <h3>Clicks with modifier keys</h3>
        <p>
          <code>click({"{ modifiers }"})</code> holds keys during the click. <code>ControlOrMeta</code> is Ctrl
          on Windows and Linux, and Cmd on macOS. One test then runs on all systems.
        </p>
        <Code>{`
const files = page.getByRole('listbox', { name: 'Files' });

await files.getByRole('option', { name: 'contract.pdf' }).click();
await files.getByRole('option', { name: 'notes.txt' }).click({ modifiers: ['Shift'] });
await files.getByRole('option', { name: 'photo.jpg' }).click({ modifiers: ['ControlOrMeta'] });
`}</Code>

        <h3>Clicking a point inside an element</h3>
        <p>
          A canvas has no inner elements to locate. Click a position relative to its top-left corner.
        </p>
        <Code>{`
const map = page.getByRole('img', { name: 'Seat map' });

await map.click({ position: { x: 140, y: 90 } }); // seat B3
`}</Code>

        <h3>Drawing: down, move, up</h3>
        <p>
          <code>page.mouse</code> uses page coordinates. Get the box of the element first. Move in several{" "}
          <code>steps</code>, so that the app sees a line and not a jump. <code>boundingBox()</code> is
          relative to the visible window. Scroll the element into view before you use it.
        </p>
        <Code>{`
const pad = page.getByRole('img', { name: 'Signature pad' });
await pad.scrollIntoViewIfNeeded();   // the mouse only reaches what is on screen
const box = (await pad.boundingBox())!;

await page.mouse.move(box.x + 20, box.y + 60);
await page.mouse.down();
await page.mouse.move(box.x + 250, box.y + 80, { steps: 10 });
await page.mouse.up();
`}</Code>

        <h3>The wheel scrolls what is under the mouse</h3>
        <Code>{`
await page.getByTestId('zoom-box').hover();
await page.mouse.wheel(0, -100);   // negative deltaY = scroll up
`}</Code>
        <div className="lesson-callout">
          Use locators and <code>click()</code> when you can. Coordinates break when the layout changes. Use
          them only where nothing else works: canvases, drawing, sliders.
        </div>
      </Lesson>

      <TestCard title="Select files">
        <p>
          Click to select one file. Shift+click selects a range. Ctrl+click (⌘+click on a Mac) adds or removes
          one file.
        </p>
        <ul className="file-list" role="listbox" aria-label="Files" aria-multiselectable="true">
          {FILES.map((file, index) => (
            <li key={file} role="option" aria-selected={selected.includes(file)} onClick={(event) => selectFile(event, index)}>
              {file}
            </li>
          ))}
        </ul>
        <p className="result" role="status">
          {selectedInOrder.length === 0
            ? "No files selected"
            : `${selectedInOrder.length} selected: ${selectedInOrder.join(", ")}`}
        </p>
      </TestCard>

      <TestCard title="Seat map">
        <p>
          Rows A–E run top to bottom, seats 1–8 left to right. Each seat is 40×40 px with a 10 px gap, starting
          20 px from the corner. Grey seats are taken.
        </p>
        <canvas
          ref={seatCanvas}
          className="seat-map"
          role="img"
          aria-label="Seat map"
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          onClick={clickSeat}
        />
        <p className="result" role="status">
          {seats.length === 0 ? "No seats selected" : `Selected seats: ${[...seats].sort().join(", ")}`}
        </p>
        {seatError && (
          <p className="result error" role="alert">
            {seatError}
          </p>
        )}
      </TestCard>

      <TestCard title="Signature pad">
        <p>Draw a line at least {MIN_SIGNATURE_LENGTH} px long.</p>
        <canvas
          ref={padCanvas}
          className="signature-pad"
          role="img"
          aria-label="Signature pad"
          width={400}
          height={140}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        <div className="row-actions">
          <button type="button" className="secondary" onClick={clearSignature}>
            Clear signature
          </button>
        </div>
        <p className={signature === "accepted" ? "result success" : "result"} role="status" data-testid="signature-status">
          {signature === "empty"
            ? "Signature: empty"
            : signature === "short"
              ? "Signature too short. Draw a longer line."
              : "Signature accepted"}
        </p>
      </TestCard>

      <TestCard title="Zoom with the wheel">
        <p>Scroll up over the box to zoom in, down to zoom out (50–200%).</p>
        <div ref={zoomBox} className="zoom-box" data-testid="zoom-box">
          <div className="zoom-content" style={{ transform: `scale(${zoom / 100})` }}>
            Map
          </div>
        </div>
        <p className="result" role="status">
          Zoom: {zoom}%
        </p>
      </TestCard>

      <TestCard title="Volume slider">
        <p>Drag the handle. The value snaps to steps of 10.</p>
        <div
          ref={track}
          className="slider-track"
          onPointerDown={(event) => {
            sliding.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            moveSlider(event.clientX);
          }}
          onPointerMove={(event) => sliding.current && moveSlider(event.clientX)}
          onPointerUp={() => {
            sliding.current = false;
          }}
        >
          <div className="slider-fill" style={{ width: `${volume}%` }} />
          <div
            className="slider-thumb"
            role="slider"
            tabIndex={0}
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volume}
            style={{ left: `${volume}%` }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                setVolume((value) => Math.min(100, value + 10));
              } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                setVolume((value) => Math.max(0, value - 10));
              }
            }}
          />
        </div>
        <p className="result" role="status">
          Volume: {volume}
        </p>
      </TestCard>
    </>
  );
}
