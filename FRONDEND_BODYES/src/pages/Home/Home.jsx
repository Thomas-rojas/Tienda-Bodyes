import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import Hero from '../../components/hero/Hero'
import Coleccion from '../../components/coleccion/Coleccion'
import Historia from '../../components/Historia/Historia'
import Final from '../../components/final/Final'

function Home() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return

    const timer = setTimeout(() => {
      const target = document.querySelector(location.hash)
      if (!target) return

      const navOffset =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
        ) || 68
      const top =
        target.getBoundingClientRect().top + window.scrollY - navOffset - 8
      window.scrollTo({ top, behavior: 'smooth' })
    }, 50)

    return () => clearTimeout(timer)
  }, [location.pathname, location.hash])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Coleccion />
        <Historia />
        <Final />
      </main>
    </>
  )
}

export default Home
