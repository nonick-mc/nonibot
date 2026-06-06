import NextTopLoader from 'nextjs-toploader';

export default function Layout({ children }: LayoutProps<'/dashboard'>) {
  return (
    <>
      {children}
      <NextTopLoader color='#2563eb' showSpinner={false} />
    </>
  );
}
