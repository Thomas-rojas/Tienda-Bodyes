import { createContext, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

function parsePrice(price) {
  if (typeof price === 'number') return price
  return Number(String(price).replace(/[^0-9.]/g, '')) || 0
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = (product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
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
    () =>
      items.reduce(
        (sum, item) => sum + parsePrice(item.price) * item.quantity,
        0,
      ),
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
    }),
    [items, totalItems, totalPrice],
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
