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

import bgInaho01 from '@/assets/img/bg_inaho01.png';
import bgInaho02 from '@/assets/img/bg_inaho02.png';
import bgInaho03 from '@/assets/img/bg_inaho03.png';
import bgHi01 from '@/assets/img/bg_hi01.png';
import bgHi02 from '@/assets/img/bg_hi02.png';
import bgHi03 from '@/assets/img/bg_hi03.png';
import bgDaichi01 from '@/assets/img/bg_daichi01.png';
import bgDaichi02 from '@/assets/img/bg_daichi02.png';
import bgDaichi03 from '@/assets/img/bg_daichi03.png';
import bgKannon01 from '@/assets/img/bg_kannon01.png';
import bgKannon02 from '@/assets/img/bg_kannon02.png';
import bgKannon03 from '@/assets/img/bg_kannon03.png';
import bgTsuki01 from '@/assets/img/bg_tsuki01.png';
import bgTsuki02 from '@/assets/img/bg_tsuki02.png';
import bgTsuki03 from '@/assets/img/bg_tsuki03.png';
import bgYama01 from '@/assets/img/bg_yama01.png';
import bgYama02 from '@/assets/img/bg_yama02.png';
import bgYama03 from '@/assets/img/bg_yama03.png';
import bgKawa01 from '@/assets/img/bg_kawa01.png';
import bgKawa02 from '@/assets/img/bg_kawa02.png';
import bgKawa03 from '@/assets/img/bg_kawa03.png';
import bgUmi01 from '@/assets/img/bg_umi01.png';
import bgUmi02 from '@/assets/img/bg_umi02.png';
import bgUmi03 from '@/assets/img/bg_umi03.png';
import bgSora01 from '@/assets/img/bg_sora01.png';
import bgSora02 from '@/assets/img/bg_sora02.png';
import bgSora03 from '@/assets/img/bg_sora03.png';
import bgIzumi01 from '@/assets/img/bg_izumi01.png';
import bgIzumi02 from '@/assets/img/bg_izumi02.png';
import bgIzumi03 from '@/assets/img/bg_izumi03.png';
import bgTaiyo01 from '@/assets/img/bg_taiyo01.png';
import bgTaiyo02 from '@/assets/img/bg_taiyo02.png';
import bgTaiyo03 from '@/assets/img/bg_taiyo03.png';
import bgKaze01 from '@/assets/img/bg_kaze01.png';
import bgKaze02 from '@/assets/img/bg_kaze02.png';
import bgKaze03 from '@/assets/img/bg_kaze03.png';

import guideInaho01 from '@/assets/img/guide_inaho-01.svg';
import guideInaho02 from '@/assets/img/guide_inaho-02.svg';
import guideInaho03 from '@/assets/img/guide_inaho-03.svg';
import guideHi01 from '@/assets/img/guide_hi-01.svg';
import guideHi02 from '@/assets/img/guide_hi-02.svg';
import guideHi03 from '@/assets/img/guide_hi-03.svg';
import guideDaichi01 from '@/assets/img/guide_daichi-01.svg';
import guideDaichi02 from '@/assets/img/guide_daichi-02.svg';
import guideDaichi03 from '@/assets/img/guide_daichi-03.svg';
import guideKannon01 from '@/assets/img/guide_kannon-01.svg';
import guideKannon02 from '@/assets/img/guide_kannon-02.svg';
import guideKannon03 from '@/assets/img/guide_kannon-03.svg';
import guideTsuki01 from '@/assets/img/guide_tsuki-01.svg';
import guideTsuki02 from '@/assets/img/guide_tsuki-02.svg';
import guideTsuki03 from '@/assets/img/guide_tsuki-03.svg';
import guideYama01 from '@/assets/img/guide_yama-01.svg';
import guideYama02 from '@/assets/img/guide_yama-02.svg';
import guideYama03 from '@/assets/img/guide_yama-03.svg';
import guideKawa01 from '@/assets/img/guide_kawa-01.svg';
import guideKawa02 from '@/assets/img/guide_kawa-02.svg';
import guideKawa03 from '@/assets/img/guide_kawa-03.svg';
import guideUmi01 from '@/assets/img/guide_umi-01.svg';
import guideUmi02 from '@/assets/img/guide_umi-02.svg';
import guideUmi03 from '@/assets/img/guide_umi-03.svg';
import guideSora01 from '@/assets/img/guide_sora-01.svg';
import guideSora02 from '@/assets/img/guide_sora-02.svg';
import guideSora03 from '@/assets/img/guide_sora-03.svg';
import guideIzumi01 from '@/assets/img/guide_izumi-01.svg';
import guideIzumi02 from '@/assets/img/guide_izumi-02.svg';
import guideIzumi03 from '@/assets/img/guide_izumi-03.svg';
import guideTaiyo01 from '@/assets/img/guide_taiyo-01.svg';
import guideTaiyo02 from '@/assets/img/guide_taiyo-02.svg';
import guideTaiyo03 from '@/assets/img/guide_taiyo-03.svg';
import guideKaze01 from '@/assets/img/guide_kaze-01.svg';
import guideKaze02 from '@/assets/img/guide_kaze-02.svg';
import guideKaze03 from '@/assets/img/guide_kaze-03.svg';

