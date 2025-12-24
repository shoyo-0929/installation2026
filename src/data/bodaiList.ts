import type { Bodai } from '@/types/bodai';

import iconRice from '@/assets/img/icon_rice.png';
import iconFire from '@/assets/img/icon_fire.png';
import iconEarth from '@/assets/img/icon_earth.png';
import iconKannon from '@/assets/img/icon_kannon.png';
import iconMoon from '@/assets/img/icon_moon.png';
import iconMountain from '@/assets/img/icon_mountain.png';
import iconRiver from '@/assets/img/icon_river.png';
import iconSea from '@/assets/img/icon_sea.png';
import iconSky from '@/assets/img/icon_sky.png';
import iconSpring from '@/assets/img/icon_spring.png';
import iconSun from '@/assets/img/icon_sun.png';
import iconWind from '@/assets/img/icon_wind.png';

import bgInaho from '@/assets/img/bg_inaho.png';
import bgHi from '@/assets/img/bg_hi.png';
import bgDaichi from '@/assets/img/bg_daichi.png';
import bgKannon from '@/assets/img/bg_kannon.png';
import bgTsuki from '@/assets/img/bg_tsuki.png';
import bgYama from '@/assets/img/bg_yama.png';
import bgKawa from '@/assets/img/bg_kawa.png';
import bgUmi from '@/assets/img/bg_umi.png';
import bgSora from '@/assets/img/bg_sora.png';
import bgIzumi from '@/assets/img/bg_izumi.png';
import bgTaiyo from '@/assets/img/bg_taiyo.png';
import bgKaze from '@/assets/img/bg_kaze.png';

import guideInaho01 from '@/assets/img/guide_inaho-01.svg';

export const bodaiList: Bodai[] = [
  {
    id: 1,
    name: '月',
    img: iconMoon,
    bgColor: 'bg-gradient-to-b from-[#e6eeff] to-[#ffffff]',
    textColor: 'text-[#373174]',
    bgImg: bgTsuki,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 2,
    name: '火',
    img: iconFire,
    bgColor: 'bg-gradient-to-b from-[#ffcccc] to-[#ffffff]',
    textColor: 'text-[#891700]',
    bgImg: bgHi,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 3,
    name: '空',
    img: iconSky,
    bgColor: 'bg-gradient-to-b from-[#d9f2ff] to-[#ffffff]',
    textColor: 'text-[#004989]',
    bgImg: bgSora,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 4,
    name: '山',
    img: iconMountain,
    bgColor: 'bg-gradient-to-b from-[#d9f2d9] to-[#ffffff]',
    textColor: 'text-[#005E27]',
    bgImg: bgYama,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 5,
    name: '稲穂',
    img: iconRice,
    bgColor: 'bg-gradient-to-b from-[#f2e6d9] to-[#ffffff]',
    textColor: 'text-[#7C5C35]',
    bgImg: bgInaho,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 6,
    name: '泉',
    img: iconSpring,
    bgColor: 'bg-gradient-to-b from-[#ccffe6] to-[#ffffff]',
    textColor: 'text-[#135699]',
    bgImg: bgIzumi,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 7,
    name: '川',
    img: iconRiver,
    bgColor: 'bg-gradient-to-b from-[#d9e6f2] to-[#ffffff]',
    textColor: 'text-[#004C72]',
    bgImg: bgKawa,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 8,
    name: '大地',
    img: iconEarth,
    bgColor: 'bg-gradient-to-b from-[#e6ccb3] to-[#ffffff]',
    textColor: 'text-[#683927]',
    bgImg: bgDaichi,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 9,
    name: '観音',
    img: iconKannon,
    bgColor: 'bg-gradient-to-b from-[#ffe6f2] to-[#ffffff]',
    textColor: 'text-[#680052]',
    bgImg: bgKannon,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 10,
    name: '風',
    img: iconWind,
    bgColor: 'bg-gradient-to-b from-[#e6ffe6] to-[#ffffff]',
    textColor: 'text-[#00450C]',
    bgImg: bgKaze,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 11,
    name: '海',
    img: iconSea,
    bgColor: 'bg-gradient-to-b from-[#cce6ff] to-[#ffffff]',
    textColor: 'text-[#261660]',
    bgImg: bgUmi,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
  {
    id: 12,
    name: '太陽',
    img: iconSun,
    bgColor: 'bg-gradient-to-b from-[#ffffcc] to-[#ffffff]',
    textColor: 'text-[#802200]',
    bgImg: bgTaiyo,
    guide: [guideInaho01, guideInaho01, guideInaho01],
  },
];
