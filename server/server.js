import 'dotenv/config'
import app from './app.js'
import { connectDB } from './db.js'

const PORT = process.env.PORT || 3000

try {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
} catch (error) {
  console.error('Unable to start server:', error.message)
  process.exit(1)
}
