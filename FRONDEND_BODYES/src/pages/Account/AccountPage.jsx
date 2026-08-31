import { useEffect, useState } from 'react'
import Navbar from '../../components/navbar/Navbar'
import { updateProfile } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import './Account.css'

function AccountPage() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    region: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      region: user.region || '',
    })
  }, [user])

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await updateProfile(form)
      await refreshUser()
      setMessage('Datos actualizados')
    } catch (err) {
      setMessage(err.message || 'No se pudo guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="account-page">
        <div className="account-page__inner">
          <p className="page-eyebrow page-eyebrow--pink">Mi cuenta</p>
          <h1>Hola, {user?.name?.split(' ')[0]}</h1>
          <p>Email: {user?.email} · ID: {user?.documentNumber}</p>

          <form className="account-form" onSubmit={onSubmit}>
            <label>
              Nombre completo
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Celular
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
            </label>
            <label>
              Dirección
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <label>
              Ciudad
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </label>
            <label>
              Departamento
              <input
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {message && <p className="account-msg">{message}</p>}
          </form>
        </div>
      </main>
    </>
  )
}

export default AccountPage
