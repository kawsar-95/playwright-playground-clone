import { useEffect, useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const CHAT_DELAY_MS = 1500;

export default function EmbeddedWidgets() {
  const [chat, setChat] = useState<"closed" | "loading" | "open">("closed");
  const [order, setOrder] = useState<string | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [access, setAccess] = useState<string | null>(null);
  const checkoutRef = useRef<HTMLIFrameElement>(null);
  const ratingRef = useRef<HTMLIFrameElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; order?: unknown; stars?: unknown } | null;
      if (
        event.source === checkoutRef.current?.contentWindow &&
        event.origin === window.location.origin &&
        data?.type === "order-placed"
      ) {
        setOrder(String(data.order));
      }
      if (event.source === ratingRef.current?.contentWindow && data?.type === "rating") {
        setStars(Number(data.stars));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const openChat = () => {
    setChat("loading");
    timer.current = window.setTimeout(() => setChat("open"), CHAT_DELAY_MS);
  };

  return (
    <>
      <PageHeader title="Embedded Widgets">
        Frames as real apps use them: loaded late, navigating, talking to the page, opening dialogs, sandboxed,
        and mocked.
      </PageHeader>

      <Lesson title="Real-world frames">
        <h3>A frame that appears later</h3>
        <p>
          Frame locators wait for the frame and for the element inside it. A late frame needs no special code.
          The Frame API does not wait. <code>page.frame()</code> returns <code>null</code> until the frame
          exists.
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Open chat' }).click();

const chat = page.getByTitle('Support chat').contentFrame();
await chat.getByLabel('Message').fill('Hi');   // waits for the frame
`}</Code>

        <h3>A frame that navigates</h3>
        <p>
          Each checkout step loads a new URL inside the frame. The URL of the page does not change. A frame
          locator keeps working after each navigation. To read the URL of the frame, use the Frame object.
        </p>
        <Code>{`
const checkout = page.frame({ name: 'checkout' })!;
await expect.poll(() => checkout.url()).toContain('step=2');
await expect(page).toHaveURL('/frames/embeds'); // unchanged
`}</Code>

        <h3>Frames talking to the page</h3>
        <p>
          Widgets send results with <code>postMessage</code>. Test the full loop. Act inside the frame, then
          check what the page shows.
        </p>

        <h3>Dialogs from inside a frame</h3>
        <p>
          <code>alert()</code> and <code>confirm()</code> in a frame still reach <code>page.on('dialog')</code>.
          Add the handler before the click, as on the JavaScript Dialogs page.
        </p>

        <h3>Sandboxed frames</h3>
        <p>
          <code>sandbox="allow-scripts"</code> gives the frame an opaque origin, like a widget from another
          site. The scripts of the page cannot read it. Playwright controls the browser, so it can. Your test
          does not change.
        </p>

        <h3>Mocking what a frame loads</h3>
        <p>
          The document of a frame is a network request. <code>page.route()</code> can replace it. Set up the
          route before the page loads.
        </p>
        <Code>{`
await page.route('**/embeds/weather/', (route) =>
  route.fulfill({ contentType: 'text/html', body: '<p>-5°C, snow</p>' })
);
await page.goto('/frames/embeds');
`}</Code>
      </Lesson>

      <TestCard title="Support chat">
        <p>The chat widget loads 1.5 seconds after you open it.</p>
        {chat === "closed" ? (
          <button type="button" onClick={openChat}>
            Open chat
          </button>
        ) : chat === "loading" ? (
          <p className="result" role="status">
            Connecting…
          </p>
        ) : (
          <iframe title="Support chat" className="test-iframe" src="/embeds/chat/" style={{ height: 280 }} />
        )}
      </TestCard>

      <TestCard title="Checkout">
        <p>A three-step checkout. Each step is a new page inside the frame.</p>
        <iframe
          ref={checkoutRef}
          title="Checkout"
          name="checkout"
          className="test-iframe"
          src="/embeds/checkout/"
          style={{ height: 240 }}
        />
        {order && (
          <p className="result success" role="status">
            Order {order} confirmed
          </p>
        )}
      </TestCard>

      <TestCard title="Account settings">
        <p>The button inside this frame asks for confirmation.</p>
        <iframe title="Account settings" className="test-iframe" src="/embeds/danger/" style={{ height: 160 }} />
      </TestCard>

      <TestCard title="Sandboxed rating widget">
        <p>
          Page script access to this frame: <strong data-testid="rating-access">{access ?? "checking"}</strong>
        </p>
        <iframe
          ref={ratingRef}
          title="Rating widget"
          sandbox="allow-scripts"
          className="test-iframe"
          src="/embeds/rating/"
          style={{ height: 210 }}
          onLoad={() => {
            const readable = ratingRef.current?.contentDocument != null;
            setAccess(readable ? "allowed" : "blocked");
          }}
        />
        {stars !== null && (
          <p className="result success" data-testid="rating-result">
            You rated {stars} out of 5
          </p>
        )}
      </TestCard>

      <TestCard title="Weather">
        <p>A third-party embed. Replace it with your own content.</p>
        <iframe title="Weather" className="test-iframe" src="/embeds/weather/" style={{ height: 160 }} />
      </TestCard>
    </>
  );
}
