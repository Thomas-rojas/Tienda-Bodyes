import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import SocialBar from './components/common/SocialBar/SocialBar'
import Home from './pages/Home/Home'
import Catalog from './pages/Catalog/Catalog'
import Cart from './pages/Cart/Cart'
import Product from './pages/Product/Product'
import Checkout from './pages/Checkout/Checkout'
import PaymentResult from './pages/PaymentResult/PaymentResult'
import PaymentSimulate from './pages/PaymentSimulate/PaymentSimulate'
import Receipt from './pages/Receipt/Receipt'
import './assets/styles/global.css'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <SocialBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:id" element={<Product />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/pagar" element={<Checkout />} />
          <Route path="/pago/resultado" element={<PaymentResult />} />
          <Route path="/pago/simular" element={<PaymentSimulate />} />
          <Route path="/comprobante/:reference" element={<Receipt />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
