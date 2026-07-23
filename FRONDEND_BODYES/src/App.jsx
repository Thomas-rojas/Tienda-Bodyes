import { CartProvider } from './context/CartContext'
import Home from './pages/Home/Home'
import './assets/styles/global.css'

function App() {
  return (
    <CartProvider>
      <Home />
    </CartProvider>
  )
}

export default App
