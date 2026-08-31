import { useEffect, useState } from 'react'
import AdminShell from './AdminShell'
import { useToast } from '../../context/ToastContext'
import {
  createAdminCollection,
  deleteAdminCollection,
  fetchAdminCollections,
  updateAdminCollection,
} from '../../services/api'
import './Admin.css'

function AdminCollections() {
  const { pushToast } = useToast()
  const [collections, setCollections] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', featured: true, active: true })
  const [file, setFile] = useState(null)

  const load = () => {
    fetchAdminCollections()
      .then((res) => setCollections(res.collections || []))
      .catch((err) => pushToast(err.message, 'error'))
  }

  useEffect(() => {
    load()
  }, [])

  const saveCollection = async (collection, patch, imageFile) => {
    try {
      await updateAdminCollection(collection.slug, patch, imageFile)
      pushToast('Colección actualizada')
      load()
    } catch (err) {
      pushToast(err.message, 'error')
    }
  }

  const createCollection = async (event) => {
    event.preventDefault()
    try {
      await createAdminCollection(form, file)
      pushToast('Colección creada')
      setForm({ name: '', slug: '', featured: true, active: true })
      setFile(null)
      load()
    } catch (err) {
      pushToast(err.message, 'error')
    }
  }

  const removeCollection = async (slug) => {
    if (!window.confirm('¿Eliminar esta colección? Los productos no se borran.')) return
    try {
      await deleteAdminCollection(slug)
      pushToast('Colección eliminada')
      load()
    } catch (err) {
      pushToast(err.message, 'error')
    }
  }

  return (
    <AdminShell title="Colecciones">
      <form className="admin-form-card" onSubmit={createCollection}>
        <h2>Nueva colección</h2>
        <div className="admin-form-grid">
          <label>
            Nombre
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Slug (URL)
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ej. encaje" />
          </label>
          <label>
            Imagen
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <button type="submit" className="btn btn--primary">Crear colección</button>
      </form>

      <div className="admin-cards">
        {collections.map((collection) => (
          <article key={collection.slug} className="admin-card">
            <img src={collection.image} alt={collection.alt || collection.name} />
            <label>
              Nombre
              <input
                defaultValue={collection.name}
                onBlur={(e) => saveCollection(collection, { name: e.target.value })}
              />
            </label>
            <label>
              Slug
              <input defaultValue={collection.slug} disabled />
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                defaultChecked={collection.featured}
                onChange={(e) => saveCollection(collection, { featured: e.target.checked })}
              />
              Mostrar en home
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                defaultChecked={collection.active}
                onChange={(e) => saveCollection(collection, { active: e.target.checked })}
              />
              Activa
            </label>
            <label>
              Cambiar imagen
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const next = e.target.files?.[0]
                  if (next) saveCollection(collection, {}, next)
                }}
              />
            </label>
            <button type="button" className="admin-danger" onClick={() => removeCollection(collection.slug)}>
              Eliminar
            </button>
          </article>
        ))}
      </div>
    </AdminShell>
  )
}

export default AdminCollections
