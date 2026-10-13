import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type CloseReason = "backdrop" | "Escape" | "close button";

/** Custom modal. It moves focus in, keeps Tab inside, closes on Escape and returns focus when it closes. */
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: (reason: CloseReason) => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  useLayoutEffect(() => {
    const element = box.current;
    (element?.querySelector<HTMLElement>(FOCUSABLE) ?? element)?.focus();
    return () => {
      // Give focus back to the element that opened the modal, unless the modal is still in the page.
      queueMicrotask(() => {
        if (!element?.isConnected && opener?.isConnected) opener.focus();
      });
    };
  }, [opener]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const box_ = box.current;
    // A modal on top of this one handles its own keys.
    if ((event.target as HTMLElement).closest('[role="dialog"]') !== box_) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose("Escape");
      return;
    }
    if (event.key !== "Tab" || !box_) return;
    const items = [...box_.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => onClose("backdrop")}>
      <div
        ref={box}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        <button type="button" className="modal-close" aria-label="Close" onClick={() => onClose("close button")}>
          ×
        </button>
      </div>
    </div>
  );
}
