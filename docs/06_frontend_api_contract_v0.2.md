# フロント⇄API インターフェース仕様（暫定） v0.2

作成日: 2025-12-16  
ステータス: **検討段階の仕様（バックエンド共有情報を反映）**  
対象: 「切り取るサイト（フロント）」が利用するAPI/アップロード手順

---

## 1. 前提
- フロントは Next.js（SSG）想定。ページは静的配信し、実行時にAPIへアクセスする（CSR）。
- 会員番号（`mid`）でログイン/投稿取得を行う。
- 最終画像（PNG透過想定）は、**まずPHPにアップロードしてURLを取得**し、そのURLを **sendPhrase2** に送る流れ。

---

## 2. ログイン（既存）
### 2.1 エンドポイント
- `GET https://queryname2-77mwry67iq-an.a.run.app/?mid=99999999`

### 2.2 応答（JSON）
`Content-Type: application/json`
```json
{
  "mid": "99999999",
  "name": "氏名",
  "branch": 0,
  "bodai": 1
}
```
- `branch`: 0 - 9
- `bodai`: 1 - 12

### 2.3 エラー
- 会員番号（mid）が存在しない場合：**HTTP 401**

### 2.4 未確定（検討）
- 生年月日チェックを追加するか？（追加する場合、フロント画面/入力項目が増えるため早期確定推奨）

---

## 3. 投稿を取得（既存）
### 3.1 エンドポイント
- `GET https://printmyphrase-77mwry67iq-an.a.run.app/?mid=99999999`

### 3.2 応答（JSON）
`Content-Type: application/json`
```json
{
  "lang": "ja",
  "myPhrase": {
    "bodai": 1,
    "text1": "投稿内容",
    "name": "氏名",
    "branch": 0
  }
}
```
- `lang`: `"ja"` / `"en"` / `"pt"`
- `myPhrase.bodai`: 1 - 12
- `myPhrase.text1`: 投稿内容（本文）
- `myPhrase.name`: 氏名
- `myPhrase.branch`: 0 - 9

### 3.3 エラー
- 投稿がない場合：**HTTP 400**

---

## 4. 画像を送信（アップロード＋送信API）
### 4.1 ステップ1：PNGをPHPへアップロードしてURLを取得
- 配置候補：`cloud2` / `rashinbanban.jp` / `xserver` など
- フロントは **PHPへPOSTしてPNGファイルをアップロード**し、**画像URLを受け取る**

> ※PHPの具体的なURL、リクエスト形式（multipart/form-data など）、返却JSONの形は別仕様（または実装）に合わせる。  
> フロント側では「最終的にURLが返る」ことを前提に、アップロード失敗時の再試行UIを用意する。

### 4.2 ステップ2：sendPhrase2（新規）に mid / spot / url を送る
#### 4.2.1 エンドポイント
- **sendPhrase2（新規）**：URL未確定（バックエンド提示待ち）

#### 4.2.2 リクエスト（暫定）
- Method: `POST`
- Body: `mid`, `spot`, `url`

**送信項目**
- `mid`: 会員番号
- `spot`: 「中京かどうか」を表す値（型は未確定）
  - 例：boolean（true/false）または enum/string など
- `url`: アップロード済み画像のURL（PHPが返したURL）

> ※`spot` の型・値の定義（例：`0/1` なのか、`"chukyo"/"other"` なのか）を早めに確定する必要あり。

---

## 5. フロント側で固定しておく送信データ仕様
（バックエンド・PHPアップロード側の制約と合わせて調整）

- 画像形式：PNG（透過）
- 画像サイズ：Base 1024×1024（暫定）
- 生成方法：Canvas → `toBlob("image/png")`

---

## 6. 実装メモ（フロント）
- 401（ログイン失敗）→ 会員番号の再入力、（もし追加なら）生年月日の再入力導線
- 400（投稿なし）→ 投稿がないことを明示し、終了/戻る導線
- アップロード→sendPhrase2 までを **一連のトランザクション**として扱い、途中失敗時にリトライできるUIを用意
- 二重送信防止：アップロード中/送信中はボタン非活性、または冪等性キー（バックエンドと相談）

---

## 7. TODO（バックエンド担当に確認して反映する項目）
- sendPhrase2 のURL/メソッド/Content-Type（JSON or form）
- PHPアップロードのURL/形式/返却JSON（例：`{"url":"..."}`）
- `spot` の型と取り得る値
- CORS（必要オリジン）
- 画像サイズ上限・容量上限・圧縮要否
