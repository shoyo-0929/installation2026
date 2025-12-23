# 技術スタック・構成案（フロント中心） v0.1

作成日: 2025-12-16  
対象範囲: **フロントエンド / 配信 / クライアント側キャンバス / 音 / Firebase連携**  
※バックエンドの詳細API仕様は別担当（本書は「フロントが依存する前提」を整理）

---

## 1. 目的
- Next.jsを**SSG（静的配信）**で運用しつつ、実行時（CSR）にFirebase/APIへアクセスして機能を成立させる。
- 「自前サーバーでNode.jsが動くか不安」を回避し、サーバーレス寄りの構成で安定運用する。

---

## 2. 全体アーキテクチャ（概要）
- **配信（静的）**：Next.js（SSGビルド成果物）を静的ホスティングへ配置
- **データ取得**：Firebase SDK（Firestore/Realtime DB等）またはAPIエンドポイント（別担当）
- **画像生成**：ブラウザのCanvasでPNG生成（透過）
- **保存・共有**：Firebase Storage 直接アップロード or API経由アップロード（別担当仕様に従う）
- **音**：Web Audio API（iOS制約あり）

---

## 3. フロントエンド
### 3.1 フレームワーク
- **Next.js**（App Router想定）
- レンダリング：**SSG**を基本（ページ自体は静的、データは実行時取得）

### 3.2 言語/品質
- TypeScript（推奨）
- ESLint / Prettier（推奨）
- 画像/音/アセットはバージョン管理前提

---

## 4. キャンバス実装（候補）
目的：背景・ガイド・軌跡・文章・マスクを安定して管理する。

### 4.1 第一候補：Konva（推奨）
- レイヤー管理が得意（背景/ガイド/テキスト/軌跡を分離しやすい）
- 2D表現で十分な本件に適合

### 4.2 第二候補：素のCanvas（要実装コスト）
- 依存が少ないが、レイヤー/当たり判定/パフォーマンス調整を自前で行う必要あり

### 4.3 ポリシー
- **内部Base解像度：1024×1024（暫定）**
- UI座標→Base座標へ変換し、端末差分を吸収（詳細は `01_canvas_spec.md`）

---

## 5. 音（Web Audio）
- **Web Audio API** 採用（低遅延・制御性）
- iOS Safari対策：開始ボタン等のユーザー操作で `AudioContext.resume()` 必須
- トリガー：距離ごと発音（連打回避）、速度で音量/ピッチ変化（詳細は `04_audio_spec.md`）

---

## 6. Firebase（推奨構成）
### 6.1 利用候補
- Firebase Hosting（静的配信）
- Firebase Auth（会員番号周りのセキュリティ要件次第）
- Firestore / Realtime Database（投稿文章の格納先：既存仕様に合わせる）
- Storage（生成画像の保存先）
-（必要なら）Cloud Functions / Cloud Run（URL発行・検証・署名URLなど）

### 6.2 「自前Node不要」の基本方針
- 静的配信 + Firebase で成立させる
- サーバー処理が必要でも **Cloud Functions/Runに寄せる**（自前サーバー不要）

---

## 7. 配信先（候補）
### 7.1 Firebase Hosting
- Firebaseと統合しやすい（Auth/Storage/Functionsとの相性が良い）

### 7.2 Cloudflare Pages / Vercel など
- Next.jsとの相性が良い（ただしFirebaseとの運用方針は要整理）

> どれでも成立するが、Firebase中心なら Hosting を優先すると運用が単純。

---

## 8. 依存I/F（バックエンド仕様待ち）
- `06_frontend_api_contract_stub.md` を「I/Fすり合わせ窓口」とする
- 想定送信：memberId + bodhicittaId + guideVariant + 画像PNG（透過）
- 想定受信：投稿テキスト、shareUrl 等

---

## 9. 端末対応ポリシー（重要）
- pointer events 前提（iOS/Android）
- `touch-action: none` 等でスクロール干渉を抑制
- iOS Safariのメモリ制約を考慮し、出力サイズはまず1024固定
- `pointercancel` を `pointerup` 同等に扱う（通知/割り込みで破綻しない）

---

## 10. ビルド・環境変数（推奨）
- `.env`：Firebase設定やAPIベースURLなど
- 画像/音のアセットURLは環境で切替可能に（dev/stg/prod）

---

## 11. 今後の拡張余地（将来）
- 画像履歴（マイページ）
- 共有ページ（OGP/埋め込み）
- 高解像度出力（端末性能に応じた可変）
- ガイド線をSVGパスに統一し、スナップや推奨形状の補助を強化

---

## 関連ドキュメント
- `README.md`
- `requirements_spec_v0.1.md`
- `01_canvas_spec.md`
- `04_audio_spec.md`
- `06_frontend_api_contract_stub.md`
