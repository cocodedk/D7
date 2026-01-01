import '../../styles/public.css'

interface PublicHeroProps {
  title: string
  subtitle?: string
  tagline?: string
}

export default function PublicHero({ title, subtitle, tagline }: PublicHeroProps) {
  return (
    <section className="public-hero">
      <div className="floating-cards">
        <div className="card-float card-1">🃏</div>
        <div className="card-float card-2">♠️</div>
        <div className="card-float card-3">♥️</div>
        <div className="card-float card-4">♦️</div>
        <div className="card-float card-5">🃏</div>
        <div className="card-float card-6">♣️</div>
      </div>
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="suit suit-left">🃏</span>
          {title}
          <span className="suit suit-right">🇩🇰</span>
        </h1>
        {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        {tagline && <p className="hero-tagline">{tagline}</p>}
      </div>
    </section>
  )
}
