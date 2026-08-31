import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'clio_cart_v1'

function unitPesos(item) {
  if (typeof item.pricePesos === 'number') return item.pricePesos
  if (typeof item.priceCents === 'number') return Math.round(item.priceCents / 100)
  if (typeof item.price === 'number') return item.price
  const cleaned = String(item.price || '').replace(/[^0-9]/g, '')
  return Number(cleaned) || 0
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCart())
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const openDrawer = () => setDrawerOpen(true)
  const closeDrawer = () => setDrawerOpen(false)
  const toggleDrawer = () => setDrawerOpen((open) => !open)

  const addItem = (product, options = {}) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          pricePesos: product.pricePesos ?? unitPesos(product),
          priceCents: product.priceCents,
          image: product.image,
          alt: product.alt,
          quantity: 1,
        },
      ]
    })
    if (options.openDrawer !== false) {
      setDrawerOpen(true)
    }
  }

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.id !== productId))
  }

  const decreaseItem = (productId) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const clearCart = () => setItems([])

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + unitPesos(item) * item.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      decreaseItem,
      clearCart,
      totalItems,
      totalPrice,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [items, totalItems, totalPrice, drawerOpen],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return context
}
