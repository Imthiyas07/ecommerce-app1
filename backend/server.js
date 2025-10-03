import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import winston from 'winston'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import wishlistRouter from './routes/wishlistRoute.js'

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'ecommerce-backend' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// App Config
const app = express()
const port = process.env.PORT || 4000

// Connect to database and cloudinary with error handling
try {
    await connectDB()
    console.log('✅ Database connected successfully')
    await connectCloudinary()
    console.log('✅ Cloudinary connected successfully')
} catch (error) {
    console.error('❌ Failed to connect to services:', error)
    console.log('🔄 Starting server in offline mode...')
    // Don't exit, allow server to start without DB for testing
}

// Security middlewares
app.use(helmet())

// Rate limiting disabled for development
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 1000, // limit each IP to 1000 requests per windowMs
//     message: 'Too many requests from this IP, please try again later.',
// })
// app.use(limiter)

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174','https://ecommerce-app1-three.vercel.app/','https://ecommerce-app1-ten.vercel.app/'], // Allow frontend and admin origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token'],
}
app.use(cors(corsOptions))

// Body parsing
app.use(express.json({ limit: '10mb' })) // Limit payload size

// api endpoints
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/wishlist',wishlistRouter)

app.get('/',(req,res)=>{
    res.send("API Working")
})

// Test endpoint for debugging
app.get('/test',(req,res)=>{
    res.json({
        message: "Test endpoint working",
        timestamp: new Date().toISOString(),
        mongodb: process.env.MONGODB_URI ? "Configured" : "Not configured"
    })
})

app.listen(port, ()=> console.log('Server started on PORT : '+ port))
