import Navbar from '../../components/navbar/Navbar'
import Hero from '../../components/hero/Hero'
import Coleccion from '../../components/coleccion/Coleccion'
import Historia from '../../components/Historia/Historia'
import Final from '../../components/final/Final'

function Home() {
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
