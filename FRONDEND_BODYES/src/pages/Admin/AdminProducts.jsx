import { useEffect, useMemo, useState } from 'react'
import {
  createAdminProduct,
  deleteAdminProduct,
  duplicateAdminProduct,
  fetchAdminCollections,
  fetchAdminProducts,
  updateAdminProduct,
  uploadAdminProductImage,
} from '../../services/api'
import { useToast } from '../../context/ToastContext'
import AdminShell from './AdminShell'
import './Admin.css'

const LOW_STOCK = 5

const EMPTY_NEW = {
  name: '',
  pricePesos: '',
  compareAtPesos: '',
  stock: '10',
  description: '',
  color: '',
  material: '',
  fit: '',
  size: 'Talla única',
  category: 'mujeres',
  coleccion: '',
  active: true,
  featured: false,
}

function emptyDraft(product) {
  return {
    name: product.name || '',
    pricePesos: product.pricePesos ?? Math.round((product.priceCents || 0) / 100),
    compareAtPesos: product.compareAtPesos ?? '',
    stock: product.stock ?? 0,
    active: product.active !== false,
    featured: product.featured === true,
    image: product.image || '',
    imagePath: product.imagePath || '',
    description: product.description || '',
    color: product.color || '',
    material: product.material || '',
    fit: product.fit || '',
    size: product.size || 'Talla única',
    category: product.category || 'mujeres',
    coleccion: product.coleccion || '',
  }
}

function stockBadge(stock, active) {
  if (active === false) return { label: 'Oculto', className: 'admin-badge--muted' }
  if (stock <= 0) return { label: 'Agotado', className: 'admin-badge--danger' }
  if (stock <= LOW_STOCK) return { label: 'Stock bajo', className: 'admin-badge--warn' }
  return { label: 'Disponible', className: 'admin-badge--ok' }
}

