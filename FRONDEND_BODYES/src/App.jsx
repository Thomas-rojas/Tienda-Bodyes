import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { CartProvider } from './context/CartContext'
import CartDrawer from './components/cart/CartDrawer'
import AuthFlash from './components/common/AuthFlash/AuthFlash'
import Home from './pages/Home/Home'
import Catalog from './pages/Catalog/Catalog'
import Cart from './pages/Cart/Cart'
import Product from './pages/Product/Product'
import Checkout from './pages/Checkout/Checkout'
import PaymentResult from './pages/PaymentResult/PaymentResult'
import PaymentSimulate from './pages/PaymentSimulate/PaymentSimulate'
import Receipt from './pages/Receipt/Receipt'
import AuthPage from './pages/Auth/AuthPage'
import AccountPage from './pages/Account/AccountPage'
import MyOrdersPage from './pages/Account/MyOrdersPage'
import ClientGuard from './pages/Account/ClientGuard'
import AdminEntry from './pages/Admin/AdminEntry'
import AdminGuard from './pages/Admin/AdminGuard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminProducts from './pages/Admin/AdminProducts'
import AdminCollections from './pages/Admin/AdminCollections'
import AdminSales from './pages/Admin/AdminSales'
import AdminCustomers from './pages/Admin/AdminCustomers'
import AdminContent from './pages/Admin/AdminContent'
import AdminCoupons from './pages/Admin/AdminCoupons'
import AdminSettings from './pages/Admin/AdminSettings'
import AdminUsers from './pages/Admin/AdminUsers'
import './assets/styles/global.css'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
        <BrowserRouter>
          <AuthFlash />
          <CartDrawer />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/coleccion/:slug" element={<Catalog />} />
            <Route path="/producto/:id" element={<Product />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/pagar" element={<Checkout />} />
            <Route path="/pago/resultado" element={<PaymentResult />} />
            <Route path="/pago/simular" element={<PaymentSimulate />} />
            <Route path="/comprobante/:reference" element={<Receipt />} />

            <Route path="/login" element={<AuthPage />} />
            <Route path="/registro" element={<AuthPage />} />

            <Route element={<ClientGuard />}>
              <Route path="/cuenta" element={<AccountPage />} />
              <Route path="/mis-pedidos" element={<MyOrdersPage />} />
            </Route>

            <Route path="/admin" element={<AdminEntry />} />
            <Route element={<AdminGuard />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/productos" element={<AdminProducts />} />
              <Route path="/admin/colecciones" element={<AdminCollections />} />
              <Route path="/admin/pedidos" element={<AdminSales />} />
              <Route path="/admin/ventas" element={<Navigate to="/admin/pedidos" replace />} />
              <Route path="/admin/clientes" element={<AdminCustomers />} />
              <Route path="/admin/contenido" element={<AdminContent />} />
              <Route path="/admin/cupones" element={<AdminCoupons />} />
              <Route path="/admin/configuracion" element={<AdminSettings />} />
              <Route path="/admin/usuarios" element={<AdminUsers />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
