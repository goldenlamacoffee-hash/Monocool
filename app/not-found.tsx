import Link from 'next/link'
import { Sora, Manrope } from 'next/font/google'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })
const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sora', display: 'swap' })

export default function NotFound() {
  return (
    <html lang="de" className={`bg-background ${manrope.variable} ${sora.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Seite nicht gefunden
          </p>
          <Link 
            href="/" 
            className="mt-8 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </body>
    </html>
  )
}
