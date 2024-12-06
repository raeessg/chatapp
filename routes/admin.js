import express from 'express'
import { allUsers } from '../controllers/admin.js';

const app = express.Router();


app.post('/verify')

app.get('/logout')


// Only Admin Can Accesss these Routes
app.get('/')

app.get('/users', allUsers)
app.get('/chats')
app.get('/messages')

app.get('/stats')


export default app;