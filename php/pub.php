<?php
/**
 * 画像アップロードプロキシ
 *
 * クライアント(HTTPS) → このプロキシ → ar.rashinbanban.jp(HTTP)
 * Mixed Contentエラーを回避するためのプロキシスクリプト
 *
 * PHP 5.3+ 互換
 */

// エラー表示を抑制（本番環境向け）
error_reporting(0);

// ヘッダー設定
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// プリフライトリクエストへの対応
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit;
}

// POSTリクエストのみ許可
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(array('success' => false, 'error' => 'Method not allowed'));
    exit;
}

// 転送先URL
$targetUrl = 'http://ar.rashinbanban.jp/pub.php';

// cURLが有効か確認
if (!function_exists('curl_init')) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(array('success' => false, 'error' => 'cURL is not available'));
    exit;
}

// POSTデータを準備
$postData = array();
foreach ($_POST as $key => $value) {
    $postData[$key] = $value;
}

// ファイルがあれば追加（PHP 5.5+ と 5.3/5.4 の両方に対応）
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    if (class_exists('CURLFile')) {
        // PHP 5.5+
        $postData['image'] = new CURLFile(
            $_FILES['image']['tmp_name'],
            $_FILES['image']['type'] ? $_FILES['image']['type'] : 'image/png',
            $_FILES['image']['name'] ? $_FILES['image']['name'] : 'cutout.png'
        );
    } else {
        // PHP 5.3/5.4 (deprecated @ prefix)
        $postData['image'] = '@' . $_FILES['image']['tmp_name']
            . ';type=' . ($_FILES['image']['type'] ? $_FILES['image']['type'] : 'image/png')
            . ';filename=' . ($_FILES['image']['name'] ? $_FILES['image']['name'] : 'cutout.png');
    }
}

// cURLで転送
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// PHP 5.5以下では SAFE_UPLOAD を無効にする必要がある場合
if (version_compare(PHP_VERSION, '5.5.0', '>=') && version_compare(PHP_VERSION, '5.6.0', '<')) {
    curl_setopt($ch, CURLOPT_SAFE_UPLOAD, false);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// エラーハンドリング
if ($error) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(array('success' => false, 'error' => 'Connection failed: ' . $error));
    exit;
}

// レスポンスをそのまま返す
if ($httpCode >= 400) {
    header('HTTP/1.1 ' . $httpCode);
}
echo $response;
