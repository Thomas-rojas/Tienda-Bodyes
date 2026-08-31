import { useEffect, useState } from 'react'
import AdminShell from './AdminShell'
import { useToast } from '../../context/ToastContext'
import { fetchAdminContent, updateAdminContent } from '../../services/api'
import './Admin.css'

function AdminSettings() {
  const { pushToast } = useToast()
  const [store, setStore] = useState({ name: '', whatsapp: '', supportEmail: '' })

  useEffect(() => {
    fetchAdminContent()
      .then((res) => setStore(res.content?.store || {}))
      .catch(() => {})
  }, [])

  const save = async () => {
    try {
      await updateAdminContent('store', store)
      pushToast('Configuración guardada')
    } catch (err) {
      pushToast(err.message, 'error')
    }
  }

  return (
    <AdminShell title="Configuración">
      <div className="admin-form-card">
        <h2>Datos de la tienda</h2>
        <label>Nombre de la marca<input value={store.name || ''} onChange={(e) => setStore({ ...store, name: e.target.value })} /></label>
        <label>WhatsApp (solo números)<input value={store.whatsapp || ''} onChange={(e) => setStore({ ...store, whatsapp: e.target.value })} /></label>
        <label>Email de soporte<input value={store.supportEmail || ''} onChange={(e) => setStore({ ...store, supportEmail: e.target.value })} /></label>
        <button type="button" className="btn btn--primary" onClick={save}>Guardar configuración</button>
      </div>
    </AdminShell>
  )
}

export default AdminSettings
