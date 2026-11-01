'use client';

import { useRouter } from 'next/navigation';
import NProgress from 'nprogress';
import { useEffect } from 'react';

export function RouterEventsProvider() {
  const router = useRouter();

  useEffect(() => {
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = ((...args) => {
      NProgress.start();
      return originalPush(...args);
    }) as typeof router.push;

    router.replace = ((...args) => {
      NProgress.start();
      return originalReplace(...args);
    }) as typeof router.replace;

    return () => {
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  return null;
}
