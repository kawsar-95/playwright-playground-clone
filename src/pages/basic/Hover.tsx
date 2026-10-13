import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const menuOptions = ["Option 1", "Option 2", "Option 3"];

export default function Hover() {
  const [hovering, setHovering] = useState(false);
  const [choice, setChoice] = useState("");
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <div>
      <PageHeader title="Hover">Elements that change their behavior or appearance when hovered.</PageHeader>

      <Lesson title="Hovering and hover-only content">
        <h3>hover() moves the mouse over an element</h3>
        <p>
          <code>hover()</code> scrolls the element into view. Then it moves the mouse to the center of the element. To
          stop the hover, hover a different element, for example the heading of the page.
        </p>
        <Code>{`
await page.getByText('Hover over me').hover();
await expect(page.getByText('Hover state: active')).toBeVisible();

await page.getByRole('heading', { name: 'Hover', exact: true }).hover();
await expect(page.getByText('Hover state: inactive')).toBeVisible();
`}</Code>
        <h3>Menus that show only on hover</h3>
        <p>
          The hidden items of a menu are in the page, but you cannot click them. Hover the trigger first. Then click the
          item while the menu is open. The mouse goes directly from the trigger to the item, so the menu stays open.
        </p>
        <Code>{`
const option = page.getByRole('button', { name: 'Option 2' });

await expect(option).toBeHidden();
await page.getByRole('button', { name: 'Move mouse here' }).hover();
await option.click();
`}</Code>
        <h3>Tooltips</h3>
        <p>
          A tooltip has the <code>tooltip</code> role. The trigger points to it with <code>aria-describedby</code>. So
          you can assert a tooltip in two ways:
        </p>
        <Code>{`
const info = page.getByRole('button', { name: 'Shipping info' });

await info.hover();
await expect(page.getByRole('tooltip')).toHaveText('Free shipping on orders over 200 PLN');
await expect(info).toHaveAccessibleDescription('Free shipping on orders over 200 PLN');
`}</Code>
      </Lesson>

      <TestCard title="Basic hover">
        <div className="hover-box" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
          {hovering ? "You are hovering!" : "Hover over me"}
        </div>
        <div className="result">
          Hover state: <strong>{hovering ? "active" : "inactive"}</strong>
        </div>
      </TestCard>

      <TestCard title="Hover menu">
        <div className="hover-menu">
          <button className="hover-menu-trigger">Move mouse here</button>
          <div className="hover-menu-content">
            {menuOptions.map((option) => (
              <button key={option} onClick={() => setChoice(option)}>
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="result" data-testid="hover-menu-result">
          Menu choice: <strong>{choice || "none"}</strong>
        </div>
      </TestCard>

      <TestCard title="Tooltip">
        <div className="tooltip-anchor">
          <button
            type="button"
            className="secondary"
            aria-describedby={tipOpen ? "shipping-tooltip" : undefined}
            onMouseEnter={() => setTipOpen(true)}
            onMouseLeave={() => setTipOpen(false)}
            onFocus={() => setTipOpen(true)}
            onBlur={() => setTipOpen(false)}
          >
            Shipping info
          </button>
          {tipOpen && (
            <div id="shipping-tooltip" className="tooltip" role="tooltip">
              Free shipping on orders over 200 PLN
            </div>
          )}
        </div>
      </TestCard>
    </div>
  );
}
