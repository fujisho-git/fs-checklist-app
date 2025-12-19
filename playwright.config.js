import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright設定ファイル
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* 並列実行を無効化（Firebaseとのやり取りが競合する可能性があるため） */
  fullyParallel: false,
  
  /* CIでのみfailOnErrorを使用 */
  forbidOnly: !!process.env.CI,
  
  /* リトライ設定 */
  retries: process.env.CI ? 2 : 0,
  
  /* ワーカー数 */
  workers: process.env.CI ? 1 : 1,
  
  /* レポート設定 */
  reporter: 'html',
  
  /* 共通設定 */
  use: {
    /* ベースURL */
    baseURL: 'http://localhost:5173',
    
    /* トレース設定（失敗時のみ） */
    trace: 'on-first-retry',
    
    /* スクリーンショット設定 */
    screenshot: 'only-on-failure',
    
    /* ビデオ設定 */
    video: 'retain-on-failure',
  },

  /* テスト実行前にdevサーバーを起動 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* テスト対象ブラウザ */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* モバイルテスト */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
});

