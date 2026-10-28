import cors from 'cors'
import express from 'express'
import authRoutes from './routes/auth.js'
import noteRoutes from './routes/notes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/notes', noteRoutes)

export default app
