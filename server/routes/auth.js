import bcrypt from 'bcrypt'
import { Router } from 'express'
import User from '../models/User.js'
import { createToken } from '../utils/auth.js'
import { validateCredentials } from '../utils/validation.js'

const router = Router()

router.post('/signup', async (req, res) => {
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

router.post('/login', async (req, res) => {
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

export default router
