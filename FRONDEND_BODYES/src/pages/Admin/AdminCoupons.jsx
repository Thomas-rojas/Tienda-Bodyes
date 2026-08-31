import { useEffect, useState } from 'react'
import AdminShell from './AdminShell'
import { useToast } from '../../context/ToastContext'
import {
  createAdminCoupon,
  deleteAdminCoupon,
  fetchAdminCoupons,
  updateAdminCoupon,
} from '../../services/api'
import './Admin.css'

function AdminCoupons() {
  const { pushToast } = useToast()
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '10',
    maxUses: '',
  })

  const load = () => {
    fetchAdminCoupons()
      .then((res) => setCoupons(res.coupons || []))
      .catch((err) => pushToast(err.message, 'error'))
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (event) => {
    event.preventDefault()
    try {
      await createAdminCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
      })
      pushToast('Cupón creado')
      setForm({ code: '', discountType: 'percent', discountValue: '10', maxUses: '' })
      load()
    } catch (err) {
      pushToast(err.message, 'error')
    }
  }

  return (
    <AdminShell title="Cupones y promociones">
      <form className="admin-form-card" onSubmit={create}>
        <h2>Nuevo cupón</h2>
        <div className="admin-form-grid">
          <label>Código<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></label>
          <label>
            Tipo
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percent">Porcentaje</option>
              <option value="fixed">Monto fijo</option>
            </select>
          </label>
          <label>Valor<input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required /></label>
          <label>Límite de usos<input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></label>
        </div>
        <button type="submit" className="btn btn--primary">Crear cupón</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Usos</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td>{coupon.code}</td>
                <td>{coupon.discountType}</td>
                <td>{coupon.discountValue}</td>
                <td>{coupon.usesCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={coupon.active}
                    onChange={(e) => updateAdminCoupon(coupon.id, { active: e.target.checked }).then(load)}
                  />
                </td>
                <td>
                  <button type="button" className="admin-danger" onClick={() => deleteAdminCoupon(coupon.id).then(load)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}

export default AdminCoupons
