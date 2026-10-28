import mongoose from 'mongoose'
import dns from 'node:dns'

dns.setServers(['1.1.1.1', '8.8.8.8'])

export const connectDB = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required')
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')
}
