<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'success' => true,
    'message' => 'PHP is working',
    'method' => $_SERVER['REQUEST_METHOD'],
    'php_version' => PHP_VERSION,
    'curl_enabled' => function_exists('curl_init'),
    'post_max_size' => ini_get('post_max_size'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
], JSON_UNESCAPED_UNICODE);
