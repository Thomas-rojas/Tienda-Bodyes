import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Home from './pages/Home/Home'
import Catalog from './pages/Catalog/Catalog'
import Cart from './pages/Cart/Cart'
import Product from './pages/Product/Product'
import Checkout from './pages/Checkout/Checkout'
import './assets/styles/global.css'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:id" element={<Product />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/pagar" element={<Checkout />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
