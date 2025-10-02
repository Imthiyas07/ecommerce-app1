import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Stripe from 'stripe'
import razorpay from 'razorpay'

// global variables
const currency = 'INR'
const deliveryCharge = 10

// gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const razorpayInstance = new razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_KEY_SECRET,
})

// Helper function to validate and update stock
const validateAndUpdateStock = async (items) => {
    for (const item of items) {
        const product = await productModel.findById(item._id);
        if (!product) {
            throw new Error(`Product ${item.name} not found`);
        }

        // Check stock by size
        const sizeStock = product.sizeStock?.get(item.size) || 0;
        if (sizeStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name} (${item.size}). Available: ${sizeStock}, Requested: ${item.quantity}`);
        }
    }

    // If all validations pass, update stock levels by size
    for (const item of items) {
        const updateQuery = {};
        updateQuery[`sizeStock.${item.size}`] = -item.quantity;

        await productModel.findByIdAndUpdate(item._id, {
            $inc: updateQuery
        });
    }
};

// Placing orders using COD Method
const placeOrder = async (req,res) => {

    try {

        const { userId, items, amount, address} = req.body;

        // Validate stock before creating order
        await validateAndUpdateStock(items);

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"COD",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true,message:"Order Placed"})


    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// Placing orders using Stripe Method
const placeOrderStripe = async (req,res) => {
    try {

        // Check if Stripe key is configured
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('Paste')) {
            return res.json({success:false,message:"Stripe payment is not configured. Please use COD or contact support."})
        }

        const { userId, items, amount, address} = req.body
        const { origin } = req.headers;

        // Validate stock before creating order
        await validateAndUpdateStock(items);

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Stripe",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency:currency,
                product_data: {
                    name:item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency:currency,
                product_data: {
                    name:'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:  `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

        res.json({success:true,session_url:session.url});

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Verify Stripe
const verifyStripe = async (req,res) => {

    const { orderId, success, userId } = req.body

    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            res.json({success: true});
        } else {
            // Payment failed - delete order and restore stock
            const order = await orderModel.findById(orderId);
            if (order && order.items) {
                // Restore stock for each item by size
                for (const item of order.items) {
                    const updateQuery = {};
                    updateQuery[`sizeStock.${item.size}`] = item.quantity;

                    await productModel.findByIdAndUpdate(item._id, {
                        $inc: updateQuery
                    });
                }
            }
            await orderModel.findByIdAndDelete(orderId)
            res.json({success:false})
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req,res) => {
    try {

        // Check if Razorpay keys are configured
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('Paste') ||
            !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('Paste')) {
            return res.json({success:false,message:"Razorpay payment is not configured. Please use COD or contact support."})
        }

        const { userId, items, amount, address} = req.body

        // Validate stock before creating order
        await validateAndUpdateStock(items);

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Razorpay",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const options = {
            amount: amount * 100,
            currency: currency.toUpperCase(),
            receipt : newOrder._id.toString()
        }

        await razorpayInstance.orders.create(options, (error,order)=>{
            if (error) {
                console.log(error)
                return res.json({success:false, message: error})
            }
            res.json({success:true,order})
        })

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const verifyRazorpay = async (req,res) => {
    try {
        
        const { userId, razorpay_order_id  } = req.body

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        if (orderInfo.status === 'paid') {
            await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true});
            await userModel.findByIdAndUpdate(userId,{cartData:{}})
            res.json({ success: true, message: "Payment Successful" })
        } else {
             res.json({ success: false, message: 'Payment Failed' });
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// All Orders data for Admin Panel
const allOrders = async (req,res) => {

    try {
        
        const orders = await orderModel.find({})
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// User Order Data For Forntend
const userOrders = async (req,res) => {
    try {
        
        const { userId } = req.body

        const orders = await orderModel.find({ userId })
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// update order status from Admin Panel
const updateStatus = async (req,res) => {
    try {

        const { orderId, status } = req.body

        // If status is "Delivered" and payment method is COD, mark payment as received
        const updateData = { status }
        if (status === 'Delivered') {
            const order = await orderModel.findById(orderId)
            if (order && order.paymentMethod === 'COD' && !order.payment) {
                updateData.payment = true
            }
        }

        await orderModel.findByIdAndUpdate(orderId, updateData)
        res.json({success:true,message:'Status Updated'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// cancel order by user
const cancelOrder = async (req,res) => {
    try {

        const { orderId, cancelReason } = req.body
        const { userId } = req.body

        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.json({success:false,message:'Order not found'})
        }

        if (order.userId !== userId) {
            return res.json({success:false,message:'Unauthorized'})
        }

        if (order.cancelled) {
            return res.json({success:false,message:'Order already cancelled'})
        }

        // Only allow cancellation if order is not shipped or delivered
        if (order.status === 'Shipped' || order.status === 'Out for delivery' || order.status === 'Delivered') {
            return res.json({success:false,message:'Cannot cancel order that has been shipped or delivered'})
        }

        await orderModel.findByIdAndUpdate(orderId, {
            cancelled: true,
            cancelReason,
            cancelDate: Date.now(),
            status: 'Canceled'
        })

        res.json({success:true,message:'Order cancelled successfully'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Analytics data for Admin Panel
const getAnalytics = async (req,res) => {
    try {
        const orders = await orderModel.find({})

        // Separate active and cancelled orders
        const activeOrders = orders.filter(order => !order.cancelled)
        const cancelledOrders = orders.filter(order => order.cancelled)

        // Basic analytics - only count active orders for most metrics
        const totalOrders = activeOrders.length
        const totalRevenue = activeOrders.reduce((sum, order) => sum + (order.payment ? order.amount : 0), 0)
        const pendingPayments = activeOrders.filter(order => !order.payment).length
        const totalCancelledOrders = cancelledOrders.length

        // Status distribution - only for active orders
        const statusCounts = activeOrders.reduce((acc, order) => {
            const status = order.status || 'Order Placed'
            acc[status] = (acc[status] || 0) + 1
            return acc
        }, {})

        // Ensure we have all possible statuses represented
        const defaultStatuses = ['Order Placed', 'Processing', 'Shipped', 'Out for delivery', 'Delivered']
        defaultStatuses.forEach(status => {
            if (!statusCounts[status]) {
                statusCounts[status] = 0
            }
        })

        // Cancellation reasons
        const cancellationReasons = cancelledOrders
            .filter(order => order.cancelled && order.cancelReason)
            .map(order => ({
                reason: order.cancelReason,
                date: order.cancelDate,
                orderId: order._id,
                amount: order.amount
            }))

        // Recent orders (last 30 days) - include both active and cancelled
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
        const recentOrders = orders.filter(order => order.date > thirtyDaysAgo).length

        // Daily revenue for last 7 days - only from paid active orders
        const dailyRevenue = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            const nextDay = new Date(date)
            nextDay.setDate(nextDay.getDate() + 1)

            const dayOrders = activeOrders.filter(order =>
                order.date >= date.getTime() &&
                order.date < nextDay.getTime() &&
                order.payment
            )

            const dayRevenue = dayOrders.reduce((sum, order) => sum + order.amount, 0)

            dailyRevenue.push({
                date: date.toISOString().split('T')[0],
                revenue: dayRevenue,
                orders: dayOrders.length
            })
        }

        // Top products (most ordered) - from all orders including cancelled
        const productCounts = {}
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item.name && item.quantity) {
                        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity
                    }
                })
            }
        })

        const topProducts = Object.entries(productCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))

        // Calculate completion rate
        const completedOrders = activeOrders.filter(order => order.status === 'Delivered').length
        const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

        res.json({
            success: true,
            analytics: {
                totalOrders,
                totalRevenue,
                pendingOrders: pendingPayments,
                cancelledOrders: totalCancelledOrders,
                statusCounts,
                cancellationReasons,
                recentOrders,
                dailyRevenue,
                topProducts,
                completionRate
            }
        })

    } catch (error) {
        console.log('Analytics error:', error)
        res.json({success:false,message:error.message})
    }
}

export {verifyRazorpay, verifyStripe ,placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, cancelOrder, getAnalytics}
