# 作業前点検チェックリストアプリ

石油コークス篩い分け設備の毎日の作業前点検を行うためのWebアプリケーションです。ReactとFirebase Authenticationを使用しています。

## 機能

- **ユーザー認証**: Firebase Authenticationによるメール・パスワード認証
- **チェックリスト管理**: 作業前点検項目のチェックと備考記入
- **始業時・終業時点検**: 1日2回の点検に対応
- **データ保存**: Firestoreでチェック結果を永続化
- **Teams通知**: 終業時点検完了時に自動でMicrosoft Teamsに通知（オプション）
- **履歴管理**: 過去の点検結果の閲覧・検索
- **管理者機能**: ユーザー管理、全点検履歴の閲覧
- **レスポンシブデザイン**: モバイルデバイスでも使いやすいデザイン

## セットアップ

### 1. プロジェクトのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd my-checklist-app
npm install
```

### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Authenticationを有効化し、メール・パスワード認証を設定
3. Firestoreを有効化
4. プロジェクト設定から設定情報を取得

### 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の形式でFirebase設定を記述：

```bash
# Firebase設定（必須）
VITE_apiKey=your_api_key_here
VITE_authDomain=your_project_id.firebaseapp.com
VITE_databaseURL=https://your_project_id-default-rtdb.firebaseio.com/
VITE_projectId=your_project_id
VITE_storageBucket=your_project_id.appspot.com
VITE_messagingSenderId=your_messaging_sender_id
VITE_appId=your_app_id
VITE_measurementId=your_measurement_id

# Microsoft Teams通知（オプション）
# 終業時点検完了時にTeamsへ通知を送信する場合に設定
# Teamsワークフロー（Power Automate）で生成されたWebhook URLを使用
VITE_TEAMS_WEBHOOK_URL=https://prod-xx.japaneast.logic.azure.com:443/workflows/xxxxx
```

#### Microsoft Teams通知の設定方法（オプション）

終業時点検完了時に自動でTeamsに通知を送信できます：

**注意**: 従来のIncoming Webhookは廃止されました。新しい「ワークフロー」機能を使用してください。

1. **Teamsでチャネルを開く**
   - 通知を受信したいチャネルを選択

2. **ワークフローを追加**
   - メッセージ作成欄の「…」（その他のオプション）をクリック
   - 「ワークフロー」を選択
   - 「Webhook経由で受信したときに、チャネルに投稿する」を検索
   - またはテンプレートから「チャネルに投稿する」を選択

3. **ワークフローを設定**
   - チームとチャネルを選択
   - 「追加」をクリック

4. **Webhook URLをコピー**
   - 生成されたURLをコピー（形式: `https://prod-xx.japaneast.logic.azure.com:443/workflows/...`）
   - `.env.local`の`VITE_TEAMS_WEBHOOK_URL`に貼り付け

5. **アプリを再起動**
   ```bash
   npm run dev
   ```

**通知される内容：**
- 点検種別（始業時/終業時）
- 点検者名
- 点検日
- 天候
- 完了時刻
- 未チェック項目数
- 特記事項
- 詳細確認リンク

**通知タイミング：**
- ☀️ 始業時点検を保存したとき
- 🌙 終業時点検を保存したとき

### 4. アプリの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてアプリを開きます。

## 使用方法

### 1. アカウント作成・ログイン
- 初回利用時はアカウント作成画面でメールアドレスとパスワードを設定
- 既存ユーザーはログイン画面からログイン

### 2. チェックリストの記入
- **点検者名と天候**: ヘッダー部分で点検者名と天候を入力
- **安全確認**: 作業開始前の安全確認項目をチェック
- **設備点検**: 共通点検と個別設備点検項目をチェック
- **備考**: 各項目に備考を記入可能
- **特記事項**: 申し送り事項を記入

### 3. データの保存
- 点検者名を入力後、「チェックリストを保存」ボタンで保存
- 保存されたデータはFirestoreに永続化される

## チェックリスト項目

### 1. 作業開始前の安全確認
- 稼働エリアの安全確保確認
- 作業員間の打ち合わせ確認
- 連絡方法の周知確認
- 重機と作業員の作業エリア分離確認

### 2. 設備全体の共通点検
- 設備本体・構造体の点検
- 接合部のボルト・ピン類の点検

### 3. 各設備の個別点検
以下の設備について詳細点検：
- 動力制御盤
- ベルトフィーダ
- ベルトコンベア
- ジャンピング
- スクリーン
- 解砕機
- ロールブレーカー

### 4. 特記事項・申し送り事項
- 自由記述欄

## 技術スタック

- **フロントエンド**: React 19.1.0, Vite 7.0.4
- **認証**: Firebase Authentication
- **データベース**: Cloud Firestore
- **スタイリング**: CSS3 (カスタムスタイル)

## ディレクトリ構成

```
src/
├── components/          # コンポーネント
│   ├── Auth.jsx        # 認証コンポーネント
│   └── Checklist.jsx   # チェックリストコンポーネント
├── contexts/           # React Context
│   └── AuthContext.jsx # 認証コンテキスト
├── data/              # データ定義
│   └── checklistData.js # チェックリストテンプレート
├── App.jsx            # メインアプリコンポーネント
├── App.css            # アプリのスタイル
├── firebase.js        # Firebase設定
└── main.jsx          # エントリーポイント
```

## テスト

### e2eテスト（Playwright）

アプリケーションのe2eテストを実行できます。

```bash
# e2eテストを実行（ヘッドレスモード）
npm run test:e2e

# UIモードでテストを実行（インタラクティブ）
npm run test:e2e:ui

# ヘッド付きモードでテストを実行（ブラウザが表示される）
npm run test:e2e:headed

# テストレポートを表示
npm run test:e2e:report
```

### テスト内容

- メイン画面の表示確認
- 点検者名・天候の入力
- チェックボックスのチェック/アンチェック
- 備考欄への入力
- 特記事項の入力
- 保存ボタンの有効/無効化
- 認証画面への遷移と入力
- レスポンシブデザインの確認

## ビルドとデプロイ

### ローカルビルド

```bash
# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

### Vercelへのデプロイ

1. **リポジトリをVercelに接続**

2. **環境変数を設定**
   - Vercelダッシュボード → Settings → Environment Variables
   - `.env.local`の全ての変数を追加：
     - `VITE_apiKey`
     - `VITE_authDomain`
     - `VITE_databaseURL`
     - `VITE_projectId`
     - `VITE_storageBucket`
     - `VITE_messagingSenderId`
     - `VITE_appId`
     - `VITE_measurementId`
     - `VITE_TEAMS_WEBHOOK_URL`（オプション）

3. **Firebase Authenticationでドメインを許可**
   - Firebase Console → Authentication → Settings → Authorized domains
   - Vercelのドメイン（例：`your-app.vercel.app`）を追加

4. **デプロイ**
   - Vercelが自動でビルド・デプロイを実行

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
