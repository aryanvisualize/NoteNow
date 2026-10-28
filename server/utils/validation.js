export const validateCredentials = ({ name, email, password }, includeName = false) => {
  if (includeName && (!name || name.trim().length < 2)) return 'Name must be at least 2 characters'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email'
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters'
  return null
}
