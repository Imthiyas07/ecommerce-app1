import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
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
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://api.razorpay.com",
                "https://checkout.razorpay.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://api.razorpay.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "http:",
                "https://api.razorpay.com",
                "https://checkout.razorpay.com"
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://api.razorpay.com",
                "https://checkout.razorpay.com",
                "https://maps.googleapis.com",
                "https://www.google.com",
                "https://www.gstatic.com"
            ],
            connectSrc: [
                "'self'",
                "https://api.razorpay.com",
                "https://checkout.razorpay.com",
                "https://maps.googleapis.com",
                "https://www.google.com"
            ],
            frameSrc: [
                "'self'",
                "https://api.razorpay.com",
                "https://checkout.razorpay.com",
                "https://www.google.com",
                "https://maps.google.com"
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Additional headers to fix browser warnings
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    // Disable some restrictive headers that cause issues with third-party services
    contentSecurityPolicy: false, // We'll handle CSP manually
    crossOriginOpenerPolicy: false,
    originAgentCluster: false
}))

// Manual CSP headers to allow third-party services
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://api.razorpay.com https://checkout.razorpay.com https://maps.googleapis.com https://www.google.com https://www.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.razorpay.com https://checkout.razorpay.com",
            "img-src 'self' data: https: http: https://api.razorpay.com https://checkout.razorpay.com",
            "font-src 'self' https://fonts.gstatic.com https://api.razorpay.com",
            "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://maps.googleapis.com https://www.google.com",
            "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.google.com https://maps.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ')
    );

    // Additional headers to fix cookie warnings
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

    // Permissions Policy to allow Razorpay features
    res.setHeader('Permissions-Policy',
        'otp-credentials=(self "https://api.razorpay.com" "https://checkout.razorpay.com"), ' +
        'payment=(self "https://api.razorpay.com" "https://checkout.razorpay.com"), ' +
        'clipboard-write=(self "https://api.razorpay.com" "https://checkout.razorpay.com")'
    );

    next();
});

// Compression middleware for better performance
app.use(compression({
    level: 6, // Good balance between speed and compression
    threshold: 1024, // Only compress responses larger than 1KB
}))

// Rate limiting for production (million users)
const isProduction = process.env.NODE_ENV === 'production'
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 1000 : 10000, // Stricter in production
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path === '/health' || req.path === '/test',
})

// Apply rate limiting
if (isProduction) {
    app.use('/api/', limiter) // Only rate limit API routes in production
} else {
    app.use('/api/', rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10000, // More lenient in development
        message: 'Too many requests from this IP, please try again later.',
    }))
}

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

// Health check endpoint for load balancers and monitoring
app.get('/health', (req, res) => {
    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development',
        database: 'unknown'
    }

    // Check database connection
    try {
        const mongoose = require('mongoose')
        healthCheck.database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    } catch (error) {
        healthCheck.database = 'error'
    }

    const statusCode = healthCheck.database === 'connected' ? 200 : 503
    res.status(statusCode).json(healthCheck)
})

app.get('/',(req,res)=>{
    res.send("API Working")
})

// Test endpoint for debugging
app.get('/test',(req,res)=>{
    res.json({
        message: "Test endpoint working",
        timestamp: new Date().toISOString(),
        mongodb: process.env.MONGODB_URI ? "Configured" : "Not configured",
        environment: process.env.NODE_ENV || 'development',
        version: process.version
    })
})

app.listen(port, ()=> console.log('Server started on PORT : '+ port))