function AdminProducts() {
  const { pushToast } = useToast()
  const [products, setProducts] = useState([])
  const [collections, setCollections] = useState([])
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
  const [search, setSearch] = useState('')
  const [filterCollection, setFilterCollection] = useState('')
  const [filterStock, setFilterStock] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [productsData, collectionsData] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminCollections(),
      ])
      const list = productsData.products || []
      setProducts(list)
      setCollections(collectionsData.collections || [])
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

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!showHidden && product.active === false) return false
      if (search && !String(product.name).toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (filterCollection && product.coleccion !== filterCollection) return false
      if (filterStock === 'low' && (product.stock > LOW_STOCK || product.stock <= 0)) {
        return false
      }
      if (filterStock === 'out' && product.stock > 0) return false
      if (filterStock === 'active' && product.active === false) return false
      if (filterStock === 'inactive' && product.active !== false) return false
      return true
    })
  }, [products, showHidden, search, filterCollection, filterStock])

  const onChange = (id, field, value) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }))
  }

  const onNewChange = (field, value) => {
    setNewProduct((current) => ({ ...current, [field]: value }))
  }

  const productPayload = (draft) => ({
    name: draft.name,
    pricePesos: Number(draft.pricePesos),
    compareAtPesos: draft.compareAtPesos === '' ? null : Number(draft.compareAtPesos),
    stock: Number(draft.stock),
    active: Boolean(draft.active),
    featured: Boolean(draft.featured),
    description: draft.description,
    color: draft.color,
    material: draft.material,
    fit: draft.fit,
    size: draft.size,
    category: draft.category,
    coleccion: draft.coleccion || null,
  })

  const onPickImage = async (id, file) => {
    if (!file) return
    setUploadingId(id)
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
      pushToast('Foto actualizada')
    } catch (err) {
      setError(err.message || 'No se pudo subir la foto')
    } finally {
      setUploadingId('')
    }
  }

  const onCreate = async (event) => {
    event.preventDefault()
    setCreating(true)
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
      pushToast(`Producto creado: ${data.product.name}`)
    } catch (err) {
      setError(err.message || 'No se pudo crear el producto')
    } finally {
      setCreating(false)
    }
  }

  const onSave = async (id, partial) => {
    setSavingId(id)
    setError('')
    try {
      const draft = partial ? { ...drafts[id], ...partial } : drafts[id]
      const data = await updateAdminProduct(id, productPayload(draft))
      setProducts((current) =>
        current.map((product) => (product.id === id ? data.product : product)),
      )
      setDrafts((current) => ({
        ...current,
        [id]: emptyDraft(data.product),
      }))
      pushToast('Cambios guardados correctamente')
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSavingId('')
    }
  }

  const onInlineSave = async (id, field, rawValue) => {
    const value = field === 'pricePesos' || field === 'stock' ? Number(rawValue) : rawValue
    onChange(id, field, rawValue)
    await onSave(id, { [field]: value })
  }

  const onDuplicate = async (product) => {
    setSavingId(product.id)
    try {
      const data = await duplicateAdminProduct(product.id)
      setProducts((current) => [...current, data.product])
      setDrafts((current) => ({
        ...current,
        [data.product.id]: emptyDraft(data.product),
      }))
      pushToast(`Copia creada: ${data.product.name}`)
    } catch (err) {
      setError(err.message || 'No se pudo duplicar')
    } finally {
      setSavingId('')
    }
  }

  const onDelete = async (product) => {
    const ok = window.confirm(
      `¿Estás seguro de eliminar “${product.name}”? Esta acción no se puede deshacer.`,
    )
    if (!ok) return

    setDeletingId(product.id)
    setError('')
    try {
      const data = await deleteAdminProduct(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setDrafts((current) => {
        const next = { ...current }
        delete next[product.id]
        return next
      })
      pushToast(
        data.softDeleted
          ? `“${product.name}” tenía ventas: se ocultó de la tienda.`
          : 'Producto eliminado',
      )
    } catch (err) {
      setError(err.message || 'No se pudo eliminar')
    } finally {
      setDeletingId('')
    }
  }

  const collectionOptions = collections.map((col) => (
    <option key={col.slug} value={col.slug}>
      {col.name}
    </option>
  ))

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
          Precio antes (oferta)
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="Opcional"
            value={draft.compareAtPesos}
            onChange={(e) =>
              isNew
                ? onNewChange('compareAtPesos', e.target.value)
                : onChange(id, 'compareAtPesos', e.target.value)
            }
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
          Colección
          <select
            value={draft.coleccion}
            onChange={(e) =>
              isNew
                ? onNewChange('coleccion', e.target.value)
                : onChange(id, 'coleccion', e.target.value)
            }
          >
            <option value="">Sin colección</option>
            {collectionOptions}
          </select>
        </label>
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
      <label className="admin-card__check">
        <input
          type="checkbox"
          checked={draft.featured}
          onChange={(e) =>
            isNew
              ? onNewChange('featured', e.target.checked)
              : onChange(id, 'featured', e.target.checked)
          }
        />
        Destacado en home
      </label>
    </>
  )

  return (
    <AdminShell title="Productos">
      <p className="admin__lead">
        Gestiona bodys, precios, stock, colecciones e imágenes. Los cambios se reflejan
        en la tienda al guardar.
      </p>
      {error && <p className="admin__error">{error}</p>}

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filterCollection}
          onChange={(e) => setFilterCollection(e.target.value)}
        >
          <option value="">Todas las colecciones</option>
          {collectionOptions}
        </select>
        <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotados</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
        <label className="admin-card__check">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          Mostrar ocultos
        </label>
      </div>

      {!loading && filteredProducts.length > 0 && (
        <div className="admin-panel admin-table-wrap">
          <h2>Edición rápida</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const draft = drafts[product.id] || emptyDraft(product)
                const badge = stockBadge(Number(draft.stock), draft.active)
                return (
                  <tr key={`quick-${product.id}`}>
                    <td>{product.name}</td>
                    <td>
                      <input
                        className="admin-table__inline"
                        type="number"
                        min="1000"
                        step="1000"
                        defaultValue={draft.pricePesos}
                        disabled={savingId === product.id}
                        onBlur={(e) => {
                          if (String(e.target.value) !== String(draft.pricePesos)) {
                            onInlineSave(product.id, 'pricePesos', e.target.value)
                          }
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="admin-table__inline"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={draft.stock}
                        disabled={savingId === product.id}
                        onBlur={(e) => {
                          if (String(e.target.value) !== String(draft.stock)) {
                            onInlineSave(product.id, 'stock', e.target.value)
                          }
                        }}
                      />
                    </td>
                    <td>
                      <span className={`admin-badge ${badge.className}`}>{badge.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

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
        <p>Cargando productos…</p>
      ) : filteredProducts.length === 0 ? (
        <p>No hay productos con esos filtros.</p>
      ) : (
        <div className="admin-products">
          {filteredProducts.map((product) => {
            const draft = drafts[product.id] || emptyDraft(product)
            const badge = stockBadge(Number(draft.stock), draft.active)
            return (
              <article key={product.id} className="admin-card">
                <div className="admin-card__media">
                  <img
                    src={draft.image || product.image}
                    alt={product.alt || product.name}
                  />
                  <span className={`admin-badge ${badge.className}`}>{badge.label}</span>
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
                      className="btn btn--outline"
                      onClick={() => onDuplicate(product)}
                      disabled={savingId === product.id || deletingId === product.id}
                    >
                      Duplicar
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
