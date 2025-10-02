import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    sizes: { type: Array, required: true },
    bestseller: { type: Boolean },
    date: { type: Number, required: true },
    stock: { type: Number, default: 0 }, // Total stock (calculated from sizeStock)
    sizeStock: { type: Map, of: Number, default: {} }, // Stock per size: {'S': 5, 'M': 3, 'XL': 2}
    minStock: { type: Number, default: 5 },
    sku: { type: String, unique: true },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 }, // Average rating
    reviewCount: { type: Number, default: 0 } // Number of reviews
})

productSchema.plugin(mongoosePaginate);

const productModel  = mongoose.models.product || mongoose.model("product",productSchema);

export default productModel
