import type { Bodai } from '@/types/bodai';
import type { TracePoint } from '@/lib/trace-utils';
import { branchList } from '@/data/branchList';
import { BASE_CANVAS_SIZE, TRACE_STROKE_WIDTH } from './trace-utils';

type GenerateImageOptions = {
  currentBodai: Bodai;
  bgImageIndex: number;
  points: TracePoint[];
  phraseLines: string[];
  myPhrase: { name?: string; branch: number };
  iconElement: HTMLElement | null; // アイコン（稲穂など）のDOM要素
  bodyElement: HTMLElement | null; // 投稿本文のDOM要素
  nameElement: HTMLElement | null; // 氏名のDOM要素
  branchElement: HTMLElement | null; // 支部名のDOM要素
  scale: number; // 画面上の表示サイズと基準サイズ（1024px）の比率
  toBaseRect: (rect: DOMRect) => {
    // 画面上のDOM矩形を基準サイズの座標系に変換する関数
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

/**
 * 画像を読み込み、HTMLImageElementを返すユーティリティ
 * Canvas汚染を防ぐため crossOrigin='anonymous' を設定
 */
const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous'; // Important for canvas export
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    image.src = src;
  });

/**
 * 最終的な合成画像を生成する関数
 *
 * 処理の流れ:
 * 1. マスク画像の作成（トレースしたパスで塗りつぶし）
 * 2. 背景画像をキャンバスに描画
 * 3. マスク画像を使って背景を切り抜き（Destination-In合成）
 * 4. アイコン画像の合成
 * 5. テキスト情報（本文、氏名、支部）の描画
 * 6. 生成された画像をBlob URLとして返す
 */
