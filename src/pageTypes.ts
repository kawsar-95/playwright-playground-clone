import type { ComponentType } from "react";

export interface Brief {
  /** One sentence: what the learner must achieve. */
  goal: string;
  /** Numbered steps of the exercise. */
  steps: string[];
  /** Playwright APIs the exercise practises. Shown as code chips. */
  apis: string[];
  /** Optional hint, hidden in a details element. */
  hint?: string;
}

export interface PageModule {
  Component: ComponentType;
  /** Not set for helper pages that are opened in popups or new tabs. */
  brief?: Brief;
  /** Full Playwright TypeScript test that solves the exercise. */
  solution?: string;
}
