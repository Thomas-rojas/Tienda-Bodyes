import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'bodyes-backend' })
})

export default app