export const generateTraceImage = async ({
  currentBodai,
  bgImageIndex,
  points,
  phraseLines,
  myPhrase,
  iconElement,
  bodyElement,
  nameElement,
  branchElement,
  scale,
  toBaseRect,
}: GenerateImageOptions): Promise<string> => {
  // 1. マスク用キャンバスの作成
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = BASE_CANVAS_SIZE;
  maskCanvas.height = BASE_CANVAS_SIZE;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('マスク用キャンバスの取得に失敗しました');

  maskCtx.fillStyle = '#000';
  maskCtx.strokeStyle = '#000';
  maskCtx.lineJoin = 'round';
  maskCtx.lineCap = 'round';
  maskCtx.lineWidth = TRACE_STROKE_WIDTH;

  // トレースされたポイントを結んでパスを作成
  if (points.length > 2) {
    maskCtx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        maskCtx.moveTo(point.x, point.y);
      } else {
        maskCtx.lineTo(point.x, point.y);
      }
    });
    maskCtx.closePath();
    maskCtx.fill('evenodd'); // 中抜きを考慮してevenodd
    maskCtx.stroke();
  }

  // 2. 出力用キャンバスの作成
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = BASE_CANVAS_SIZE;
  outputCanvas.height = BASE_CANVAS_SIZE;
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('出力用キャンバスの取得に失敗しました');

  // 背景画像の読み込みと描画
  const backgroundImage = await loadImage(currentBodai.bgImg[bgImageIndex].src);
  outputCtx.clearRect(0, 0, BASE_CANVAS_SIZE, BASE_CANVAS_SIZE);
  outputCtx.drawImage(
    backgroundImage,
    0,
    0,
    BASE_CANVAS_SIZE,
    BASE_CANVAS_SIZE
  );

  // 5. テキスト情報の合成
  // テキスト描画時に、そのテキスト部分のマスク（背景保持）も同時に描画する

  // テキスト描画用のヘルパー関数（複数行対応）
  const drawLines = (
    element: HTMLElement | null,
    lines: string[],
    maskContext: CanvasRenderingContext2D
  ) => {
    if (!element || lines.length === 0) return;
    const rect = toBaseRect(element.getBoundingClientRect());
    const style = window.getComputedStyle(element);

    // スタイル情報の取得とスケーリング
    const fontSize = parseFloat(style.fontSize) || 18;
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5;
    const fontWeight = style.fontWeight || '700';
    const fontFamily = style.fontFamily || 'Noto Sans JP';

    outputCtx.fillStyle = style.color;
    outputCtx.font = `${fontWeight} ${fontSize * scale}px ${fontFamily}`;
    outputCtx.textAlign = 'center';
    outputCtx.textBaseline = 'top';

    // マスク用設定
    maskContext.fillStyle = '#000';

    const x = rect.x + rect.width / 2;
    const scaledLineHeight = lineHeight * scale;
    const maxWidth = rect.width;

    // 自動折り返し処理
    const wrappedLines: string[] = [];
    lines.forEach((line) => {
      let currentLine = '';
      for (const char of line) {
        const testLine = currentLine + char;
        const metrics = outputCtx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine !== '') {
          wrappedLines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    });

    wrappedLines.forEach((line, index) => {
      const lineY = rect.y + scaledLineHeight * index;
      outputCtx.fillText(line, x, lineY);

      // 行ごとの背景を描画（文字がある幅だけ四角く確保）
      const metrics = outputCtx.measureText(line);
      const maskPadding = 24; // 左右の余白 (スマホ画面で約8px程度に見えるように設定)
      const textWidth = metrics.width + maskPadding * 2;
      const textHeight = fontSize * scale;
      // 上下にもパディングを追加
      const rectHeight = textHeight + maskPadding * 2;

      maskContext.fillRect(
        x - textWidth / 2,
        lineY - (rectHeight - textHeight) / 2,
        textWidth,
        rectHeight
      );
    });
  };

  // テキスト描画用ヘルパー関数（単一行）
  const drawSingleLine = (
    element: HTMLElement | null,
    text: string,
    maskContext: CanvasRenderingContext2D
  ) => {
    if (!element || !text) return;
    const rect = toBaseRect(element.getBoundingClientRect());
    const style = window.getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize) || 18;
    const fontWeight = style.fontWeight || '700';
    const fontFamily = style.fontFamily || 'Noto Sans JP';

    outputCtx.fillStyle = style.color;
    outputCtx.font = `${fontWeight} ${fontSize * scale}px ${fontFamily}`;
    outputCtx.textAlign = 'center';
    outputCtx.textBaseline = 'top';

    // マスク用設定
    maskContext.fillStyle = '#000';

    const x = rect.x + rect.width / 2;
    outputCtx.fillText(text, x, rect.y);

    // 背景を描画（文字がある幅だけ四角く確保）
    const metrics = outputCtx.measureText(text);
    const maskPadding = 24; // 左右の余白
    const textWidth = metrics.width + maskPadding * 2;
    const textHeight = fontSize * scale;
    // 上下にもパディングを追加
    const rectHeight = textHeight + maskPadding * 2;

    maskContext.fillRect(
      x - textWidth / 2,
      rect.y - (rectHeight - textHeight) / 2,
      textWidth,
      rectHeight
    );
  };

  // 5. テキスト情報の合成
  drawLines(bodyElement, phraseLines, maskCtx);
  drawSingleLine(nameElement, myPhrase.name ?? '', maskCtx);
  drawSingleLine(
    branchElement,
    branchList[Number(myPhrase.branch)] ?? '',
    maskCtx
  );

  // 3. マスク処理（Traceした形 + テキスト背景 で切り抜く）
  outputCtx.globalCompositeOperation = 'destination-in';
  outputCtx.drawImage(maskCanvas, 0, 0);
  outputCtx.globalCompositeOperation = 'source-over';

  // 4. アイコンの描画（DOMの位置・サイズに合わせて配置）
  if (iconElement) {
    const rect = toBaseRect(iconElement.getBoundingClientRect());
    const iconImage = await loadImage(currentBodai.img.src);
    outputCtx.drawImage(iconImage, rect.x, rect.y, rect.width, rect.height);
  }

  // 6. 画像データの出力
  return new Promise<string>((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        reject(new Error('画像の生成に失敗しました'));
      }
    }, 'image/png');
  });
};
