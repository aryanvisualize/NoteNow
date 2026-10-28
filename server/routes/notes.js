import { Router } from 'express'
import Note from '../models/Note.js'
import auth from '../middleware/auth.js'

const router = Router()

router.use(auth)

router.get('/', async (req, res) => {
  try {
    res.json(await Note.find({ user: req.userId }).sort({ updatedAt: -1 }))
  } catch (error) {
    console.error('Loading notes failed:', error.message)
    res.status(500).json({ message: 'Unable to load notes' })
  }
})

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId })
    if (!note) return res.status(404).json({ message: 'Note not found' })
    res.status(204).end()
  } catch (error) {
    console.error('Deleting note failed:', error.message)
    res.status(400).json({ message: 'Invalid note' })
  }
})

export default router
