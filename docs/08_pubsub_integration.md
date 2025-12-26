# Pub/Sub連携仕様書 v0.1

## 1. 概要

切り取りサイトからインスタレーションへの画像送信に、Google Cloud Pub/Subを使用する。

### 従来方式との違い

| 項目 | 従来（Firebase Realtime DB） | 新方式（Pub/Sub） |
|------|------------------------------|-------------------|
| 信頼性 | Python SDKが不安定 | 高信頼性 |
| 接続方式 | 常時接続 | メッセージキュー |
| 画像送信 | Base64直接送信? | URL経由でダウンロード |

---

## 2. システム構成

```
┌─────────────────┐
│  切り取りサイト   │
│  (Next.js)      │
└────────┬────────┘
         │ ① POST /api/upload
         │    - 画像ファイル (multipart/form-data)
         │    - メタデータ (JSON)
         ↓
┌─────────────────┐
│   Webサーバー    │
│   (PHP)         │
│                 │
│  処理:          │
│  1. 画像を保存   │
│  2. Pub/Subに発行│
└────────┬────────┘
         │ ② Publish
         │    - 画像URL
         │    - メタデータ
         ↓
┌─────────────────┐
│  Google Cloud   │
│    Pub/Sub      │
│                 │
│  Topic: inst    │
└────────┬────────┘
         │ ③ Subscribe
         ↓
┌─────────────────┐
│  TouchDesigner  │
│                 │
│  処理:          │
│  1. メッセージ受信│
│  2. URLから画像DL│
│  3. 表示        │
└─────────────────┘
```

---

## 3. APIエンドポイント仕様

### POST /api/upload（仮）

切り取りサイトから画像とメタデータを送信する。

#### リクエスト形式

**Content-Type:** `multipart/form-data`

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| `image` | File | ○ | 切り抜き画像（PNG） |
| `mid` | string | ○ | 会員番号（8桁） |
| `name` | string | ○ | 氏名 |
| `bodai` | string | ○ | 菩提心番号（1〜12） |
| `spot` | string | ○ | 場所コード |

#### リクエスト例（JavaScript）

```javascript
const formData = new FormData();
formData.append('image', imageBlob, 'cutout.png');
formData.append('mid', '12345678');
formData.append('name', '岡田 昇陽');
formData.append('bodai', '5');
formData.append('spot', '51');

const response = await fetch('https://example.com/api/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

#### レスポンス（成功時）

```json
{
  "success": true,
  "message": "Published successfully",
  "imageUrl": "https://example.com/uploads/12345678_20251226153000.png"
}
```

#### レスポンス（エラー時）

```json
{
  "success": false,
  "error": "Invalid image format"
}
```

---

## 4. Pub/Subメッセージ仕様

### Topic名
`inst`

### Project ID
`bodaishininst`

### メッセージ属性（attributes）

| 属性名 | 型 | 説明 | 例 |
|--------|-----|------|-----|
| `mid` | string | 会員番号 | `99999999` |
| `name` | string | 氏名 | `浅草 太郎` |
| `url` | string | 画像のURL | `https://...` |
| `bodai` | string | 菩提心番号（1〜12） | `1` |
| `spot` | string | 場所コード | `51` |
| `time` | string | 送信日時 | `2025/12/26 15:30:00` |

---

## 5. PHP実装（サーバー側）

### 必要なパッケージ

```bash
composer require google/cloud-pubsub
```

### 認証ファイル

`bodaishininst-a986cdd44dc0.json` をサーバーに配置。

**注意:** このファイルは秘密鍵を含むため、Gitにコミットしない。

### サンプルコード（pub.php）

```php
<?php
require 'vendor/autoload.php';

use Google\Cloud\PubSub\PubSubClient;

date_default_timezone_set('Asia/Tokyo');

// 認証ファイルのパス
$keyPath = __DIR__ . '/bodaishininst-a986cdd44dc0.json';
putenv('GOOGLE_APPLICATION_CREDENTIALS=' . $keyPath);

// Pub/Subクライアント初期化
$pubsub = new PubSubClient([
    'projectId' => 'bodaishininst',
]);

$topic = $pubsub->topic('inst');

// メッセージ発行
$topic->publish([
    'data' => '',
    'attributes' => [
        'mid' => '99999999',
        'name' => '浅草 太郎',
        'url' => 'https://example.com/uploads/image.png',
        'bodai' => '1',
        'spot' => '51',
        'time' => date("Y/m/d H:i:s"),
    ],
]);

echo "Published\n";
```

---

## 6. フロントエンド実装（Next.js側）

### 画像送信関数の例

```typescript
// src/lib/api.ts

export async function uploadCutoutImage(
  imageBlob: Blob,
  metadata: {
    mid: string;
    name: string;
    bodai: string;
    spot: string;
  }
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const formData = new FormData();
  formData.append('image', imageBlob, 'cutout.png');
  formData.append('mid', metadata.mid);
  formData.append('name', metadata.name);
  formData.append('bodai', metadata.bodai);
  formData.append('spot', metadata.spot);

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_UPLOAD_API_URL || '/api/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Main.tsxでの使用例

```typescript
const handleConfirmSubmit = useCallback(async () => {
  if (!generatedImageUrl) return;

  // Blob URLから実際のBlobを取得
  const response = await fetch(generatedImageUrl);
  const blob = await response.blob();

  // サーバーにアップロード
  const result = await uploadCutoutImage(blob, {
    mid: myPhrase.mid,
    name: myPhrase.name,
    bodai: String(displayBodaiId),
    spot: myPhrase.spot || '51',
  });

  if (result.success) {
    // 成功時の処理（完了画面へ遷移など）
    console.log('Upload successful:', result.imageUrl);
  } else {
    // エラー処理
    console.error('Upload failed:', result.error);
  }

  setPreviewOpen(false);
  setTraceReady(false);
}, [generatedImageUrl, myPhrase, displayBodaiId]);
```

---

## 7. 環境設定

### Webサーバー要件

- PHP 7.4以上
- Composer
- `google/cloud-pubsub` パッケージ
- 画像保存用ディレクトリ（書き込み権限必要）

### 環境変数（Next.js側）

```env
NEXT_PUBLIC_UPLOAD_API_URL=https://example.com/api/upload
```

---

## 8. セキュリティ考慮事項

1. **認証ファイルの保護**
   - `bodaishininst-*.json` は公開しない
   - `.gitignore` に追加

2. **アップロード制限**
   - ファイルサイズ上限（例: 5MB）
   - 許可する形式（PNG のみ）
   - レートリミット

3. **CORS設定**
   - 許可するオリジンを制限

---

## 9. TODO

- [ ] PHPの画像アップロード処理実装
- [ ] 画像保存先のURL設計
- [ ] Next.js側のAPI呼び出し実装
- [ ] エラーハンドリング
- [ ] 完了画面の実装
