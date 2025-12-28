/**
 * 画像アップロード API（開発用モック）
 *
 * 本番環境では PHP サーバーがこのエンドポイントを担当する。
 * このモックは開発中のテスト用途で使用する。
 */
import { NextRequest, NextResponse } from 'next/server';

/**
 * 切り抜き画像（Blob）を受信し、アップロード処理（モック）を行う
 *
 * 受け取るフォームデータ:
 * - image: 画像ファイル（必須）
 * - mid: 会員番号（必須）
 * - name: 氏名
 * - bodai: 菩提ID（必須）
 * - spot: 会場コード（必須）
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // フォームデータからフィールドを取得
    const image = formData.get('image') as File | null;
    const mid = formData.get('mid') as string | null;
    const name = formData.get('name') as string | null;
    const bodai = formData.get('bodai') as string | null;
    const spot = formData.get('spot') as string | null;

    // 受信データをサーバーログに出力（デバッグ用）
    console.log('='.repeat(60));
    console.log('[Upload API] 画像アップロードリクエスト受信');
    console.log('='.repeat(60));
    console.log('  mid   :', mid);
    console.log('  name  :', name);
    console.log('  bodai :', bodai);
    console.log('  spot  :', spot);
    console.log(
      '  image :',
      image ? `${image.name} (${image.size} bytes, ${image.type})` : 'なし'
    );
    console.log('='.repeat(60));

    // バリデーション: 必須項目チェック
    if (!image) {
      return NextResponse.json(
        { success: false, error: '画像ファイルが必要です' },
        { status: 400 }
      );
    }

    if (!mid || !bodai || !spot) {
      return NextResponse.json(
        {
          success: false,
          error: '必須パラメータが不足しています (mid, bodai, spot)',
        },
        { status: 400 }
      );
    }

    // 開発用モック処理:
    // 実際にはここで PHP サーバーへの転送や、クラウドストレージへの保存を行う。
    // 今回は成功レスポンスのみを返す。

    // モック成功レスポンス
    const mockImageUrl = `https://storage.example.com/installation2026/${mid}_${Date.now()}.png`;

    console.log('[Upload API] 処理完了');
    console.log('  mockImageUrl:', mockImageUrl);
    console.log('='.repeat(60));

    return NextResponse.json({
      success: true,
      message: '画像のアップロードが完了しました（開発用モック）',
      imageUrl: mockImageUrl,
    });
  } catch (error) {
    console.error('[Upload API] エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'サーバーエラー',
      },
      { status: 500 }
    );
  }
}
