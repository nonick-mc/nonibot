import { Links } from '@repo/shared/constants';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';

const linkClass = 'text-foreground underline';

const items: { question: string; answer: ReactNode }[] = [
  {
    question: 'Botを導入するにはどうすればよいですか？',
    answer: (
      <>
        ドキュメントの
        <Link className={linkClass} href='/docs/tutorial/getting-started'>
          Botを導入する
        </Link>
        ページにて、nonibotの導入方法を解説しています。
      </>
    ),
  },
  {
    question: 'nonibotの使用に料金は発生しますか？',
    answer:
      '現在、nonibotに有料プランは提供されておりません。そのため、全ての機能を無料で使用することができます。',
  },
  {
    question:
      '日本語以外の言語で使用することはできますか？ (Can I use it in languages other than Japanese?)',
    answer: (
      <>
        いいえ、nonibotは日本語のみをサポートしています。他の言語への対応予定は現時点ではありません。
        <br />
        (No, nonibot currently only supports Japanese. There are no plans to support other languages
        at this time.)
      </>
    ),
  },
  {
    question: '質問やサポートを受けられるコミュニティはありますか？',
    answer: (
      <>
        はい、
        <Link className={linkClass} href={Links.SupportServer}>
          公式サポートサーバー
        </Link>
        に参加し、専用のテキストチャンネルに投稿することでサポートを受けることができます。
      </>
    ),
  },
  {
    question: '今後開発する機能を確認したり、リクエストすることはできますか？',
    answer: (
      <>
        <Link className={linkClass} href={Links.Roadmap}>
          ロードマップ
        </Link>
        に今後の開発予定を掲載しています。また、
        <Link className={linkClass} href={Links.SupportServer}>
          公式サポートサーバー
        </Link>
        では、専用のテキストチャンネルでリクエストを受け付けています。ただし、いただいたリクエストが必ずしも実装されるとは限りませんので、あらかじめご了承ください。
      </>
    ),
  },
];

export function FaqSection() {
  return (
    <section className='container max-w-4xl py-32'>
      <h2 className='mb-4 text-3xl font-semibold md:mb-11 md:text-4xl'>よくある質問</h2>
      <Card>
        <CardContent>
          <Accordion>
            {items.map((item) => (
              <AccordionItem key={item.question}>
                <AccordionTrigger className='font-semibold hover:no-underline py-5'>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground py-3'>
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
