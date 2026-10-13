import { useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import { useTimers } from "./useTimers";

const SESSION_MS = 120_000;

function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export default function Clock() {
  const { every, cancel } = useTimers();
  const [remaining, setRemaining] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const [openedAt] = useState(() => new Date());

  const startSession = () => {
    const end = Date.now() + SESSION_MS;
    const tick = () => {
      const left = Math.max(end - Date.now(), 0);
      setRemaining(left);
      if (left === 0) cancel(timer.current);
    };
    cancel(timer.current);
    tick();
    timer.current = every(tick, 1000);
  };

  const expired = remaining === 0;
  const weekend = isWeekend(openedAt);

  return (
    <div className="dynamic-page">
      <PageHeader title="Timers & Clock">
        Countdowns and content that depends on the date. Test minutes of behavior in milliseconds, on any day you choose.
      </PageHeader>

      <Lesson title="Control time with page.clock">
        <h3>Do not wait for real time</h3>
        <p>
          A test that waits 2 real minutes for a session to end is slow, and it can still time out. <code>page.clock</code>{" "}
          replaces the clock of the page, <code>Date</code> and the timers with a fake clock. Your test controls it.
        </p>
        <h3>Install the clock before the page loads</h3>
        <Code>{`
await page.clock.install();
await page.goto('/dynamic/clock');

await page.getByRole('button', { name: 'Start session' }).click();
await expect(page.getByTestId('session-countdown')).toHaveText('2:00');

await page.clock.fastForward('01:30');
await expect(page.getByTestId('session-countdown')).toHaveText('0:30');

await page.clock.fastForward('00:30');
await expect(page.getByRole('alert')).toHaveText(/Session expired/);
`}</Code>
        <h3>fastForward or runFor?</h3>
        <ul>
          <li>
            <code>fastForward()</code> jumps ahead. Each timer that is due fires one time at most. This is like a laptop
            that wakes from sleep. A page that computes time from <code>Date.now()</code>, as this page does, handles this
            correctly.
          </li>
          <li>
            <code>runFor()</code> moves time forward step by step. It fires every timer as many times as it would run in
            real life. Use it when the page counts ticks.
          </li>
        </ul>
        <h3>Pretend that it is another day</h3>
        <p>The promo banner depends on the day of the week. Set the date before the page loads. Then you can test both branches on any day:</p>
        <Code>{`
// 10 October 2026 is a Saturday.
await page.clock.setFixedTime(new Date('2026-10-10T10:00:00'));
await page.goto('/dynamic/clock');
await expect(page.getByTestId('promo-banner')).toHaveText(/Weekend sale/);
`}</Code>
        <div className="lesson-callout">
          <code>setFixedTime()</code> freezes <code>Date</code> but the timers keep their normal speed. <code>install()</code>{" "}
          fakes both.
        </div>
      </Lesson>

      <TestCard title="Session timeout">
        <p>A session lasts 2 minutes. Then it expires.</p>
        <button type="button" onClick={startSession}>
          Start session
        </button>
        {remaining !== null && !expired && (
          <div className="session-banner" role="status">
            Your session expires in <span data-testid="session-countdown">{formatRemaining(remaining)}</span>
          </div>
        )}
        {expired && (
          <div className="session-banner expired" role="alert">
            Session expired. Start a new session to continue.
          </div>
        )}
      </TestCard>

      <TestCard title="Weekend promotion">
        <div className={weekend ? "promo-banner weekend" : "promo-banner"} data-testid="promo-banner">
          {weekend ? "Weekend sale: 20% off everything!" : "No promotion today. Come back at the weekend."}
        </div>
        <p className="clock-today">
          Page opened on{" "}
          <time dateTime={openedAt.toISOString()}>
            {openedAt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </time>
        </p>
      </TestCard>
    </div>
  );
}
