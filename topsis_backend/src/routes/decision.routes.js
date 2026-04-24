import express from 'express'
import getTopsisResult from '../controllers/decision.contorller.js'


const router =express.Router()
router.post("/topsis",getTopsisResult)

export default router       