import type { Bodai } from '@/types/bodai';
import type { TracePoint } from '@/components/canvas/TraceCanvas';
import { branchList } from '@/data/branchList';
import { BASE_CANVAS_SIZE, TRACE_STROKE_WIDTH } from './trace-utils';

type GenerateImageOptions = {
  currentBodai: Bodai;
  bgImageIndex: number;
  points: TracePoint[];
  phraseLines: string[];
  myPhrase: { name?: string; branch: number };
  iconElement: HTMLElement | null;
  bodyElement: HTMLElement | null;
  nameElement: HTMLElement | null;
  branchElement: HTMLElement | null;
  scale: number;
  toBaseRect: (rect: DOMRect) => {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous'; // Important for canvas export
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    image.src = src;
  });

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
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = BASE_CANVAS_SIZE;
  maskCanvas.height = BASE_CANVAS_SIZE;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Cannot get mask context');

  maskCtx.fillStyle = '#000';
  maskCtx.strokeStyle = '#000';
  maskCtx.lineJoin = 'round';
  maskCtx.lineCap = 'round';
  maskCtx.lineWidth = TRACE_STROKE_WIDTH;

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
    maskCtx.fill('evenodd');
    maskCtx.stroke();
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = BASE_CANVAS_SIZE;
  outputCanvas.height = BASE_CANVAS_SIZE;
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('Cannot get output context');

  const backgroundImage = await loadImage(currentBodai.bgImg[bgImageIndex].src);
  outputCtx.clearRect(0, 0, BASE_CANVAS_SIZE, BASE_CANVAS_SIZE);
  outputCtx.drawImage(
    backgroundImage,
    0,
    0,
    BASE_CANVAS_SIZE,
    BASE_CANVAS_SIZE
  );

  outputCtx.globalCompositeOperation = 'destination-in';
  outputCtx.drawImage(maskCanvas, 0, 0);
  outputCtx.globalCompositeOperation = 'source-over';

  if (iconElement) {
    const rect = toBaseRect(iconElement.getBoundingClientRect());
    const iconImage = await loadImage(currentBodai.img.src);
    outputCtx.drawImage(iconImage, rect.x, rect.y, rect.width, rect.height);
  }

  const drawLines = (element: HTMLElement | null, lines: string[]) => {
    if (!element || lines.length === 0) return;
    const rect = toBaseRect(element.getBoundingClientRect());
    const style = window.getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize) || 18;
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5;
    const fontWeight = style.fontWeight || '700';
    const fontFamily = style.fontFamily || 'Noto Sans JP';

    outputCtx.fillStyle = style.color;
    outputCtx.font = `${fontWeight} ${fontSize * scale}px ${fontFamily}`;
    outputCtx.textAlign = 'center';
    outputCtx.textBaseline = 'top';

    const x = rect.x + rect.width / 2;
    const scaledLineHeight = lineHeight * scale;
    const maxWidth = rect.width;

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
      outputCtx.fillText(line, x, rect.y + scaledLineHeight * index);
    });
  };

  const drawSingleLine = (element: HTMLElement | null, text: string) => {
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

    const x = rect.x + rect.width / 2;
    outputCtx.fillText(text, x, rect.y);
  };

  drawLines(bodyElement, phraseLines);
  drawSingleLine(nameElement, myPhrase.name ?? '');
  drawSingleLine(branchElement, branchList[Number(myPhrase.branch)] ?? '');

  return new Promise<string>((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        reject(new Error('Canvas to Blob failed'));
      }
    }, 'image/png');
  });
};
