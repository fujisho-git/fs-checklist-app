import { test, expect } from '@playwright/test';

/**
 * チェックリストアプリのe2eテスト
 */

test.describe('作業前点検システム', () => {
  
  test.beforeEach(async ({ page }) => {
    // テスト前にメイン画面にアクセス
    await page.goto('/');
  });

  test('メイン画面が表示される', async ({ page }) => {
    // タイトルの確認（実際のタイトルテキストに合わせる）
    await expect(page.locator('h1')).toContainText('石油コークス篩い分け設備');
    
    // 点検日が表示されているか確認
    await expect(page.locator('.header-info')).toBeVisible();
    
    // 始業時点検モードのバナーが表示されているか確認
    await expect(page.locator('.start-of-day-notice')).toBeVisible();
    await expect(page.locator('.start-of-day-notice')).toContainText('始業時点検モード');
  });

  test('点検者名と天候を入力できる', async ({ page }) => {
    // 点検者名を入力
    const inspectorInput = page.locator('input[placeholder*="お名前"]');
    await inspectorInput.fill('テスト太郎');
    await expect(inspectorInput).toHaveValue('テスト太郎');
    
    // 天候を入力
    const weatherInput = page.locator('input[placeholder*="晴れ"]');
    await weatherInput.fill('晴れ');
    await expect(weatherInput).toHaveValue('晴れ');
  });

  test('チェックボックスをチェックできる（始業時）', async ({ page }) => {
    // 最初のセクションの最初のチェックボックスを探す
    const firstCheckbox = page.locator('.checkbox-wrapper input[type="checkbox"]').first();
    
    // チェックを入れる
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
    
    // チェックを外す
    await firstCheckbox.uncheck();
    await expect(firstCheckbox).not.toBeChecked();
  });

  test('備考欄に入力できる', async ({ page }) => {
    // 最初の備考入力欄を探す
    const firstNoteInput = page.locator('.note-input').first();
    
    // 備考を入力
    await firstNoteInput.fill('テスト備考');
    await expect(firstNoteInput).toHaveValue('テスト備考');
  });

  test('特記事項を入力できる', async ({ page }) => {
    // 特記事項のテキストエリアを探す
    const specialNotesTextarea = page.locator('.special-notes textarea');
    
    // 特記事項を入力
    await specialNotesTextarea.fill('これはテスト用の特記事項です。');
    await expect(specialNotesTextarea).toHaveValue('これはテスト用の特記事項です。');
  });

  test('点検者名なしで保存ボタンが無効化される', async ({ page }) => {
    // 点検者名を空にする
    const inspectorInput = page.locator('input[placeholder*="お名前"]');
    await inspectorInput.clear();
    
    // 保存ボタンを探す
    const saveButton = page.locator('.save-button');
    
    // ボタンが無効化されているか確認
    await expect(saveButton).toBeDisabled();
    
    // ヒントメッセージが表示されるか確認
    await expect(page.locator('.save-hint')).toContainText('点検者名を入力');
  });

  test('点検者名ありで保存ボタンが有効になる', async ({ page }) => {
    // 点検者名を入力
    const inspectorInput = page.locator('input[placeholder*="お名前"]');
    await inspectorInput.fill('テスト太郎');
    
    // 保存ボタンを探す
    const saveButton = page.locator('.save-button');
    
    // ボタンが有効化されているか確認
    await expect(saveButton).toBeEnabled();
    await expect(saveButton).toContainText('始業時点検を保存');
  });

  test('ヘッダーに正しい列が表示される', async ({ page }) => {
    // ヘッダー行の確認（複数あるので.first()を使う）
    await expect(page.locator('.header-text').first()).toContainText('点検項目');
    await expect(page.locator('.header-checkbox').first()).toContainText('始業時');
    await expect(page.locator('.header-checkbox').nth(1)).toContainText('終業時');
    await expect(page.locator('.header-note').first()).toContainText('備考');
  });

  test('複数のセクションが表示される', async ({ page }) => {
    // ページが完全に読み込まれるまで待つ
    await page.waitForLoadState('networkidle');
    
    // セクションが複数あることを確認
    const sections = page.locator('.checklist-section');
    
    // 最初のセクションが表示されるまで待つ
    await expect(sections.first()).toBeVisible();
    
    const count = await sections.count();
    expect(count).toBeGreaterThan(1);
    
    // 各セクションにタイトルがあることを確認
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(sections.nth(i).locator('h2')).toBeVisible();
    }
  });

  test('履歴ボタンが表示される', async ({ page }) => {
    // 履歴ボタンを探す（ログインしていない場合は「ログイン（履歴確認）」ボタン）
    const historyButton = page.locator('.login-button, .history-button');
    await expect(historyButton).toBeVisible();
  });
});

test.describe('認証画面', () => {
  
  test('ログイン画面に遷移できる', async ({ page }) => {
    await page.goto('/#auth');
    
    // ログイン画面のタイトルを確認
    await expect(page.locator('h2')).toContainText('ログイン');
    
    // メールアドレス入力欄があるか確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // パスワード入力欄があるか確認
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // ログインボタンがあるか確認
    await expect(page.locator('.auth-button')).toContainText('ログイン');
  });

  test('ログイン画面で入力できる', async ({ page }) => {
    await page.goto('/#auth');
    
    // メールアドレスを入力
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    
    // パスワードを入力
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('"ログイン状態を保存する" チェックボックスがある', async ({ page }) => {
    await page.goto('/#auth');
    
    // チェックボックスを探す
    const rememberCheckbox = page.locator('.remember-checkbox');
    await expect(rememberCheckbox).toBeVisible();
    
    // デフォルトでチェックされているか確認
    await expect(rememberCheckbox).toBeChecked();
  });
});

test.describe('レスポンシブデザイン', () => {
  
  test('モバイル画面で正しく表示される', async ({ page }) => {
    // ビューポートをモバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // タイトルが表示されているか確認
    await expect(page.locator('h1')).toBeVisible();
    
    // チェックリストが表示されているか確認
    await expect(page.locator('.checklist-section').first()).toBeVisible();
  });

  test('タブレット画面で正しく表示される', async ({ page }) => {
    // ビューポートをタブレットサイズに設定
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // タイトルが表示されているか確認
    await expect(page.locator('h1')).toBeVisible();
    
    // チェックリストが表示されているか確認
    await expect(page.locator('.checklist-section').first()).toBeVisible();
  });
});

