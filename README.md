# 作業前点検チェックリストアプリ

石油コークス篩い分け設備の毎日の作業前点検を行うためのWebアプリケーションです。ReactとFirebase Authenticationを使用しています。

## 機能

- **ユーザー認証**: Firebase Authenticationによるメール・パスワード認証
- **チェックリスト管理**: 作業前点検項目のチェックと備考記入
- **データ保存**: Firestoreでチェック結果を永続化
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
VITE_apiKey=your_api_key_here
VITE_authDomain=your_project_id.firebaseapp.com
VITE_databaseURL=https://your_project_id-default-rtdb.firebaseio.com/
VITE_projectId=your_project_id
VITE_storageBucket=your_project_id.appspot.com
VITE_messagingSenderId=your_messaging_sender_id
VITE_appId=your_app_id
VITE_measurementId=your_measurement_id
```

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

## ビルドとデプロイ

```bash
# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
