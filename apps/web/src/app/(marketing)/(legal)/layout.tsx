export default function Layout({ children }: LayoutProps<'/'>) {
  return <article className='prose py-16 max-w-4xl mx-auto'>{children}</article>;
}
