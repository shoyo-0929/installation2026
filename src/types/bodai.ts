import type { StaticImageData } from 'next/image';

export interface Bodai {
  id: number;
  name: string;
  img: StaticImageData;
  bgColor: string;
  textColor: string;
  bgImg: StaticImageData;
  guide: StaticImageData[];
}
