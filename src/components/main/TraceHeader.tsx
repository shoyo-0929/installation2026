import NextImage from 'next/image';
import iconOperation from '@/assets/img/icon_operation.svg';

export function TraceHeader() {
  return (
    <>
      {/* <div className="bg-[rgba(255,244,98,0.6)] rounded-[13px] py-4 mb-6 w-[95%]">
        <p
          style={{ fontSize: sizeClamp(16, 18, 390, 1206) }}
          className="text-center font-medium text-black"
        >
          「{bodaiName}の心」を育む中で、頂いた功徳を
          <br />
          アートスペースに送りましょう！
        </p>
      </div> */}

      <div className="flex items-center gap-3 mt-6 mb-4 w-full px-4 ">
        <p className="font-bold text-[18px] text-black leading-normal flex-1">
          想いを込めて、功徳をぐるっと囲う形を描いてみましょう。あなたの功徳が、描いた形で型取られ、アートスペースに送られます！
        </p>
        <div className="relative w-[103px] h-[120px] shrink-0">
          <NextImage
            src={iconOperation}
            alt="操作説明"
            fill
            sizes="103px"
            className="object-contain"
          />
        </div>
      </div>
    </>
  );
}
