# Repository Guidelines

## Project Structure & Module Organization
本プロジェクトは Next.js 16 App Router と React 19 で構築され、実装の大半は `src/` 以下に集約されています。`src/app` にはページ、レイアウト、サーバーコンポーネントがまとまり、`app/page.tsx` がトップエントリです。UI は `src/components` の PascalCase ファイル群で共有され、状態管理は `src/hooks` のカスタムフック（例: `useLoginForm.ts`）に切り出されています。ユーティリティや API 連携は `src/lib` に並び、`public/images` にはロゴなどの静的アセットを配置します。設定類（`next.config.ts`、`tsconfig.json`、`postcss.config.mjs`、`eslint.config.mjs`）はリポジトリ直下にあり、仕様メモや受け入れ条件は `docs/` に格納してください。

## Build, Test, and Development Commands
- `npm run dev`：ホットリロード付きの開発サーバー（http://localhost:3000）。
- `npm run build`：本番用に Next.js を最適化ビルド。
- `npm run start`：`build` 産物を検証するときの本番サーバー。
- `npm run lint`：`eslint.config.mjs` を基準に TypeScript/JSX/スタイルを検査。自動 CI の事前確認として必須です。

## Coding Style & Naming Conventions
TypeScript を標準とし、2 スペースインデントとセミコロンなしの Next.js デフォルトスタイルに合わせます。コンポーネントは `LoginForm.tsx` のように PascalCase、hooks は `use` プレフィックスを付けた camelCase、ライブラリモジュールは `validators.ts` のような意味のある名詞句で統一してください。Tailwind CSS v4 を想定したクラス合成が中心なので、複雑な見た目は `src/lib/css.ts` のヘルパーに切り出すことを推奨します。外部公開しない値は `.env.local` から `process.env` 経由で参照し、ハードコードを避けます。

## Testing Guidelines
現時点で公式テストスクリプトは未定義ですが、機能追加時は `src/__tests__/` または対象モジュールと同階層に `*.test.ts(x)` を置き、React Testing Library + Vitest/Jest の導入を前提にしてください。最低限、フォーム検証・API 呼び出しのスタブ、アクセシビリティ属性の有無を確認するテストを追加します。自動化が整うまでは、`npm run dev` で表示と入力フローを再現し、`docs/05_acceptance_criteria_test.md` へ手動確認結果を残すことを求めます。

## Commit & Pull Request Guidelines
Git 履歴は `Initial commit from Create Next App` のみですが、以降は「動詞の命令形 + 対象」を基本とし、例として `Add login form validation` のように記述してください。PR では概要、スクリーンショット（UI 変更時）、再現手順、関連 Issue/ドキュメントへのリンクを揃え、`npm run lint` の成功ログを添えてください。複数の論理変更は分割し、レビュアーが `src/components`、`src/lib` などディレクトリ単位で差分を追えるようにします。

## Security & Configuration Tips
認証系データはブラウザに保存する際 `src/lib/storage.ts` の TTL ルール（`REMEMBER_TTL_DAYS`）を守り、期限を変更するときはユーザーメッセージも更新します。機密設定は `.env.local` に置き、共有時は `.env.example` を用意してください。外部 API を追加する場合は `src/lib/api.ts` にまとめて export し、未使用のキーやエンドポイントは残さないよう整理します。
