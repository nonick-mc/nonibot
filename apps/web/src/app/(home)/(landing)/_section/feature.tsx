import {
  DollarSignIcon,
  HeartIcon,
  LifeBuoyIcon,
  RocketIcon,
  ServerIcon,
  WrenchIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    heading: '豊富な機能',
    description:
      '小規模なサーバーから大規模なコミュニティまで、幅広いサーバーの運営をサポートする豊富な機能やコマンドを搭載しています。',
    icon: RocketIcon,
  },
  {
    heading: '使いやすい操作性',
    description:
      'Botの導入や各機能の設定は全てダッシュボードに集約されており、ダッシュボードにアクセスするだけですぐに使用を開始することができます。',
    icon: HeartIcon,
  },
  {
    heading: 'カスタマイズ可能',
    description:
      '各機能には豊富なカスタマイズオプションが用意されているため、各サーバーのニーズに合わせて自由に設定を行うことができます。',
    icon: WrenchIcon,
  },
  {
    heading: '充実したサポート',
    description:
      'Botの使い方を網羅したドキュメントや、いつでも質問やお問い合わせが可能な公式サポートサーバーにより、誰でもBotの使用を開始することができます。',
    icon: LifeBuoyIcon,
  },
  {
    heading: '無料で使用可能',
    description:
      '特定の機能を開放するために料金を支払う必要はありません。nonibotでは全ての機能を無料で使用することができます。',
    icon: DollarSignIcon,
  },
  {
    heading: '高い信頼性',
    description:
      '現在、nonibotは1,000を超えるサーバーで導入されており、様々な規模のサーバー管理をサポートしています。',
    icon: ServerIcon,
  },
];

export function FeatureSection() {
  return (
    <section className='container max-w-6xl py-32'>
      <h2 className='mx-auto mb-16 max-w-3xl text-center text-4xl font-bold text-pretty lg:text-5xl'>
        機能性と使いやすさを両立した
        <br />
        サーバー管理Bot
      </h2>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {features.map(({ heading, description, icon: Icon }) => (
          <Card key={heading}>
            <CardContent>
              <div className='bg-accent mb-5 flex size-14 items-center justify-center rounded-full'>
                <Icon className='size-6' />
              </div>
              <h3 className='mb-2 text-xl font-semibold'>{heading}</h3>
              <p className='text-muted-foreground'>{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
