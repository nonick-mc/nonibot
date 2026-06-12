export default function Layout({ children }: LayoutProps<'/'>) {
  return <main className='container max-w-6xl'>{children}</main>;
}
