import 'dotenv/config';
import express from 'express'
import decision_routes from './routes/decision.routes.js'
import auth_routes from './routes/auth.routes.js'
import chat_routes from './routes/chat.routes.js'
import cors from 'cors'

const app=express()
app.use(express.json())
app.use(cors())

app.use('/api/decision',decision_routes);
app.use('/api/auth', auth_routes);
app.use('/api/chat', chat_routes);
app.listen(3000,console.log('app running on port 3000.........'))
