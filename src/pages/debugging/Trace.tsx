import { useEffect, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import Investigation, { type Question } from "./Investigation";

interface Cart {
  items: { name: string; price: number }[];
  subtotal: number;
}

type Payment = { state: "idle" } | { state: "paying" } | { state: "paid"; order: string } | { state: "failed" };

const money = (value: number) => `$${value.toFixed(2)}`;

const QUESTIONS: Question[] = [
  { label: "HTTP status of the failed payment request", check: (answer) => answer === "422" },
  { label: "Amount the page sent in that request", check: (answer) => Number(answer.replace(/^\$/, "")) === 40 },
  {
    label: "X-Request-Id of the failed request",
    hint: "A response header, for example req_1a2b3c4d5e. Any failed payment of yours counts.",
    check: async (answer) => {
      if (!/^req_[a-z0-9]+$/i.test(answer)) return false;
      try {
        const response = await fetch(`/api/checkout/payments/${encodeURIComponent(answer)}`);
        return response.ok && ((await response.json()) as { failed: boolean }).failed === true;
      } catch {
        return false;
      }
    },
  },
  { label: "Error code the app logged to the console", check: (answer) => answer.toUpperCase() === "TOTAL_MISMATCH" },
];

export default function Trace() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [shipping, setShipping] = useState<number | null>(null);
  const [payment, setPayment] = useState<Payment>({ state: "idle" });
  const [round, setRound] = useState(0);

  // Load the cart first. Then load the shipping cost. The shipping request is slow on purpose.
  useEffect(() => {
    const controller = new AbortController();
    const getJson = (url: string) => fetch(url, { signal: controller.signal }).then((response) => response.json());
    getJson("/api/checkout/cart")
      .then((data: Cart) => {
        setCart(data);
        return getJson("/api/checkout/shipping");
      })
      .then((data: { shipping: number }) => setShipping(data.shipping))
      .catch((error: Error) => {
        if (error.name !== "AbortError") console.error("[checkout] could not load the order", error);
      });
    return () => controller.abort();
  }, [round]);

  const newOrder = () => {
    setCart(null);
    setShipping(null);
    setPayment({ state: "idle" });
    setRound((r) => r + 1);
  };

  // While the shipping cost is not known, the total does not include it.
  const total = (cart?.subtotal ?? 0) + (shipping ?? 0);

  const pay = async () => {
    setPayment({ state: "paying" });
    try {
      const response = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total }),
      });
      const body = (await response.json()) as { order?: string; code?: string };
      if (response.ok) {
        setPayment({ state: "paid", order: body.order ?? "" });
      } else {
        console.error(`[checkout] payment rejected (${body.code})`);
        setPayment({ state: "failed" });
      }
    } catch {
      setPayment({ state: "failed" });
    }
  };

  return (
    <>
      <PageHeader title="Trace Viewer">
        Customers say payment "sometimes" fails. Nobody can reproduce it by hand, but an automated test fails every time. Record a
        trace and find out why.
      </PageHeader>

      <Lesson title="Recording and reading a trace">
        <h3>Record a trace</h3>
        <p>
          A trace records all that a test did: each action, a snapshot of the page before and after it, the network, the console
          and the line of source code. Turn it on for one run from the command line.
        </p>
        <Code>{`
npx playwright test checkout --trace on
`}</Code>
        <p>Or turn it on in the config file for all runs.</p>
        <Code>{`
use: {
  trace: 'on-first-retry',   // the usual choice in CI: record only when a test is retried
},
`}</Code>
        <h3>Open the trace</h3>
        <p>
          The HTML report has a link to each trace. You can also open the zip file yourself, or drop it on{" "}
          <code>trace.playwright.dev</code>. The file stays in your browser.
        </p>
        <Code>{`
npx playwright show-report
npx playwright show-trace test-results/<test-folder>/trace.zip
`}</Code>
        <h3>What to look at</h3>
        <ul>
          <li>
            <strong>Actions and snapshots:</strong> select an action and compare the page before and after it. What did the page
            show at the time of the click?
          </li>
          <li>
            <strong>Network:</strong> each request, with its status, headers and body.
          </li>
          <li>
            <strong>Console:</strong> the messages of the page, also the errors that the user never sees.
          </li>
        </ul>
        <div className="lesson-callout">
          UI mode (<code>npx playwright test --ui</code>) shows the same views while you write the test. You do not need to open a
          file.
        </div>
      </Lesson>

      <TestCard title="Checkout">
        {cart ? (
          <>
            <ul className="checkout-items" aria-label="Order">
              {cart.items.map((item) => (
                <li key={item.name}>
                  <span>{item.name}</span>
                  <span>{money(item.price)}</span>
                </li>
              ))}
            </ul>
            <dl className="checkout-summary">
              <div>
                <dt>Subtotal</dt>
                <dd>{money(cart.subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{shipping === null ? "Calculating…" : money(shipping)}</dd>
              </div>
              <div className="checkout-total">
                <dt>Total</dt>
                <dd data-testid="checkout-total">{money(total)}</dd>
              </div>
            </dl>
            {payment.state === "paid" ? (
              <>
                <p className="result success" role="status">
                  Payment received. Order {payment.order}.
                </p>
                <button type="button" className="secondary" onClick={newOrder}>
                  New order
                </button>
              </>
            ) : (
              <button type="button" onClick={pay} disabled={payment.state === "paying"}>
                {payment.state === "paying" ? "Paying…" : "Pay now"}
              </button>
            )}
            {payment.state === "failed" && (
              <p className="result error" role="alert">
                Payment failed. Please try again.
              </p>
            )}
          </>
        ) : (
          <p className="result">Loading your order…</p>
        )}
      </TestCard>

      <TestCard>
        <Investigation title="Bug report" questions={QUESTIONS} solvedMessage="Bug found. Now fix the test so it pays the right amount." />
      </TestCard>
    </>
  );
}
