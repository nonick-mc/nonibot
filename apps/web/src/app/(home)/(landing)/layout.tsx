export default function Layout({ children }: LayoutProps<'/'>) {
  return <main className='container max-w-350'>{children}</main>;
}
