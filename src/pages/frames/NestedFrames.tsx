import { Code, Lesson, PageHeader, TestCard } from "../../components";

const plans = [
  { id: "basic", name: "Basic plan", price: "$5 per month" },
  { id: "pro", name: "Pro plan", price: "$15 per month" },
];

export default function NestedFrames() {
  return (
    <>
      <PageHeader title="Nested & Multiple Frames">
        A frame inside a frame, two identical widgets, and a frame with no title.
      </PageHeader>

      <Lesson title="Chaining, choosing and finding frames">
        <h3>Nested frames: one step at a time</h3>
        <p>
          Each <code>contentFrame()</code> enters one level. A locator of the outer frame cannot see into the
          inner frame.
        </p>
        <Code>{`
const store = page.getByTitle('Store').contentFrame();
const reviews = store.getByTitle('Reviews').contentFrame();

await reviews.getByLabel('Your review').fill('Works great');
await reviews.getByRole('button', { name: 'Post review' }).click();

await expect(store.getByText('3 reviews')).toBeVisible(); // the outer frame updated
`}</Code>

        <h3>Two frames with the same title</h3>
        <p>
          Both payment widgets have the title "Payment". <code>page.getByTitle('Payment')</code> matches two
          elements and fails in strict mode. Choose one by its surroundings, as a user does.
        </p>
        <Code>{`
const pro = page
  .getByRole('region', { name: 'Pro plan' })
  .getByTitle('Payment')
  .contentFrame();
`}</Code>
        <p>
          <code>.first()</code> and <code>.nth()</code> also work. They break when the order changes.
        </p>

        <h3>The Frame API: page.frame() and page.frames()</h3>
        <p>
          Older code uses the <code>Frame</code> object. Find a frame by its <code>name</code> attribute or by
          its URL. This API does not wait for the frame, so use it only for frames that are already loaded.
        </p>
        <Code>{`
const pro = page.frame({ name: 'pay-pro' });
const terms = page.frame({ url: /\\/embeds\\/terms\\// });

console.log(page.frames().map((frame) => frame.url())); // the page and every frame
`}</Code>

        <h3>A frame with no title</h3>
        <p>The terms frame has no title and no name. Use an attribute that it has.</p>
        <Code>{`
const terms = page.locator('iframe[src="/embeds/terms/"]').contentFrame();
`}</Code>
        <div className="lesson-callout">
          An iframe without a title is also an accessibility problem. A screen reader says only "frame". Report
          it.
        </div>
      </Lesson>

      <TestCard title="Nested frame">
        <p>The store frame embeds a reviews frame. A new review changes the count in the store.</p>
        <iframe title="Store" className="test-iframe" src="/embeds/store/" style={{ height: 460 }} />
      </TestCard>

      <TestCard title="Choose a plan">
        <div className="plan-grid">
          {plans.map((plan) => (
            <section key={plan.id} className="plan-card" aria-labelledby={`plan-${plan.id}`}>
              <h3 id={`plan-${plan.id}`}>{plan.name}</h3>
              <p>{plan.price}</p>
              <iframe
                title="Payment"
                name={`pay-${plan.id}`}
                className="test-iframe"
                src={`/embeds/pay/?plan=${plan.id}`}
                style={{ height: 200 }}
              />
            </section>
          ))}
        </div>
      </TestCard>

      <TestCard title="Terms">
        <iframe className="test-iframe" src="/embeds/terms/" style={{ height: 180 }} />
      </TestCard>
    </>
  );
}