export const bodaiList: Bodai[] = [
  {
    id: 1,
    name: '月',
    img: iconMoon,
    bgColor: 'bg-gradient-to-b from-[#e6eeff] to-[#ffffff]',
    textColor: 'text-[#373174]',
    bgImg: [bgTsuki01, bgTsuki02, bgTsuki03],
    guide: [guideTsuki01, guideTsuki02, guideTsuki03],
  },
  {
    id: 2,
    name: '火',
    img: iconFire,
    bgColor: 'bg-gradient-to-b from-[#ffcccc] to-[#ffffff]',
    textColor: 'text-[#891700]',
    bgImg: [bgHi01, bgHi02, bgHi03],
    guide: [guideHi01, guideHi02, guideHi03],
  },
  {
    id: 3,
    name: '空',
    img: iconSky,
    bgColor: 'bg-gradient-to-b from-[#d9f2ff] to-[#ffffff]',
    textColor: 'text-[#004989]',
    bgImg: [bgSora01, bgSora02, bgSora03],
    guide: [guideSora01, guideSora02, guideSora03],
  },
  {
    id: 4,
    name: '山',
    img: iconMountain,
    bgColor: 'bg-gradient-to-b from-[#d9f2d9] to-[#ffffff]',
    textColor: 'text-[#005E27]',
    bgImg: [bgYama01, bgYama02, bgYama03],
    guide: [guideYama01, guideYama02, guideYama03],
  },
  {
    id: 5,
    name: '稲穂',
    img: iconRice,
    bgColor: 'bg-gradient-to-b from-[#f2e6d9] to-[#ffffff]',
    textColor: 'text-[#7C5C35]',
    bgImg: [bgInaho01, bgInaho02, bgInaho03],
    guide: [guideInaho01, guideInaho02, guideInaho03],
  },
  {
    id: 6,
    name: '泉',
    img: iconSpring,
    bgColor: 'bg-gradient-to-b from-[#ccffe6] to-[#ffffff]',
    textColor: 'text-[#135699]',
    bgImg: [bgIzumi01, bgIzumi02, bgIzumi03],
    guide: [guideIzumi01, guideIzumi02, guideIzumi03],
  },
  {
    id: 7,
    name: '川',
    img: iconRiver,
    bgColor: 'bg-gradient-to-b from-[#d9e6f2] to-[#ffffff]',
    textColor: 'text-[#004C72]',
    bgImg: [bgKawa01, bgKawa02, bgKawa03],
    guide: [guideKawa01, guideKawa02, guideKawa03],
  },
  {
    id: 8,
    name: '大地',
    img: iconEarth,
    bgColor: 'bg-gradient-to-b from-[#e6ccb3] to-[#ffffff]',
    textColor: 'text-[#683927]',
    bgImg: [bgDaichi01, bgDaichi02, bgDaichi03],
    guide: [guideDaichi01, guideDaichi02, guideDaichi03],
  },
  {
    id: 9,
    name: '観音',
    img: iconKannon,
    bgColor: 'bg-gradient-to-b from-[#ffe6f2] to-[#ffffff]',
    textColor: 'text-[#680052]',
    bgImg: [bgKannon01, bgKannon02, bgKannon03],
    guide: [guideKannon01, guideKannon02, guideKannon03],
  },
  {
    id: 10,
    name: '風',
    img: iconWind,
    bgColor: 'bg-gradient-to-b from-[#e6ffe6] to-[#ffffff]',
    textColor: 'text-[#00450C]',
    bgImg: [bgKaze01, bgKaze02, bgKaze03],
    guide: [guideKaze01, guideKaze02, guideKaze03],
  },
  {
    id: 11,
    name: '海',
    img: iconSea,
    bgColor: 'bg-gradient-to-b from-[#cce6ff] to-[#ffffff]',
    textColor: 'text-[#261660]',
    bgImg: [bgUmi01, bgUmi02, bgUmi03],
    guide: [guideUmi01, guideUmi02, guideUmi03],
  },
  {
    id: 12,
    name: '太陽',
    img: iconSun,
    bgColor: 'bg-gradient-to-b from-[#ffffcc] to-[#ffffff]',
    textColor: 'text-[#802200]',
    bgImg: [bgTaiyo01, bgTaiyo02, bgTaiyo03],
    guide: [guideTaiyo01, guideTaiyo02, guideTaiyo03],
  },
];
