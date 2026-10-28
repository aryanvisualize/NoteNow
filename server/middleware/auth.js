import mongoose from 'mongoose'
import { getUserId } from '../utils/auth.js'

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const userId = token && getUserId(token)
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ message: 'Authentication required' })
  }
  req.userId = userId
  next()
}

export default auth
