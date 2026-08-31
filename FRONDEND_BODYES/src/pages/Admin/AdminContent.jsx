import { useEffect, useState } from 'react'
import AdminShell from './AdminShell'
import { useToast } from '../../context/ToastContext'
import { fetchAdminContent, updateAdminContent } from '../../services/api'
import './Admin.css'

const SECTIONS = [
  { key: 'hero', label: 'Hero / Portada' },
  { key: 'navbar', label: 'Barra superior' },
  { key: 'footer', label: 'Footer' },
]

function AdminContent() {
  const { pushToast } = useToast()
  const [content, setContent] = useState(null)
  const [section, setSection] = useState('hero')

  useEffect(() => {
    fetchAdminContent()
      .then((res) => setContent(res.content))
      .catch((err) => pushToast(err.message, 'error'))
  }, [])

  const save = async () => {
    try {
      await updateAdminContent(section, content[section])
      pushToast('Contenido guardado correctamente')
    } catch (err) {
      pushToast(err.message, 'error')
    }
  }

  if (!content) return <AdminShell title="Contenido del sitio"><p>Cargando…</p></AdminShell>

  const values = content[section] || {}

  const setField = (field, value) => {
    setContent((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }))
  }

  return (
    <AdminShell title="Contenido del sitio">
      <div className="admin-tabs">
        {SECTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={section === item.key ? 'is-active' : ''}
            onClick={() => setSection(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="admin-form-card">
        {section === 'hero' && (
          <>
            <label>Texto superior<input value={values.season || ''} onChange={(e) => setField('season', e.target.value)} /></label>
            <label>Título línea 1<input value={values.titleLine1 || ''} onChange={(e) => setField('titleLine1', e.target.value)} /></label>
            <label>Título línea 2<input value={values.titleLine2 || ''} onChange={(e) => setField('titleLine2', e.target.value)} /></label>
            <label>Subtítulo<textarea value={values.tagline || ''} onChange={(e) => setField('tagline', e.target.value)} rows={3} /></label>
            <label>Texto botón<input value={values.ctaText || ''} onChange={(e) => setField('ctaText', e.target.value)} /></label>
            <label>Link botón<input value={values.ctaLink || ''} onChange={(e) => setField('ctaLink', e.target.value)} /></label>
            <label>Video MP4<input value={values.videoMp4 || ''} onChange={(e) => setField('videoMp4', e.target.value)} /></label>
            <label>Imagen poster<input value={values.poster || ''} onChange={(e) => setField('poster', e.target.value)} /></label>
          </>
        )}
        {section === 'navbar' && (
          <>
            <label>Texto promocional<input value={values.promoText || ''} onChange={(e) => setField('promoText', e.target.value)} /></label>
            <label>Link promocional<input value={values.promoLink || ''} onChange={(e) => setField('promoLink', e.target.value)} /></label>
          </>
        )}
        {section === 'footer' && (
          <>
            <label>Instagram<input value={values.instagram || ''} onChange={(e) => setField('instagram', e.target.value)} /></label>
            <label>TikTok<input value={values.tiktok || ''} onChange={(e) => setField('tiktok', e.target.value)} /></label>
            <label>Copyright<input value={values.copyright || ''} onChange={(e) => setField('copyright', e.target.value)} /></label>
          </>
        )}
        <button type="button" className="btn btn--primary" onClick={save}>Guardar cambios</button>
      </div>
    </AdminShell>
  )
}

export default AdminContent
