import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteContent } from '../../hooks/useSiteContent'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import './Hero.css'

function shouldPreferPoster() {
  if (typeof window === 'undefined') return true
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const narrow = window.matchMedia('(max-width: 768px)').matches
  const saveData = navigator.connection?.saveData === true
  const slow =
    navigator.connection?.effectiveType === 'slow-2g' ||
    navigator.connection?.effectiveType === '2g'
  return reducedMotion || narrow || saveData || slow
}

function HeroLetter({ char }) {
  const [isPink, setIsPink] = useState(false)

  const togglePink = () => setIsPink((prev) => !prev)

  return (
    <span
      className={`hero__letter${isPink ? ' is-pink' : ''}`}
      role="button"
      tabIndex={0}
      onClick={togglePink}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          togglePink()
        }
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  )
}

function HeroLetters({ text, lineClass = '' }) {
  return (
    <span className={`hero__title-line ${lineClass}`.trim()} aria-label={text}>
      {text.split('').map((char, index) => (
        <HeroLetter key={`${char}-${index}`} char={char} />
      ))}
    </span>
  )
}

function Hero() {
  const site = useSiteContent()
  const hero = site.hero
  const [contentRef, contentVisible] = useScrollReveal({ threshold: 0.2 })
  const [usePoster, setUsePoster] = useState(true)
  const [videoFailed, setVideoFailed] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    setUsePoster(shouldPreferPoster())
  }, [])

  useEffect(() => {
    if (usePoster || videoFailed) return undefined
    const video = videoRef.current
    if (!video) return undefined

    const play = () => {
      video.play().catch(() => setVideoFailed(true))
    }
    play()
    return undefined
  }, [usePoster, videoFailed])

  const showVideo = !usePoster && !videoFailed

  return (
    <section id="inicio" className="hero" aria-label="Hero CLIO">
      <div className="hero__media">
        {showVideo ? (
          <video
            ref={videoRef}
            className="hero__video"
            autoPlay
            muted
            loop
            playsInline
            poster={hero.poster}
            onError={() => setVideoFailed(true)}
          >
            <source src={hero.videoWebm} type="video/webm" />
            <source src={hero.videoMp4} type="video/mp4" />
          </video>
        ) : (
          <img
            className="hero__poster"
            src={hero.poster}
            alt="Campaña editorial CLIO — bodys"
          />
        )}
        <div className="hero__overlay" aria-hidden="true" />
      </div>

      <div
        ref={contentRef}
        className={`hero__content reveal${contentVisible ? ' is-visible' : ''}`}
      >
        <p className="hero__season">{hero.season}</p>
        <h1 className="hero__title">
          <HeroLetters text={hero.titleLine1} />
          <HeroLetters text={hero.titleLine2} lineClass="hero__title-line--accent" />
        </h1>
        <p className="hero__tagline">{hero.tagline}</p>
        <Link className="btn btn--hero-outline" to={hero.ctaLink}>
          {hero.ctaText}
        </Link>
      </div>
    </section>
  )
}

export default Hero
