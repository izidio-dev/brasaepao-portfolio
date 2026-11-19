import { defineConfig } from "@playwright/test";

// Os testes rodam contra o site já exportado (pasta "out"), servido localmente.
export default defineConfig({
  testDir: "./tests/tela",
  use: {
    baseURL: "http://localhost:4174",
    launchOptions: { executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" },
  },
  webServer: {
    command: "npx serve out -l 4174 --no-clipboard",
    url: "http://localhost:4174",
    reuseExistingServer: true,
  },
});
