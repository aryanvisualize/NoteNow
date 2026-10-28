import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:3000/api'

const request = async (path, options = {}, token) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options,
  })
  if (!response.ok) throw new Error((await response.json()).message || 'Something went wrong')
  return response.status === 204 ? null : response.json()
}

function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('note-session') || 'null'))
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [notes, setNotes] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState({ title: '', content: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    request('/notes', {}, session.token).then(setNotes).catch(() => setSession(null))
  }, [session])

  const submitAuth = async (event) => {
    event.preventDefault()
    setLoading(true); setMessage('')
    try {
      const data = await request(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) })
      localStorage.setItem('note-session', JSON.stringify(data)); setSession(data)
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  const selectNote = (note) => { setSelectedId(note._id); setDraft({ title: note.title, content: note.content }); setMessage('') }
  const newNote = () => { setSelectedId('new'); setDraft({ title: '', content: '' }); setMessage('') }

  const saveNote = async (event) => {
    event.preventDefault(); setLoading(true); setMessage('')
    try {
      const saved = await request(selectedId === 'new' ? '/notes' : `/notes/${selectedId}`, {
        method: selectedId === 'new' ? 'POST' : 'PUT', body: JSON.stringify(draft),
      }, session.token)
      setNotes((current) => selectedId === 'new' ? [saved, ...current] : current.map((note) => note._id === saved._id ? saved : note))
      selectNote(saved)
      setMessage('Saved')
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  const deleteNote = async () => {
    if (!selectedId || selectedId === 'new' || !window.confirm('Delete this note?')) return
    try {
      await request(`/notes/${selectedId}`, { method: 'DELETE' }, session.token)
      setNotes((current) => current.filter((note) => note._id !== selectedId)); setSelectedId(null); setDraft({ title: '', content: '' })
    } catch (error) { setMessage(error.message) }
  }

  const logout = () => { localStorage.removeItem('note-session'); setSession(null); setNotes([]) }

  if (!session) return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand"><span>✦</span> NoteNow</div>
        <p className="eyebrow">YOUR THOUGHTS, ORGANIZED</p>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">{mode === 'login' ? 'Sign in to continue to your notes.' : 'Start capturing what matters to you.'}</p>
        <form onSubmit={submitAuth}>
          {mode === 'signup' && <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>}
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Password<input type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          {message && <p className="error">{message}</p>}
          <button className="primary" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Sign up'}</button>
        </form>
        <button className="link-button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  )

  return (
    <main className="app-shell">
      <header><div className="brand"><span>✦</span> NoteNow</div><div className="user-area"><span>{session.user.name}</span><button className="text-button" onClick={logout}>Sign out</button></div></header>
      <div className="workspace">
        <aside><div className="side-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h2>My notes</h2></div><button className="new-button" onClick={newNote}>+ New</button></div>
          <div className="note-list">{notes.map((note) => <button className={`note-item ${selectedId === note._id ? 'active' : ''}`} key={note._id} onClick={() => selectNote(note)}><strong>{note.title}</strong><span>{note.content.slice(0, 60)}</span></button>)}</div>
          {!notes.length && <p className="empty">No notes yet. Create your first one.</p>}
        </aside>
        <section className="editor">{selectedId ? <form onSubmit={saveNote}><div className="editor-top"><span className="eyebrow">{selectedId === 'new' ? 'NEW NOTE' : 'EDITING NOTE'}</span><button type="button" className="delete-button" onClick={deleteNote}>Delete</button></div><input className="title-input" placeholder="Note title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required maxLength="120" /><textarea placeholder="Start writing..." value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} required maxLength="10000" /><div className="editor-footer">{message && <span className={message === 'Saved' ? 'success' : 'error'}>{message}</span>}<button className="primary save" disabled={loading}>{loading ? 'Saving...' : 'Save note'}</button></div></form> : <div className="welcome"><span className="welcome-icon">✦</span><h1>Your ideas, in one place.</h1><p>Select a note or create a new one to get started.</p><button className="primary" onClick={newNote}>Create a note</button></div>}</section>
      </div>
    </main>
  )
}

export default App
