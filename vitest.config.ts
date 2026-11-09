import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    // skipFull: false because vitest hides 100% rows when it detects an AI agent; the quality pass is one.
    coverage: { provider: "v8", include: ["src/**/*.{ts,tsx}"], reporter: [["text", { skipFull: false }]] },
  },
});
