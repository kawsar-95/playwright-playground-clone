import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const FULL_STOCK = 3;

function stockStatus(stock: number): string {
  if (stock === 0) return "sold-out";
  if (stock === 1) return "low-stock";
  return "in-stock";
}

export default function Properties() {
  const [stock, setStock] = useState(FULL_STOCK);

  return (
    <>
      <PageHeader title="Attributes vs Properties">
        What the HTML said when the page loaded is not always what the element holds now.
      </PageHeader>

      <Lesson title="Attributes, properties and data attributes">
        <h3>Two things with almost the same name</h3>
        <ul>
          <li>
            An <strong>attribute</strong> is text in the HTML, for example <code>&lt;input value="Initial value"&gt;</code>. It
            is the start value.
          </li>
          <li>
            A <strong>property</strong> is a field on the element object in the browser, for example <code>input.value</code>.
            It is the <em>current</em> value. It changes when the user types.
          </li>
        </ul>
        <Code>{`
const nickname = page.getByLabel('Nickname');
await nickname.fill('Neo');

expect(await nickname.getAttribute('value')).toBe('Initial value'); // the HTML
await expect(nickname).toHaveValue('Neo');                          // what the user sees
await expect(nickname).toHaveJSProperty('value', 'Neo');            // the property
`}</Code>
        <p>
          A checkbox works the same way. The <code>checked</code> attribute stays in the HTML after the user clears the box.
        </p>
        <Code>{`
const updates = page.getByLabel('Send me product updates');
await updates.uncheck();

await expect(updates).toHaveAttribute('checked'); // still in the HTML
await expect(updates).not.toBeChecked();         // but not checked now
await expect(updates).toHaveJSProperty('checked', false);
`}</Code>
        <h3>Which one to use in a test</h3>
        <p>
          Use the one that shows what the user sees: <code>toHaveValue()</code>, <code>toBeChecked()</code>, or{" "}
          <code>toHaveJSProperty()</code> for other fields. <code>getAttribute()</code> shows only how the page <em>started</em>.
        </p>
        <h3>Check that an attribute exists</h3>
        <p>
          Some attributes matter only because they are present, for example <code>required</code>, <code>readonly</code> and{" "}
          <code>hidden</code>. Do not give a value. Playwright then checks only that the attribute exists.
        </p>
        <Code>{`
await expect(page.getByLabel('Work email')).toHaveAttribute('required');
await expect(page.getByLabel('Nickname')).not.toHaveAttribute('required');
`}</Code>
        <h3>A relative link and an absolute link</h3>
        <Code>{`
const link = page.getByRole('link', { name: 'Back to Content & Attributes' });

expect(await link.getAttribute('href')).toBe('/content/attributes');
expect(await link.evaluate((a: HTMLAnchorElement) => a.href)).toBe(
  new URL('/content/attributes', page.url()).href
);
`}</Code>
        <h3>data-* attributes</h3>
        <p>
          Many apps keep state in <code>data-*</code> attributes. <code>data-testid</code> is one of them. Assert them one by one,
          or read all of them from the <code>dataset</code> of the element.
        </p>
        <Code>{`
const product = page.getByRole('article', { name: 'Wireless Mouse' });

await page.getByRole('button', { name: 'Buy one' }).click();
await expect(product).toHaveAttribute('data-stock', '2');

const data = await product.evaluate((el) => ({ ...el.dataset }));
expect(data).toEqual({ sku: 'QA-1042', stock: '2', status: 'in-stock' });
`}</Code>
      </Lesson>

      <TestCard title="Typed value">
        <p>Type something, then compare the attribute with the value.</p>
        <div className="form-group">
          <label htmlFor="nickname">Nickname</label>
          <input id="nickname" type="text" defaultValue="Initial value" />
        </div>
        <div className="form-group">
          <label htmlFor="work-email">Work email</label>
          <input id="work-email" type="email" required />
        </div>
      </TestCard>

      <TestCard title="Checked state">
        <p>Starts checked in the HTML. Uncheck it and compare.</p>
        <div className="checkbox-group">
          <label>
            <input type="checkbox" defaultChecked />
            Send me product updates
          </label>
        </div>
      </TestCard>

      <TestCard title="Data attributes">
        <article
          className="product-card property-product"
          aria-labelledby="property-product-name"
          data-sku="QA-1042"
          data-stock={stock}
          data-status={stockStatus(stock)}
        >
          <h3 id="property-product-name">Wireless Mouse</h3>
          <p>{stock} left in stock</p>
          <div className="button-row">
            <button type="button" onClick={() => setStock((s) => s - 1)} disabled={stock === 0}>
              Buy one
            </button>
            <button type="button" className="secondary" onClick={() => setStock(FULL_STOCK)}>
              Restock
            </button>
          </div>
        </article>
      </TestCard>

      <TestCard title="Link address">
        <a href="/content/attributes">Back to Content & Attributes</a>
      </TestCard>
    </>
  );
}
