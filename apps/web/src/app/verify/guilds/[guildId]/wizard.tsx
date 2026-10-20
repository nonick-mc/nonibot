'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import type { InternalApiGuild } from '@repo/shared';
import { CDNRoutes, ImageFormat, RouteBases } from 'discord-api-types/v10';
import { domAnimation, LazyMotion, m } from 'framer-motion';
import { ArrowRightIcon, CheckCircle2Icon } from 'lucide-react';
import { DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { Stepper, StepperContent, StepperPanel } from '@/components/reui/stepper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';
import { verifyAction } from './action';

export function VerificationWizard({
  guild,
  isVerified,
}: {
  guild: InternalApiGuild;
  isVerified: boolean;
}) {
  const [{ step, direction }, setState] = useState({ step: 1, direction: 0 });
  const goTo = (next: number) => setState({ step: next, direction: next > step ? 1 : -1 });

  return (
    <Stepper value={step} className='flex flex-col gap-8'>
      <StepperPanel>
        <StepperContent value={1}>
          <SlideIn direction={direction}>
            <AccountStep guild={guild} isVerified={isVerified} onNext={() => goTo(2)} />
          </SlideIn>
        </StepperContent>
        <StepperContent value={2}>
          <SlideIn direction={direction}>
            <CaptchaStep guildId={guild.id} onBack={() => goTo(1)} onNext={() => goTo(3)} />
          </SlideIn>
        </StepperContent>
        <StepperContent value={3}>
          <SlideIn direction={direction}>
            <CompleteStep />
          </SlideIn>
        </StepperContent>
      </StepperPanel>
    </Stepper>
  );
}

function SlideIn({ direction, children }: { direction: number; children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={direction === 0 ? false : { x: direction * 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

function AccountStep({
  guild,
  isVerified,
  onNext,
}: {
  guild: InternalApiGuild;
  isVerified: boolean;
  onNext: () => void;
}) {
  const [isSwitching, setIsSwitching] = useState(false);
  const { data: session } = authClient.useSession();

  return (
    <div className='flex flex-col items-center gap-8'>
      <div className='flex flex-col items-center gap-3'>
        <Avatar className='size-28'>
          {guild.icon && (
            <AvatarImage
              src={RouteBases.cdn + CDNRoutes.guildIcon(guild.id, guild.icon, ImageFormat.WebP)}
              alt={guild.name}
            />
          )}
          <AvatarFallback>{guild.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <p className='text-lg font-semibold'>{guild.name}</p>
      </div>
      <div className='w-full flex flex-col gap-2'>
        <Button onClick={onNext} disabled={isSwitching || isVerified || !session}>
          {session ? (
            <>
              <Avatar size='sm'>
                <AvatarImage src={session.user.image ?? undefined} alt={`@${session.user.name}`} />
                <AvatarFallback>{session.user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              {isVerified ? '既に認証されています' : `@${session.user.name} として認証する`}
            </>
          ) : (
            <>
              <Spinner className='mt-0.5' />
              読み込み中
            </>
          )}
        </Button>
        <Button
          variant='outline'
          disabled={isSwitching || !session}
          onClick={async () => {
            setIsSwitching(true);
            await authClient.signIn.social({
              provider: 'discord',
              callbackURL: window.location.pathname,
            });
          }}
        >
          他のアカウントに切り替える
        </Button>
      </div>
    </div>
  );
}

function CaptchaStep({
  guildId,
  onBack,
  onNext,
}: {
  guildId: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setIsPending(true);
    const res = await verifyAction.bind(null, guildId)({ turnstileToken: token });
    setIsPending(false);

    if (res.serverError || res.validationErrors) {
      onBack();
      return toast.error(
        !res.serverError || res.serverError === DEFAULT_SERVER_ERROR_MESSAGE
          ? '認証中に問題が発生しました。時間をおいて再度お試しください。'
          : res.serverError,
      );
    }
    onNext();
  }

  return (
    <form onSubmit={onSubmit} className='w-full flex flex-col items-center gap-8'>
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
        onSuccess={setToken}
        onExpire={() => setToken(null)}
        options={{ size: 'flexible' }}
      />
      <Button className='w-full' type='submit' disabled={!token || isPending}>
        {isPending ? <Spinner /> : <ArrowRightIcon />}
        続行
      </Button>
    </form>
  );
}

function CompleteStep() {
  return (
    <Empty className='px-0'>
      <EmptyHeader>
        <EmptyMedia className='bg-success/10 size-14' variant='icon'>
          <CheckCircle2Icon className='text-success size-8' />
        </EmptyMedia>
        <EmptyTitle>認証に成功しました！</EmptyTitle>
        <EmptyDescription>このページを閉じても問題ありません。</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
