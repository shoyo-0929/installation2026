/**
 * サウンド管理ユーティリティ
 *
 * 効果音をプリロードして再生するためのモジュール
 */

/** ベースパスを取得（本番環境では /2026/installation） */
function getBasePath(): string {
  return process.env.NODE_ENV === 'production' ? '/2026/installation' : '';
}

/** プリロード済みの音声インスタンス */
let btnNextAudio: HTMLAudioElement | null = null;
let mainRaiseAudio: HTMLAudioElement | null = null;
let mainTouchAudio: HTMLAudioElement | null = null;
let mainDoneAudio: HTMLAudioElement | null = null;

/**
 * 音声をプリロードする
 * アプリ起動時に一度だけ呼び出す
 */
export function preloadSounds() {
  if (typeof window === 'undefined') return;

  const basePath = getBasePath();

  btnNextAudio = new Audio(`${basePath}/audio/btn_next.wav`);
  btnNextAudio.preload = 'auto';

  mainRaiseAudio = new Audio(`${basePath}/audio/main_raise.wav`);
  mainRaiseAudio.preload = 'auto';

  mainTouchAudio = new Audio(`${basePath}/audio/main_touch.wav`);
  mainTouchAudio.preload = 'auto';
  mainTouchAudio.loop = true; // タッチ中はループ再生

  mainDoneAudio = new Audio(`${basePath}/audio/main_done.wav`);
  mainDoneAudio.preload = 'auto';
}

/**
 * 上に上がるアニメーションの効果音を再生する
 */
export function playRaiseSound() {
  if (mainRaiseAudio) {
    mainRaiseAudio.currentTime = 0;
    mainRaiseAudio.play().catch(() => {});
  }
}

/**
 * 線を描いてタッチしている時の効果音を開始する
 */
export function startTouchSound() {
  if (mainTouchAudio) {
    mainTouchAudio.currentTime = 0;
    mainTouchAudio.play().catch(() => {});
  }
}

/**
 * タッチ中の効果音を停止する
 */
export function stopTouchSound() {
  if (mainTouchAudio) {
    mainTouchAudio.pause();
    mainTouchAudio.currentTime = 0;
  }
}

/**
 * やり直しモーダル表示時の効果音を再生する
 */
export function playDoneSound() {
  console.log('playDoneSound called, mainDoneAudio:', mainDoneAudio);
  if (mainDoneAudio) {
    mainDoneAudio.currentTime = 0;
    mainDoneAudio.play().catch((e) => console.error('playDoneSound error:', e));
  }
}
