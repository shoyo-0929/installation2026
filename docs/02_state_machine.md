# 状態遷移図（画面・キャンバス） v0.1

## 1. 画面遷移（3画面）
```mermaid
stateDiagram-v2
  [*] --> Top
  Top --> Canvas: 菩提心選択 + 文章取得成功 + 開始
  Canvas --> Top: 戻る（選択画面へ）
  Canvas --> Done: 完了（生成→アップロード開始）
  Done --> Canvas: もう一度作る
  Done --> Top: 別の菩提心で作る
```
※「文章取得失敗」はTop内のエラー状態で扱う（再試行）。

## 2. キャンバス操作状態（指なぞり＋10秒再開）
```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Drawing: pointerdown
  Drawing --> Drawing: pointermove（点列追加）
  Drawing --> Hold: pointerup（保留開始）
  Hold --> Drawing: pointerdown & 近傍判定OK（継続）
  Hold --> Reset: pointerdown & 近傍判定NG（リセット）
  Hold --> Reset: 10秒タイムアウト
  Reset --> Idle: クリア/内部初期化
  Drawing --> Reset: クリア
  Idle --> Generating: 完了（生成処理）
  Drawing --> Generating: 完了（生成処理）
  Generating --> Uploading: Blob生成成功
  Generating --> Error: 生成失敗
  Uploading --> Completed: アップロード成功
  Uploading --> Error: アップロード失敗
  Error --> Idle: リトライ/クリア
  Completed --> [*]
```

## 3. 近傍判定（継続条件）
- 10秒以内の再タッチ時、再タッチ位置が「前回終点」近傍なら継続
- 近傍半径R（暫定）：30px（Base 1024基準でスケール）

---

## 4. 実装メモ（バグ予防）
- `Hold` 中に「戻る」や「完了」を押された場合の優先順位を決める
  - 推奨：完了は `Drawing/Hold` どちらでも可能（自動クローズ）
- `pointercancel`（電話/通知/スクロール介入）を `pointerup` 相当に扱う
