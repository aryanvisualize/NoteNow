# NoteNow

A simple MERN notes app with user authentication and private note CRUD.

## Run locally

1. Make sure MongoDB is available and set these values in `server/.env`:

   ```env
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-long-random-secret
   ```

2. Start the API:

   ```bash
   cd server
   npm install
   npm run dev
   ```

3. In a second terminal, start the React client:

   ```bash
   cd client
   npm install
   npm run dev
   ```

The client uses `http://localhost:3000/api` for the API. The server exposes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/notes`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

All note endpoints require a bearer token and scope every database operation to the authenticated user.
