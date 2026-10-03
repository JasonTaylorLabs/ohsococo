import { defineConfig, devices } from "@playwright/test";

// Runs against the static export in ./out (build first with an empty base path).
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: "http://localhost:4173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "python3 -m http.server 4173 -d out",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
});
