import { useEffect, useState } from 'react'
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  uploadAdminProductImage,
} from '../../services/api'
import AdminShell from './AdminShell'
import './Admin.css'

const EMPTY_NEW = {
  name: '',
  pricePesos: '',
  stock: '10',
  description: '',
  color: '',
  material: '',
  fit: '',
  size: 'Talla única',
  category: 'mujeres',
  active: true,
}

function emptyDraft(product) {
  return {
    name: product.name || '',
    pricePesos: product.pricePesos ?? Math.round((product.priceCents || 0) / 100),
    stock: product.stock ?? 0,
    active: product.active !== false,
    image: product.image || '',
    imagePath: product.imagePath || '',
    description: product.description || '',
    color: product.color || '',
    material: product.material || '',
    fit: product.fit || '',
    size: product.size || 'Talla única',
    category: product.category || 'mujeres',
  }
}

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [drafts, setDrafts] = useState({})
  const [newProduct, setNewProduct] = useState(EMPTY_NEW)
  const [newFile, setNewFile] = useState(null)
  const [newPreview, setNewPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [uploadingId, setUploadingId] = useState('')
  const [creating, setCreating] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAdminProducts()
      const list = data.products || []
      setProducts(list)
      const next = {}
      list.forEach((product) => {
        next[product.id] = emptyDraft(product)
      })
      setDrafts(next)
    } catch (err) {
      setError(err.message || 'No se pudo cargar la colección')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!newFile) {
      setNewPreview('')
      return undefined
    }
    const url = URL.createObjectURL(newFile)
    setNewPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [newFile])

  const onChange = (id, field, value) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }))
  }

  const onNewChange = (field, value) => {
    setNewProduct((current) => ({ ...current, [field]: value }))
  }

  const onPickImage = async (id, file) => {
    if (!file) return
    setUploadingId(id)
    setMessage('')
    setError('')
    try {
      const data = await uploadAdminProductImage(id, file)
      setProducts((current) =>
        current.map((product) => (product.id === id ? data.product : product)),
      )
      setDrafts((current) => ({
        ...current,
        [id]: emptyDraft(data.product),
      }))
      setMessage(`Foto actualizada: ${data.product.name}`)
    } catch (err) {
      setError(err.message || 'No se pudo subir la foto')
    } finally {
      setUploadingId('')
    }
  }

  const productPayload = (draft) => ({
    name: draft.name,
    pricePesos: Number(draft.pricePesos),
    stock: Number(draft.stock),
    active: Boolean(draft.active),
    description: draft.description,
    color: draft.color,
    material: draft.material,
    fit: draft.fit,
    size: draft.size,
    category: draft.category,
  })

  const onCreate = async (event) => {
    event.preventDefault()
    setCreating(true)
    setMessage('')
    setError('')
    try {
      const data = await createAdminProduct(productPayload(newProduct), newFile)
      setProducts((current) =>
        [...current, data.product].sort((a, b) =>
          String(a.name).localeCompare(String(b.name), 'es'),
        ),
      )
      setDrafts((current) => ({
        ...current,
        [data.product.id]: emptyDraft(data.product),
      }))
      setNewProduct(EMPTY_NEW)
      setNewFile(null)
      setMessage(`Producto creado: ${data.product.name}`)
    } catch (err) {
      setError(err.message || 'No se pudo crear el producto')
    } finally {
      setCreating(false)
    }
  }

  const onSave = async (id) => {
    setSavingId(id)
    setMessage('')
    setError('')
    try {
      const draft = drafts[id]
      const data = await updateAdminProduct(id, productPayload(draft))
      setProducts((current) =>
        current.map((product) => (product.id === id ? data.product : product)),
      )
      setDrafts((current) => ({
        ...current,
        [id]: emptyDraft(data.product),
      }))
      setMessage(`Guardado: ${data.product.name}`)
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSavingId('')
    }
  }

  const onDelete = async (product) => {
    const ok = window.confirm(
      `¿Eliminar “${product.name}”? Si ya tuvo ventas, se ocultará de la tienda.`,
    )
    if (!ok) return

    setDeletingId(product.id)
    setMessage('')
    setError('')
    try {
      const data = await deleteAdminProduct(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setDrafts((current) => {
        const next = { ...current }
        delete next[product.id]
        return next
      })
      setMessage(
        data.softDeleted
          ? `“${product.name}” tenía ventas: se ocultó de la tienda y salió del panel.`
          : `Eliminado: ${product.name}`,
      )
    } catch (err) {
      setError(err.message || 'No se pudo eliminar')
    } finally {
      setDeletingId('')
    }
  }

  const renderFields = (draft, id, { isNew = false } = {}) => (
    <>
      <label>
        Nombre
        <input
          value={draft.name}
          onChange={(e) =>
            isNew
              ? onNewChange('name', e.target.value)
              : onChange(id, 'name', e.target.value)
          }
          required={isNew}
        />
      </label>
      <div className="admin-card__row">
        <label>
          Precio (COP)
          <input
            type="number"
            min="1000"
            step="1000"
            value={draft.pricePesos}
            onChange={(e) =>
              isNew
                ? onNewChange('pricePesos', e.target.value)
                : onChange(id, 'pricePesos', e.target.value)
            }
            required={isNew}
          />
        </label>
        <label>
          Stock
          <input
            type="number"
            min="0"
            step="1"
            value={draft.stock}
            onChange={(e) =>
              isNew
                ? onNewChange('stock', e.target.value)
                : onChange(id, 'stock', e.target.value)
            }
            required={isNew}
          />
        </label>
      </div>
      <div className="admin-card__row">
        <label>
          Color
          <input
            value={draft.color}
            onChange={(e) =>
              isNew
                ? onNewChange('color', e.target.value)
                : onChange(id, 'color', e.target.value)
            }
          />
        </label>
        <label>
          Talla
          <input
            value={draft.size}
            onChange={(e) =>
              isNew
                ? onNewChange('size', e.target.value)
                : onChange(id, 'size', e.target.value)
            }
          />
        </label>
      </div>
      <div className="admin-card__row">
        <label>
          Material
          <input
            value={draft.material}
            onChange={(e) =>
              isNew
                ? onNewChange('material', e.target.value)
                : onChange(id, 'material', e.target.value)
            }
          />
        </label>
        <label>
          Ajuste / fit
          <input
            value={draft.fit}
            onChange={(e) =>
              isNew
                ? onNewChange('fit', e.target.value)
                : onChange(id, 'fit', e.target.value)
            }
          />
        </label>
      </div>
      <label>
        Categoría
        <input
          value={draft.category}
          onChange={(e) =>
            isNew
              ? onNewChange('category', e.target.value)
              : onChange(id, 'category', e.target.value)
          }
        />
      </label>
      <label>
        Foto del producto
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={!isNew && uploadingId === id}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (isNew) setNewFile(file || null)
            else onPickImage(id, file)
          }}
        />
      </label>
      {!isNew && uploadingId === id && (
        <p className="admin-card__hint">Subiendo foto…</p>
      )}
      {isNew && newFile && (
        <p className="admin-card__hint">Archivo listo: {newFile.name}</p>
      )}
      <label>
        Descripción
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) =>
            isNew
              ? onNewChange('description', e.target.value)
              : onChange(id, 'description', e.target.value)
          }
        />
      </label>
      <label className="admin-card__check">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) =>
            isNew
              ? onNewChange('active', e.target.checked)
              : onChange(id, 'active', e.target.checked)
          }
        />
        Visible en la tienda
      </label>
    </>
  )

  return (
    <AdminShell title="Colección">
      <p className="admin__lead">
        Añade productos nuevos o edita la colección: precio, stock, foto, color,
        material y más.
      </p>
      {message && <p className="admin__ok">{message}</p>}
      {error && <p className="admin__error">{error}</p>}

      <label className="admin-card__check admin-products__filter">
        <input
          type="checkbox"
          checked={showHidden}
          onChange={(e) => setShowHidden(e.target.checked)}
        />
        Mostrar productos ocultos
      </label>

      <form className="admin-card admin-card--new" onSubmit={onCreate}>
        <div className="admin-card__media">
          {newPreview ? (
            <img src={newPreview} alt="Vista previa del nuevo producto" />
          ) : (
            <div className="admin-card__placeholder">Nueva foto</div>
          )}
        </div>
        <div className="admin-card__fields">
          <h2 className="admin-card__title">Añadir producto</h2>
          {renderFields(newProduct, 'new', { isNew: true })}
          <button type="submit" disabled={creating}>
            {creating ? 'Creando…' : 'Crear producto'}
          </button>
        </div>
      </form>

      {loading ? (
        <p>Cargando colección…</p>
      ) : (
        <div className="admin-products">
          {products
            .filter((product) => showHidden || product.active !== false)
            .map((product) => {
            const draft = drafts[product.id] || emptyDraft(product)
            return (
              <article key={product.id} className="admin-card">
                <div className="admin-card__media">
                  <img
                    src={draft.image || product.image}
                    alt={product.alt || product.name}
                  />
                </div>
                <div className="admin-card__fields">
                  {renderFields(draft, product.id)}
                  <div className="admin-card__actions">
                    <button
                      type="button"
                      onClick={() => onSave(product.id)}
                      disabled={savingId === product.id || deletingId === product.id}
                    >
                      {savingId === product.id ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      className="admin-card__danger"
                      onClick={() => onDelete(product)}
                      disabled={deletingId === product.id || savingId === product.id}
                    >
                      {deletingId === product.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}

export default AdminProducts
