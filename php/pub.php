<?php
/**
 * 画像アップロード中継サーバー
 *
 * 1. フロントから画像を受け取って保存
 * 2. 画像のURLを生成
 * 3. ar.rashinbanban.jp/pub.php にURLとメタデータを送信
 *
 * PHP 5.3+ 互換
 */
// デバッグ用: リクエスト到達確認ログ
file_put_contents('/tmp/pub_debug.log', date('Y-m-d H:i:s') . " Request received: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);

// エラー設定（JSONレスポンスを壊さないように表示は抑止し、ログへ出力）
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/pub_error.log');

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

// 設定
$uploadDir = __DIR__ . '/uploads/';  // 画像保存ディレクトリ
$baseUrl = 'https://rashinbanban.jp/2026/installation/api/uploads/';  // 公開URL
$targetUrl = 'https://ar.rashinbanban.jp/pub.php';  // 転送先

// アップロードディレクトリがなければ作成
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// cURLが有効か確認
if (!function_exists('curl_init')) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(array('success' => false, 'error' => 'cURL is not available'));
    exit;
}

// POSTデータを取得
$mid = isset($_POST['mid']) ? $_POST['mid'] : '';
$name = isset($_POST['name']) ? $_POST['name'] : '';
$bodai = isset($_POST['bodai']) ? $_POST['bodai'] : '';
$spot = isset($_POST['spot']) ? $_POST['spot'] : '';

// 必須パラメータチェック（"0" を空扱いしない）
if ($mid === '' || $bodai === '' || $spot === '') {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(array('success' => false, 'error' => 'Missing required parameters (mid, bodai, spot)'));
    exit;
}

// 画像を保存
$imageUrl = '';
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    // ファイル名を生成（mid_タイムスタンプ.png）
    $filename = $mid . '_' . time() . '.png';
    $filepath = $uploadDir . $filename;

    // 画像を保存
    if (move_uploaded_file($_FILES['image']['tmp_name'], $filepath)) {
        $imageUrl = $baseUrl . $filename;
        file_put_contents('/tmp/pub_debug.log', date('Y-m-d H:i:s') . " Image saved: " . $filepath . "\n", FILE_APPEND);
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(array('success' => false, 'error' => 'Failed to save image'));
        exit;
    }
} else {
    header('HTTP/1.1 400 Bad Request');
    $errorCode = isset($_FILES['image']) ? $_FILES['image']['error'] : 'no file';
    echo json_encode(array('success' => false, 'error' => 'Image file is required. Error: ' . $errorCode));
    exit;
}

// ar.rashinbanban.jp/pub.php に送信するデータ
$postData = array(
    'mid' => $mid,
    'name' => $name,
    'bodai' => $bodai,
    'spot' => $spot,
    'url' => $imageUrl,
    'time' => date('Y/m/d H:i:s')
);

// ---------------------------------------------------------
// クライアントへ早期レスポンス（アニメーション開始用）
// ---------------------------------------------------------
ignore_user_abort(true); // クライアントが切断しても処理を継続
set_time_limit(0);       // タイムアウト無効化

$responseToClient = array(
    'success' => true,
    'imageUrl' => $imageUrl,
    'debugVersion' => '2025-12-31-async-v2'
);
$jsonResponse = json_encode($responseToClient, JSON_UNESCAPED_UNICODE);

// バッファリング設定のクリア
if (function_exists('apache_setenv')) {
    apache_setenv('no-gzip', 1);
}
ini_set('zlib.output_compression', 0);
ini_set('output_buffering', 'Off');
ini_set('implicit_flush', 1);

// 既存のバッファを全てクリア
while (ob_get_level() > 0) {
    ob_end_clean();
}

// レスポンスヘッダー送信
header('Content-Type: application/json; charset=utf-8');
header('Connection: close');
header('Content-Encoding: none');
header('Content-Length: ' . strlen($jsonResponse));

// レスポンス出力
echo $jsonResponse;

// 強制フラッシュ
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    flush();
    // 一部のサーバー構成向けにダミーデータを出力してバッファを押し出す（必要であれば）
    // echo str_repeat(' ', 4096); 
    // flush();
}

// ---------------------------------------------------------
// 以下、バックグラウンド処理（クライアントは待機しない）
// ---------------------------------------------------------

file_put_contents(
    '/tmp/pub_debug.log',
    date('Y-m-d H:i:s') . " [BG] Response sent & closed. Starting background task. Data: " . json_encode($postData, JSON_UNESCAPED_UNICODE) . "\n",
    FILE_APPEND
);

// 7秒待機（spot=0以外の場合）
if ($spot == 0) {
    sleep(0);
} else {
    sleep(7);
}

// cURLで転送
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// 結果をログに記録
$logEntry = date('Y-m-d H:i:s') . " [BG] AR Server Response: Code=$httpCode, Error=" . ($error ? $error : 'None') . ", Response=$response\n";
file_put_contents('/tmp/pub_debug.log', $logEntry, FILE_APPEND);

exit;