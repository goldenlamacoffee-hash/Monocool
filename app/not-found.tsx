import Link from 'next/link'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function NotFound() {
  return (
    <html lang="de" className="bg-background">
      <body className={`${inter.className} antialiased`}>
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
