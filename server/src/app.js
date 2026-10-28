import app from './server.js';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



export default app;