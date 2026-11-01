import { Logo } from '@/components/logo';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function VerificationHeader() {
  return (
    <CardHeader className='gap-6'>
      <Logo height={18} />
      <div className='flex flex-col gap-1'>
        <CardTitle className='text-xl font-extrabold'>メンバー認証</CardTitle>
        <CardDescription>Discordアカウントで認証を行います。</CardDescription>
      </div>
    </CardHeader>
  );
}
