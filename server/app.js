import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

const app = express()
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000
const secret = process.env.JWT_SECRET

if (!secret) {
  throw new Error('JWT_SECRET is required')
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
)

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 10000 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
)

const User = mongoose.models.User || mongoose.model('User', userSchema)
const Note = mongoose.models.Note || mongoose.model('Note', noteSchema)

app.use(cors())
app.use(express.json())

const createToken = (userId) => {
  const payload = `${userId}.${Date.now() + TOKEN_TTL}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${signature}`
}

const getUserId = (token) => {
  try {
    const [encodedPayload, signature] = token.split('.')
    const payload = Buffer.from(encodedPayload, 'base64url').toString()
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    if (!signature || signature.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
    const [userId, expiresAt] = payload.split('.')
    return Date.now() < Number(expiresAt) ? userId : null
  } catch {
    return null
  }
}

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const userId = token && getUserId(token)
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ message: 'Authentication required' })
  }
  req.userId = userId
  next()
}

const validateCredentials = ({ name, email, password }, includeName = false) => {
  if (includeName && (!name || name.trim().length < 2)) return 'Name must be at least 2 characters'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email'
  if (!password || password.length < 6) return 'Password must be at least 6 characters'
  return null
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.post('/api/auth/signup', async (req, res) => {
  const body = req.body || {}
  const { name, email, password } = body
  const validationError = validateCredentials(body, true)
  if (validationError) return res.status(400).json({ message: validationError })

  try {
    const normalizedEmail = email.trim().toLowerCase()
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'An account with that email already exists' })
    }
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
    })
    res.status(201).json({ token: createToken(user.id), user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    console.error('Signup failed:', error.message)
    res.status(500).json({ message: 'Unable to create account' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const body = req.body || {}
  const validationError = validateCredentials(body)
  if (validationError) return res.status(400).json({ message: validationError })

  try {
    const user = await User.findOne({ email: body.email.trim().toLowerCase() })
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.json({ token: createToken(user.id), user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    console.error('Login failed:', error.message)
    res.status(500).json({ message: 'Unable to log in' })
  }
})

app.get('/api/notes', auth, async (req, res) => {
  try {
    res.json(await Note.find({ user: req.userId }).sort({ updatedAt: -1 }))
  } catch (error) {
    console.error('Loading notes failed:', error.message)
    res.status(500).json({ message: 'Unable to load notes' })
  }
})

app.post('/api/notes', auth, async (req, res) => {
  const title = req.body.title?.trim()
  const content = req.body.content?.trim()
  if (!title || !content) return res.status(400).json({ message: 'Title and content are required' })
  if (title.length > 120 || content.length > 10000) return res.status(400).json({ message: 'Note is too long' })

  try {
    res.status(201).json(await Note.create({ title, content, user: req.userId }))
  } catch (error) {
    console.error('Creating note failed:', error.message)
    res.status(500).json({ message: 'Unable to create note' })
  }
})

app.put('/api/notes/:id', auth, async (req, res) => {
  const title = req.body.title?.trim()
  const content = req.body.content?.trim()
  if (!title || !content) return res.status(400).json({ message: 'Title and content are required' })
  if (title.length > 120 || content.length > 10000) return res.status(400).json({ message: 'Note is too long' })

  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, content },
      { new: true, runValidators: true },
    )
    if (!note) return res.status(404).json({ message: 'Note not found' })
    res.json(note)
  } catch (error) {
    console.error('Updating note failed:', error.message)
    res.status(400).json({ message: 'Invalid note' })
  }
})

app.delete('/api/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId })
    if (!note) return res.status(404).json({ message: 'Note not found' })
    res.status(204).end()
  } catch (error) {
    console.error('Deleting note failed:', error.message)
    res.status(400).json({ message: 'Invalid note' })
  }
})

export default app
