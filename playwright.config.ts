import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      // Uses the Chrome that is installed on the machine. No browser download is needed.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
