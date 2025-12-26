'use client';

import { Main } from '@/components/Main';
import { bodaiList } from '@/data/bodaiList';
import iconRice from '@/assets/img/icon_rice.png'; // Mock icon

export default function DebugPage() {
  const mockPhraseData = {
    lang: 'ja',
    myPhrase: {
      bodai: 5, // 稲穂
      text1:
        '今年は自分から出会い、心を開く大切さを教えていただきました！\n\n来年も頑張ります！',
      name: '岡田 昇陽',
      branch: 3, // 東京本部
    },
  };

  return (
    <Main
      phraseData={mockPhraseData}
      bodai={bodaiList}
      mid="99999999"
      spot="51"
      showDebugControls
    />
  );
}
