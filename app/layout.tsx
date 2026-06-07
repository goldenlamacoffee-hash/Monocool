import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MonoCool - Klimaanlagen ohne Außengerät',
  description: 'MonoCool bietet innovative Klimaanlagen ohne Außengerät. Effiziente Kühlung und Heizung ohne komplizierte Installation.',
  keywords: 'Klimaanlage, ohne Außengerät, MonoCool, Kühlung, Heizung, energieeffizient',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
