import express from 'express'
import decision_routes from './routes/decision.routes.js'
import cors from 'cors'

const app=express()
app.use(express.json())
app.use(cors())

app.use('/api/decision',decision_routes);
app.listen(3000,console.log('app running on port 3000.........'))
