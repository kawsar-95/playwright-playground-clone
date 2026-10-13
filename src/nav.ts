export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface PageInfo {
  path: string;
  label: string;
  difficulty: Difficulty;
  needsDesktop?: boolean;
}

export interface Group {
  title: string;
  description: string;
  pages: PageInfo[];
}

export const SITE_NAME = "QA Playground";

export const groups: Group[] = [
  {
    title: "Basic Elements",
    description: "Clicking, typing, checking, selecting and hovering: the core actions and assertions.",
    pages: [
      { path: "/basic/buttons", label: "Buttons", difficulty: "beginner" },
      { path: "/basic/inputs", label: "Inputs", difficulty: "beginner" },
      { path: "/basic/checkboxes", label: "Checkboxes", difficulty: "beginner" },
      { path: "/basic/radio-buttons", label: "Radio Buttons", difficulty: "beginner" },
      { path: "/basic/dropdown", label: "Dropdown", difficulty: "beginner" },
      { path: "/basic/hover", label: "Hover", difficulty: "beginner", needsDesktop: true },
    ],
  },
  {
    title: "Locators",
    description: "Repeated names, look-alike elements and no test ids: target exactly one element.",
    pages: [{ path: "/locators/challenges", label: "Locator Challenges", difficulty: "intermediate" }],
  },
  {
    title: "Dynamic Elements",
    description: "Waiting the right way: late elements, changing text, actionability, flaky timing and fake clocks.",
    pages: [
      { path: "/dynamic/appear-disappear", label: "Appear & Disappear", difficulty: "beginner" },
      { path: "/dynamic/changing-text", label: "Changing Text", difficulty: "beginner" },
      { path: "/dynamic/progress-bar", label: "Progress Bar", difficulty: "intermediate" },
      { path: "/dynamic/actionability", label: "Actionability", difficulty: "intermediate" },
      { path: "/dynamic/flaky-lab", label: "Flaky Lab", difficulty: "advanced" },
      { path: "/dynamic/clock", label: "Timers & Clock", difficulty: "advanced" },
    ],
  },
  {
    title: "Forms",
    description: "Login, validation on submit, on blur and by the server, comboboxes, uploads, downloads and a multi-step form.",
    pages: [
      { path: "/forms/login", label: "Login Form", difficulty: "beginner" },
      { path: "/forms/validation", label: "Form Validation", difficulty: "intermediate" },
      { path: "/forms/autocomplete", label: "Autocomplete", difficulty: "intermediate" },
      { path: "/forms/file-upload", label: "File Upload", difficulty: "intermediate" },
      { path: "/forms/file-download", label: "File Download", difficulty: "intermediate" },
      { path: "/forms/wizard", label: "Multi-step Form", difficulty: "advanced" },
    ],
  },
  {
    title: "Authentication",
    description: "Real sessions: Remember me, tabs, and signing in once for many tests.",
    pages: [{ path: "/auth/sign-in", label: "Sign In & Sessions", difficulty: "advanced" }],
  },
  {
    title: "Tables",
    description: "Reading cells, proving sort order, row actions, and a paginated data grid.",
    pages: [
      { path: "/tables/basic", label: "Basic Table", difficulty: "beginner" },
      { path: "/tables/sortable", label: "Sortable Table", difficulty: "intermediate" },
      { path: "/tables/actions", label: "Table Actions", difficulty: "intermediate" },
      { path: "/tables/data-grid", label: "Data Grid", difficulty: "advanced" },
    ],
  },
  {
    title: "Dialogs & Windows",
    description: "Native browser dialogs, modals and overlays, popups, new tabs and windows.",
    pages: [
      { path: "/dialogs/javascript", label: "JavaScript Dialogs", difficulty: "beginner" },
      { path: "/dialogs/modal", label: "Modals & Overlays", difficulty: "intermediate" },
      { path: "/dialogs/windows", label: "Tabs & Windows", difficulty: "advanced" },
    ],
  },
  {
    title: "Frames",
    description: "Entering iframes, nested and duplicate frames, and real-world embedded widgets.",
    pages: [
      { path: "/frames/iframe", label: "iFrame Basics", difficulty: "beginner" },
      { path: "/frames/nested", label: "Nested & Multiple Frames", difficulty: "intermediate" },
      { path: "/frames/embeds", label: "Embedded Widgets", difficulty: "advanced" },
    ],
  },
  {
    title: "Mouse & Keyboard",
    description: "Keyboard input, drag and drop and advanced mouse actions.",
    pages: [
      { path: "/keyboard/actions", label: "Keyboard Actions", difficulty: "beginner", needsDesktop: true },
      { path: "/keyboard/drag-and-drop", label: "Drag & Drop", difficulty: "intermediate", needsDesktop: true },
      { path: "/keyboard/mouse-actions", label: "Mouse Actions", difficulty: "intermediate", needsDesktop: true },
    ],
  },
  {
    title: "Content & Attributes",
    description: "Text, attributes vs properties, ARIA state, shadow DOM and whole-page audits.",
    pages: [
      { path: "/content/attributes", label: "Content & Attributes", difficulty: "beginner" },
      { path: "/content/properties", label: "Attributes vs Properties", difficulty: "intermediate" },
      { path: "/content/aria-widgets", label: "ARIA Widgets", difficulty: "intermediate" },
      { path: "/content/shadow-dom", label: "Shadow DOM", difficulty: "intermediate" },
      { path: "/content/page-audit", label: "Page Audit", difficulty: "advanced" },
    ],
  },
  {
    title: "Network & API",
    description: "Watching network traffic, testing the API directly, and mocking responses.",
    pages: [
      { path: "/network/api", label: "API Playground", difficulty: "intermediate" },
      { path: "/network/api-testing", label: "API Testing", difficulty: "advanced" },
      { path: "/network/mocking", label: "Network Mocking", difficulty: "advanced" },
    ],
  },
  {
    title: "Debugging & Tracing",
    description: "Reading error messages, finding a bug in a trace, and the tools for debugging tests.",
    pages: [
      { path: "/debugging/failures", label: "Reading Failures", difficulty: "beginner" },
      { path: "/debugging/trace", label: "Trace Viewer", difficulty: "intermediate" },
      { path: "/debugging/toolkit", label: "Debugging Toolkit", difficulty: "advanced" },
    ],
  },
];

/** Routes that open as helper pages (popups, new tabs). They are not in the sidebar. */
export const hiddenPaths = ["/dialogs/new-window-content", "/dialogs/new-tab-content", "/dialogs/report"];

/** Old URLs that redirect to the current page. */
export const redirects: { from: string; to: string }[] = [
  { from: "/interactions/hover", to: "/basic/hover" },
  { from: "/interactions/double-click", to: "/basic/buttons" },
  { from: "/interactions/right-click", to: "/basic/buttons" },
  { from: "/auth/account", to: "/auth/sign-in" },
  { from: "/dynamic/delayed-element", to: "/dynamic/appear-disappear" },
  { from: "/dynamic/loading-spinner", to: "/dynamic/appear-disappear" },
  { from: "/dynamic/disappearing-element", to: "/dynamic/appear-disappear" },
  { from: "/dynamic/dynamic-text", to: "/dynamic/changing-text" },
  { from: "/dialogs/new-window", to: "/dialogs/windows" },
  { from: "/dialogs/new-tab", to: "/dialogs/windows" },
];

export const allPages: PageInfo[] = groups.flatMap((g) => g.pages);
