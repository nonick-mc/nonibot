export default function Layout({ children }: LayoutProps<'/'>) {
  return <article className='container prose py-8 max-w-200 mx-auto'>{children}</article>;
}
