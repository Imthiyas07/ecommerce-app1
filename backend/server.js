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

// CORS configuration - Allow multiple origins including Vercel deployments
const allowedOrigins = [
    'http://localhost:5173',     // Local frontend
    'http://localhost:5174',     // Local admin
    'https://ecommerce-app1-three.vercel.app',  // Vercel frontend
    'https://ecommerce-app1-ten.vercel.app',     // Vercel admin
    process.env.FRONTEND_URL,    // Environment variable
    process.env.ADMIN_URL,       // Admin URL if set
].filter(Boolean); // Remove undefined values

console.log('🔧 CORS Configuration:');
console.log('✅ Allowed origins:', allowedOrigins);
console.log('🌐 Frontend URL env:', process.env.FRONTEND_URL);
console.log('🛡️ Admin URL env:', process.env.ADMIN_URL);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('🌐 Allowing request with no origin (likely mobile app or direct API call)');
            return callback(null, true);
        }

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            // Handle exact matches and wildcard patterns
            if (allowedOrigin === origin) return true;
            // Allow subdomains for Vercel deployments
            if (allowedOrigin.includes('vercel.app') && origin.includes('vercel.app')) return true;
            return false;
        });

        if (isAllowed) {
            console.log('✅ CORS allowed for origin:', origin);
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            console.log('📋 Allowed origins:', allowedOrigins);
            // For development, allow all Vercel origins
            if (origin && origin.includes('vercel.app')) {
                console.log('🔄 Allowing Vercel origin for development');
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'token',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-CSRF-Token',
        'X-Auth-Token'
    ],
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    preflightContinue: false,
    maxAge: 86400 // Cache preflight for 24 hours
}

app.use(cors(corsOptions))

// Handle preflight requests explicitly
app.options('*', (req, res) => {
    console.log('🔄 Handling preflight request for:', req.method, req.path, 'from:', req.headers.origin);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, token, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

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
