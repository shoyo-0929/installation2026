# ドキュメント README（全体まとめ） v0.1

作成日: 2025-12-16

このリポジトリ（または共有フォルダ）にあるドキュメント群の目的・読み方・更新手順をまとめたREADMEです。  
※バックエンドAPIの詳細仕様は別担当。本READMEではフロント側の設計・実装で必要な情報にフォーカスします。

---

## 1. まず最初に読むべき順番（推奨）
1. **`requirements_spec_v0.1.md`**  
   目的・スコープ・3画面の概要・コア仕様のたたき台
2. **`01_canvas_spec.md`**  
   キャンバスのレイヤー、未閉/自己交差の扱い、Safe Zone、出力の仕様（フロントの要）
3. **`02_state_machine.md`**  
   状態遷移（10秒再開/生成/アップロード/エラー）を固定し、実装ブレを防ぐ
4. **`03_assets_spec.md`**  
   背景12種＋ガイド36種のファイル形式・命名・サイズを固定
5. **`04_audio_spec.md`**  
   iOS制約込みの音仕様（Web Audio）
6. **`05_acceptance_criteria_test.md`**  
   受け入れ基準（Doneの定義）とテスト観点
7. **`06_frontend_api_contract_stub.md`**  
   バックエンド仕様が来たらここを最初に更新（I/Fの擦り合わせ用）

---

## 2. ドキュメント一覧と役割
### 2.1 要件・仕様の大枠
- `requirements_spec_v0.1.md`  
  プロジェクトの目的・スコープ・画面・コア仕様の「全体のたたき台」

### 2.2 キャンバス仕様（最重要）
- `01_canvas_spec.md`  
  Safe Zone、マスク生成、未閉/自己交差の扱い、出力生成手順、座標系など

### 2.3 状態遷移
- `02_state_machine.md`  
  画面遷移・キャンバス操作状態（Drawing/Hold/Reset）・生成/アップロードの状態

### 2.4 アセット
- `03_assets_spec.md`  
  背景/ガイドの形式（SVG推奨）、命名、サイズ、差し替え運用

### 2.5 音
- `04_audio_spec.md`  
  Web Audioでの鳴らし方、iOSの制約、トリガー（距離ごと）、制作チームへの要件

### 2.6 受け入れ基準・テスト
- `05_acceptance_criteria_test.md`  
  何を満たせば完成か、端末別にどこを確認するか

### 2.7 フロント⇄バック I/F 叩き台（更新前提）
- `06_frontend_api_contract_stub.md`  
  memberId＋画像（PNG）送付、共有URL受領の枠。バックエンド仕様に合わせて上書きする。

### 2.8 索引
- `00_docs_index.md`  
  ドキュメントの一覧（リンク集）。READMEと役割が被るため、今後はREADMEを正としてもOK。

---

## 3. 共通の設計方針（短く固定）
- Next.jsは**SSG（静的配信）**を基本にし、実行時にFirebase/APIへアクセスする（CSR）。
- 「文章が消えない」を最優先：`FinalMask = Union(UserMask, SafeZone)` + 文章は最前面合成。
- 未閉/自己交差は**厳密にしない**：終点が始点に近ければスナップ、遠くても自動クローズ。
- 音はWeb Audio採用：iOSの自動再生制約を回避するため開始操作で `AudioContext.resume()` を必須化。
- アセットは差し替え前提：命名規則とサイズ基準（Base 1024）を固定する。

---

## 4. 変更管理（運用ルール）
### 4.1 バージョニング
- まずは `v0.1 → v0.2 → v1.0` のように段階的に更新
- 大きく仕様が変わったらファイル名にもバージョンを付与（例：`requirements_spec_v1.0.md`）

### 4.2 更新の優先順位（バックエンド仕様が来たら）
1. `06_frontend_api_contract_stub.md` を実仕様に合わせて更新
2. `05_acceptance_criteria_test.md` にI/Fの受け入れ基準を追記
3. 必要なら `requirements_spec...` に反映（全体整合）

---

## 5. 未確定事項（定例で潰す）
- 会員番号の扱い（Auth/OTP/番号のみ）と不正対策レベル
- 投稿文章の仕様（最大文字数、改行、フォント、行数）
- 共有URL方式（署名URL/公開URL/表示ページ）
- ガイド線形式（SVG推奨だが制作体制と相談）
- closeThreshold/近傍R/stepDistance などのパラメータ実測調整

---

## 6. 連携時に共有すると良い情報（バックエンド担当へ）
- 画像は **PNG透過**、サイズは **Base 1024×1024（暫定）**
- 送付メタ：memberId / bodhicittaId / guideVariant / canvasBaseSize
- アップロードの冪等性（同じ操作の二重送信対策）をどうするか

---

## 7. 次に追加すると有用な資料（任意）
- UIワイヤー（Figma or 画像）
- 端末別の確認チェックリスト（iOS/Android）
- パラメータチューニングのログ（closeThreshold/R/stepDistance）
