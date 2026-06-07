import { type Locale } from '@/i18n/config'

const flagSvgs: Record<Locale, React.ReactNode> = {
  de: (
    // Austria flag
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <g fillRule="evenodd">
        <path fill="#ed2939" d="M640 480H0V0h640z"/>
        <path fill="#fff" d="M640 320H0V160h640z"/>
      </g>
    </svg>
  ),
  cs: (
    // Czech Republic flag
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#fff" d="M0 0h640v240H0z"/>
      <path fill="#d7141a" d="M0 240h640v240H0z"/>
      <path fill="#11457e" d="M360 240 0 0v480z"/>
    </svg>
  ),
  sk: (
    // Slovakia flag
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#ee1c25" d="M0 0h640v480H0z"/>
      <path fill="#0b4ea2" d="M0 0h640v320H0z"/>
      <path fill="#fff" d="M0 0h640v160H0z"/>
    </svg>
  ),
  en: (
    // EU flag
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <defs>
        <g id="star">
          <path fill="#fc0" d="m0-1-.3 1 .5-.4h-1l.5.4z"/>
        </g>
      </defs>
      <path fill="#039" d="M0 0h640v480H0z"/>
      <g transform="translate(320 242.3) scale(26.7)">
        <use xlinkHref="#star" transform="rotate(0) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(30) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(60) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(90) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(120) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(150) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(180) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(210) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(240) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(270) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(300) translate(0 -6)"/>
        <use xlinkHref="#star" transform="rotate(330) translate(0 -6)"/>
      </g>
    </svg>
  ),
}

interface FlagProps {
  locale: Locale
  className?: string
}

export function Flag({ locale, className = 'w-5 h-4' }: FlagProps) {
  return (
    <span className={`inline-block rounded-sm overflow-hidden shadow-sm ${className}`}>
      {flagSvgs[locale]}
    </span>
  )
}
