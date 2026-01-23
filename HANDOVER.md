# システム引継ぎ資料

## 📋 目次
1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [アーキテクチャ構成](#アーキテクチャ構成)
4. [主要機能](#主要機能)
5. [ディレクトリ構成](#ディレクトリ構成)
6. [データ構造](#データ構造)
7. [環境設定](#環境設定)
8. [開発手順](#開発手順)
9. [デプロイメント](#デプロイメント)
10. [運用管理](#運用管理)
11. [トラブルシューティング](#トラブルシューティング)

---

## システム概要

### 概要
石油コークス篩い分け設備の毎日の作業前点検を行うためのWebアプリケーションです。
作業員が始業時・終業時に設備点検を行い、結果をデータベースに記録します。

### 目的
- 作業前点検の確実な実施
- 点検記録の電子化・永続化
- 管理者による履歴管理・監視
- Microsoft Teamsへの自動通知によるコミュニケーション改善

### 対象ユーザー
- **作業員**: 日々の点検実施・記録
- **管理者**: 全ユーザーの点検履歴閲覧、ユーザー管理

---

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 19.1.0 | UIフレームワーク |
| Vite | 7.0.4 | ビルドツール・開発サーバー |
| CSS3 | - | スタイリング |

### バックエンド・インフラ
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Firebase Authentication | 11.10.0 | ユーザー認証 |
| Cloud Firestore | 11.10.0 | データベース |
| Firebase Storage | 11.10.0 | ファイル保存（将来の拡張用） |

### 開発ツール
| 技術 | バージョン | 用途 |
|------|-----------|------|
| ESLint | 9.30.1 | コード品質チェック |
| Playwright | 1.57.0 | E2Eテスト |

### 外部連携
- **Microsoft Teams**: Webhook経由での点検完了通知

---

## アーキテクチャ構成

### システム構成図

```
┌─────────────────┐
│   ユーザー      │
│  (ブラウザ)     │
└────────┬────────┘
         │
         │ HTTPS
         ↓
┌─────────────────────────────────┐
│      Vite Development Server    │
│      (React Application)        │
│                                 │
│  ┌──────────────────────────┐  │
│  │  App.jsx (ルーティング)   │  │
│  └──────────┬───────────────┘  │
│             │                   │
│  ┌──────────┴───────────────┐  │
│  │    Components            │  │
│  │  - Auth                  │  │
│  │  - Checklist             │  │
│  │  - ChecklistHistory      │  │
│  │  - ChecklistDetail       │  │
│  │  - AdminHistory          │  │
│  │  - AdminManagement       │  │
│  └──────────┬───────────────┘  │
│             │                   │
│  ┌──────────┴───────────────┐  │
│  │   Contexts & Utils       │  │
│  │  - AuthContext           │  │
│  │  - helpers.js            │  │
│  │  - adminUtils.js         │  │
│  └──────────────────────────┘  │
└────────┬───────────┬────────────┘
         │           │
         │           │ Webhook
         │           ↓
         │  ┌─────────────────┐
         │  │ Microsoft Teams │
         │  └─────────────────┘
         │
         │ Firebase SDK
         ↓
┌──────────────────────────────────┐
│      Firebase Services           │
│                                  │
│  ┌────────────────────────────┐ │
│  │  Authentication            │ │
│  │  - Email/Password認証      │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │  Cloud Firestore           │ │
│  │  ├─ checklists collection  │ │
│  │  └─ admins collection      │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │  Firebase Storage          │ │
│  │  (将来の拡張用)             │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

### データフロー

#### 1. 認証フロー
```
ユーザー → Auth.jsx → Firebase Authentication → AuthContext
                                                      ↓
                                                 currentUser
                                                      ↓
                                              全コンポーネント
```

#### 2. チェックリスト保存フロー
```
ユーザー → Checklist.jsx → Firestore (checklists) → Teams通知
                    ↓
            ローカルストレージ(編集履歴)
```

#### 3. 履歴閲覧フロー
```
ユーザー → ChecklistHistory.jsx → Firestore (query) → ChecklistDetail.jsx
```

---

## 主要機能

### 1. 認証機能（Auth.jsx）
- **ログイン**: Email/Password認証
- **アカウント作成**: 新規ユーザー登録
- **ログイン状態保持**: 
  - "ログイン状態を保持" オプション
  - ローカル/セッションストレージの切り替え
- **クロスタブ同期**: 別タブでのログインを検知

### 2. チェックリスト機能（Checklist.jsx）

#### 点検種別
- **始業時点検**: 作業開始前の点検（☀️アイコン）
- **終業時点検**: 作業終了後の点検（🌙アイコン）

#### 入力項目
- 点検者名（必須）
- 天候（必須）
- 各設備のチェック項目
- 備考（各項目ごと）
- 特記事項・申し送り事項

#### 主要機能
- **自動保存**: ローカルストレージに編集内容を自動保存
- **復元**: ブラウザ再起動後も編集内容を復元
- **未チェック警告**: 未チェック項目がある場合の確認モーダル
- **Teams通知**: 保存時に自動でTeamsに通知
- **編集モード**: 過去の点検結果を編集可能

### 3. 履歴管理機能

#### 一般ユーザー（ChecklistHistory.jsx）
- 自分の点検履歴の閲覧
- 日付範囲での検索
- 点検者名での検索
- ステータス表示（完了/終業待ち/未完了）
- 詳細表示（ChecklistDetail.jsx）
- 編集（当日分のみ）

#### 管理者（AdminHistory.jsx）
- 全ユーザーの点検履歴閲覧
- 検索機能（日付、点検者名、Email）
- Excel出力
- ユーザー管理画面への遷移

### 4. 管理者機能（AdminManagement.jsx）
- 管理者権限の付与・剥奪
- 全ユーザー一覧表示
- デフォルト管理者（pr.fujisho@gmail.com）は削除不可

### 5. ナビゲーション機能
- **URLハッシュベース**: ブラウザバック/フォワードに対応
- **ルート**:
  - `#` または `#new`: 新規チェックリスト
  - `#history`: 履歴閲覧
  - `#admin`: 管理者履歴閲覧
  - `#admin-management`: ユーザー管理
  - `#detail-{id}`: 詳細表示
  - `#edit-{id}`: 編集画面
  - `#auth`: ログイン画面

---

## ディレクトリ構成

```
my-checklist-app/
├── public/                      # 静的ファイル
│   └── favicon.svg             # ファビコン
│
├── src/                        # ソースコード
│   ├── components/             # Reactコンポーネント
│   │   ├── Auth.jsx           # 認証コンポーネント
│   │   ├── Checklist.jsx      # チェックリストメイン画面
│   │   ├── ChecklistHistory.jsx    # ユーザー履歴画面
│   │   ├── ChecklistDetail.jsx     # 詳細表示画面
│   │   ├── AdminHistory.jsx        # 管理者履歴画面
│   │   └── AdminManagement.jsx     # ユーザー管理画面
│   │
│   ├── contexts/               # React Context
│   │   └── AuthContext.jsx    # 認証状態管理
│   │
│   ├── data/                   # データ定義
│   │   └── checklistData.js   # チェックリストテンプレート
│   │
│   ├── utils/                  # ユーティリティ
│   │   ├── helpers.js         # 汎用ヘルパー関数
│   │   └── adminUtils.js      # 管理者権限チェック
│   │
│   ├── App.jsx                # メインアプリ（ルーティング）
│   ├── App.css                # アプリ全体のスタイル
│   ├── firebase.js            # Firebase設定
│   ├── index.css              # グローバルスタイル
│   └── main.jsx              # エントリーポイント
│
├── e2e/                       # E2Eテスト
│   └── checklist.spec.js     # Playwrightテスト
│
├── .env.local                 # 環境変数（Git管理外）
├── .gitignore                # Git除外設定
├── eslint.config.js          # ESLint設定
├── firebase.json             # Firebase設定
├── firestore.rules           # Firestoreセキュリティルール
├── firestore.indexes.json    # Firestoreインデックス
├── index.html                # HTMLエントリーポイント
├── package.json              # 依存関係
├── playwright.config.js      # Playwright設定
├── vite.config.js            # Vite設定
└── README.md                 # プロジェクト説明
```

### 主要ファイルの役割

#### コンポーネント
| ファイル | 責務 | 主要な処理 |
|---------|------|-----------|
| **Auth.jsx** | 認証UI | ログイン、アカウント作成、セッション管理 |
| **Checklist.jsx** | チェックリスト入力 | 点検データ入力、保存、Teams通知、自動保存 |
| **ChecklistHistory.jsx** | ユーザー履歴 | 自分の履歴閲覧、検索、編集 |
| **ChecklistDetail.jsx** | 詳細表示 | 点検結果の詳細表示 |
| **AdminHistory.jsx** | 管理者履歴 | 全ユーザー履歴閲覧、Excel出力 |
| **AdminManagement.jsx** | ユーザー管理 | 管理者権限管理 |

#### コンテキスト・ユーティリティ
| ファイル | 責務 |
|---------|------|
| **AuthContext.jsx** | グローバル認証状態、管理者判定 |
| **helpers.js** | 日付処理、進捗計算、ステータス表示 |
| **adminUtils.js** | 管理者権限チェック（同期/非同期） |

#### データ
| ファイル | 責務 |
|---------|------|
| **checklistData.js** | チェックリストテンプレート定義、新規作成 |

---

## データ構造

### Firestore Collections

#### 1. `checklists` コレクション
点検記録を保存するメインコレクション。

```javascript
{
  id: "checklist_1234567890",           // ドキュメントID
  date: "2024-12-23",                   // 点検日（YYYY-MM-DD）
  inspectorName: "山田太郎",             // 点検者名
  weather: "晴れ",                       // 天候
  checkType: "start" | "end" | "both",  // 点検種別
  createdBy: "user@example.com",        // 作成者Email
  createdAt: Timestamp,                 // 作成日時
  startCompletedAt: Timestamp | null,   // 始業時点検完了時刻
  endCompletedAt: Timestamp | null,     // 終業時点検完了時刻
  specialNotes: "...",                  // 特記事項
  sections: [                           // 点検項目
    {
      title: "1) 施設全体の運転前準備項目",
      items: [
        {
          id: "item_xxx",
          text: "点検項目テキスト",
          checkType: "start" | "end" | "both",
          checkedStart: true | false,   // 始業時チェック
          checkedEnd: true | false,     // 終業時チェック
          note: "備考"                   // 備考
        }
      ]
    }
  ]
}
```

#### 2. `admins` コレクション
管理者権限を管理するコレクション。

```javascript
{
  email: "admin@example.com",  // 管理者のEmail（ドキュメントID）
  createdAt: Timestamp,        // 追加日時
  createdBy: "creator@example.com"  // 追加者
}
```

### Firestore セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // チェックリストのルール
    match /checklists/{document} {
      // 認証済みユーザーは読み取り・書き込み可能
      allow read, write: if request.auth != null;
      // 匿名ユーザーも書き込み可能（既存の機能を維持）
      allow write: if true;
    }
    
    // 管理者コレクションのルール
    match /admins/{document} {
      // 認証済みユーザーのみ読み取り可能
      allow read: if request.auth != null;
      
      // デフォルト管理者のみ書き込み・削除可能
      allow write, delete: if request.auth != null && 
                           request.auth.token.email == 'pr.fujisho@gmail.com';
    }
  }
}
```

### ローカルストレージ

#### チェックリスト自動保存
```javascript
// キー: checklist_draft_{userId}
{
  inspector: "山田太郎",
  weather: "晴れ",
  checklist: { /* チェックリストデータ */ },
  savedAt: "2024-12-23T09:15:00"
}
```

#### ログイン状態通知
```javascript
// キー: loginSuccess
timestamp  // 他タブへのログイン成功通知用
```

---

## 環境設定

### 必須環境変数（`.env.local`）

```bash
# Firebase設定（必須）
VITE_apiKey=AIzaSy...
VITE_authDomain=your-project.firebaseapp.com
VITE_databaseURL=https://your-project-default-rtdb.firebaseio.com/
VITE_projectId=your-project-id
VITE_storageBucket=your-project.appspot.com
VITE_messagingSenderId=123456789
VITE_appId=1:123456789:web:abcdef
VITE_measurementId=G-XXXXXXXXXX

# Microsoft Teams通知（オプション）
VITE_TEAMS_WEBHOOK_URL=https://prod-xx.japaneast.logic.azure.com:443/workflows/xxxxx
```

### Firebase Console 設定

#### 1. Authentication
- **サインイン方法**: メール/パスワードを有効化
- **承認済みドメイン**: デプロイ先ドメインを追加（例: `your-app.vercel.app`）

#### 2. Firestore Database
- **モード**: プロダクションモード
- **ロケーション**: asia-northeast1（東京）推奨
- **ルール**: `firestore.rules` を適用

#### 3. Storage
- 現時点では未使用（将来の画像添付機能用に準備）

### Microsoft Teams Webhook 設定

#### 従来のIncoming Webhookは廃止されています
新しい「ワークフロー」機能を使用してください。

#### 設定手順
1. Teamsでチャネルを開く
2. メッセージ作成欄の「…」→「ワークフロー」を選択
3. 「Webhook経由で受信したときに、チャネルに投稿する」を検索
4. チームとチャネルを選択して「追加」
5. 生成されたWebhook URLをコピー
6. `.env.local`の`VITE_TEAMS_WEBHOOK_URL`に設定

#### 通知内容
- 点検種別（始業時/終業時）
- 点検者名
- 点検日
- 天候
- 完了時刻
- 未チェック項目数
- 特記事項
- 詳細確認リンク

---

## 開発手順

### 初回セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd my-checklist-app

# 依存関係のインストール
npm install

# 環境変数の設定
# .env.local ファイルを作成してFirebase設定を記述

# 開発サーバーの起動
npm run dev
```

### 開発コマンド

```bash
# 開発サーバー起動（ホットリロード有効）
npm run dev

# ビルド（プロダクション）
npm run build

# ビルド結果のプレビュー
npm run preview

# ESLint実行
npm run lint

# E2Eテスト実行
npm run test:e2e           # ヘッドレスモード
npm run test:e2e:ui        # UIモード（インタラクティブ）
npm run test:e2e:headed    # ブラウザ表示モード
npm run test:e2e:report    # テストレポート表示
```

### 開発時のポイント

#### 1. コンポーネント開発
- 各コンポーネントは独立性を保つ
- プロップスで親から子にデータを渡す
- `AuthContext`で認証状態を共有

#### 2. スタイリング
- `App.css`に全スタイルを集約
- BEM的な命名規則（例: `.modal-overlay`, `.modal-content`）
- レスポンシブデザイン（モバイルファースト）

#### 3. Firestore操作
```javascript
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 読み取り
const q = query(
  collection(db, 'checklists'), 
  where('createdBy', '==', email)
);
const snapshot = await getDocs(q);

// 書き込み
await addDoc(collection(db, 'checklists'), data);
```

#### 4. 認証状態の利用
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { currentUser, isAdminUser } = useAuth();
  
  if (!currentUser) {
    return <div>ログインが必要です</div>;
  }
  
  // ...
}
```

---

## デプロイメント

### Vercelへのデプロイ（推奨）

#### 1. リポジトリをVercelに接続
```bash
# Vercel CLIのインストール（任意）
npm install -g vercel

# デプロイ
vercel
```

#### 2. 環境変数の設定
Vercelダッシュボード → Settings → Environment Variables

以下を全て追加：
- `VITE_apiKey`
- `VITE_authDomain`
- `VITE_databaseURL`
- `VITE_projectId`
- `VITE_storageBucket`
- `VITE_messagingSenderId`
- `VITE_appId`
- `VITE_measurementId`
- `VITE_TEAMS_WEBHOOK_URL`（オプション）

#### 3. Firebase Authenticationで承認ドメインを追加
Firebase Console → Authentication → Settings → Authorized domains
→ Vercelのドメイン（例: `your-app.vercel.app`）を追加

#### 4. デプロイ確認
- Vercelが自動でビルド・デプロイを実行
- デプロイURLにアクセスして動作確認

### Firebaseホスティングへのデプロイ

```bash
# Firebase CLIのインストール
npm install -g firebase-tools

# ログイン
firebase login

# 初期化（すでに設定済みの場合は不要）
firebase init hosting

# ビルド
npm run build

# デプロイ
firebase deploy --only hosting
```

### 自動デプロイ設定

#### GitHub Actions（例）
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 運用管理

### 管理者権限の付与

#### デフォルト管理者
- Email: `pr.fujisho@gmail.com`
- この管理者のみ他のユーザーに管理者権限を付与・剥奪できる

#### 管理者追加手順
1. デフォルト管理者でログイン
2. 管理者履歴画面（#admin）を開く
3. 「ユーザー管理」ボタンをクリック
4. 対象ユーザーの「管理者にする」ボタンをクリック

#### 管理者削除手順
1. デフォルト管理者でログイン
2. ユーザー管理画面を開く
3. 対象管理者の「管理者を解除」ボタンをクリック

### データのバックアップ

#### Firestoreエクスポート（推奨）
```bash
# Firebase CLIでエクスポート
gcloud firestore export gs://[BUCKET_NAME]/[EXPORT_FOLDER]

# 自動バックアップの設定
# Firebase Console → Firestore → バックアップ
```

#### 手動バックアップ
- 管理者履歴画面でExcelダウンロード機能を使用
- 定期的（週次・月次）にエクスポート推奨

### モニタリング

#### Firebase Console
- **Authentication**: ユーザー数、ログイン状況
- **Firestore**: 読み取り/書き込み回数、ストレージ使用量
- **Performance**: パフォーマンス監視（設定が必要）

#### アプリケーションログ
- ブラウザのコンソールでエラーを確認
- `console.error()` でのエラーログ

### Teams通知の監視

#### 通知が届かない場合
1. `.env.local`の`VITE_TEAMS_WEBHOOK_URL`が正しいか確認
2. TeamsワークフローがアクティブかTeams側で確認
3. ブラウザのコンソールでエラーを確認
4. Webhook URLの有効期限を確認（期限切れの場合は再作成）

---

## トラブルシューティング

### ログインできない

#### 症状
- 「メールアドレスまたはパスワードが間違っています」

#### 対処法
1. パスワードを確認（大文字小文字を区別）
2. Firebase Consoleでユーザーが存在するか確認
3. Firebase Authenticationが有効化されているか確認

### データが保存されない

#### 症状
- 「保存」ボタンを押してもエラーが出る

#### 対処法
1. ブラウザのコンソールでエラーメッセージを確認
2. Firestoreセキュリティルールを確認
3. Firebase Consoleで書き込み制限に引っかかっていないか確認
4. ネットワーク接続を確認

### 履歴が表示されない

#### 症状
- 履歴画面が空白または「データがありません」

#### 対処法
1. ログインしているか確認
2. Firestoreにデータが存在するか確認
3. ブラウザのコンソールでエラーを確認
4. Firestoreセキュリティルールで読み取り権限があるか確認

### Teams通知が届かない

#### 症状
- 保存しても通知が来ない

#### 対処法
1. `.env.local`に`VITE_TEAMS_WEBHOOK_URL`が設定されているか確認
2. Webhook URLが有効か（Teamsワークフローが削除されていないか）
3. ブラウザのコンソールでエラーを確認
4. Teamsワークフローを再作成して新しいURLを設定

### 管理者機能が使えない

#### 症状
- 管理者のはずなのに管理者機能が表示されない

#### 対処法
1. Firestoreの`admins`コレクションに自分のEmailが登録されているか確認
2. ログアウトして再ログイン
3. ブラウザのキャッシュをクリア

### ビルドエラー

#### 症状
```
npm run build
→ エラーが発生
```

#### 対処法
1. `node_modules`を削除して再インストール
   ```bash
   rm -rf node_modules
   npm install
   ```
2. Node.jsのバージョンを確認（v18以上推奨）
3. `.env.local`のシンタックスエラーを確認

### デプロイ後に動かない

#### 症状
- ローカルでは動くがデプロイ後にエラー

#### 対処法
1. Vercel/Firebase Hostingの環境変数が正しく設定されているか確認
2. Firebase Authenticationの承認ドメインにデプロイ先ドメインが追加されているか確認
3. ブラウザのコンソールで詳細なエラーを確認
4. ビルドログを確認

---

## 付録

### よくある質問（FAQ）

#### Q: 匿名ユーザーでもチェックリストを作成できますか？
A: はい、可能です。Firestoreルールで`allow write: if true`が設定されているため、ログインせずに作成できます。ただし、履歴の閲覧や編集にはログインが必要です。

#### Q: 過去のチェックリストを編集できますか？
A: 編集機能は実装されていますが、運用ルールとして当日分のみ編集可能とすることを推奨します。管理者でも過去分の編集は慎重に行ってください。

#### Q: モバイルでも使えますか？
A: はい、レスポンシブデザインで設計されているため、スマートフォンやタブレットからも快適に使用できます。

#### Q: オフラインでも使えますか？
A: 現状ではオフライン機能は実装されていません。インターネット接続が必要です。将来的にはPWA化やオフラインキャッシュの実装を検討できます。

#### Q: チェックリスト項目を変更したい場合は？
A: `src/data/checklistData.js`を編集してください。ただし、既存のデータ構造との互換性に注意が必要です。

### 今後の拡張案

#### 優先度: 高
- [ ] オフライン対応（PWA化）
- [ ] データエクスポート機能の強化（PDF出力）
- [ ] 画像添付機能（Firebase Storage利用）
- [ ] 通知設定のカスタマイズ

#### 優先度: 中
- [ ] チェックリストテンプレートの複数管理
- [ ] 統計ダッシュボード（完了率の推移など）
- [ ] パスワードリセット機能
- [ ] ダークモード対応

#### 優先度: 低
- [ ] 多言語対応
- [ ] 音声入力機能
- [ ] QRコードでのチェックリスト共有

### 連絡先・サポート

#### システム管理者
- Email: pr.fujisho@gmail.com

#### 技術サポート
- リポジトリのIssueで報告
- または管理者に直接連絡

---



