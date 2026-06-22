import Link from 'next/link'
import { Sora, Manrope } from 'next/font/google'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })
const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sora', display: 'swap' })

export default function NotFound() {
  return (
    <html lang="en" className={`bg-background ${manrope.variable} ${sora.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="font-heading text-7xl font-semibold text-primary">404</p>
          <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Page not found</h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to homepage
          </Link>
        </div>
      </body>
    </html>
  )
}
