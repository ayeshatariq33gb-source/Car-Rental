import mongoose from 'mongoose'

const carSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['Luxury', 'SUV', 'Electric', 'Sport', 'Sedan', 'Compact'] },
  seats: { type: Number, required: true, min: 1 },
  transmission: { type: String, enum: ['Automatic', 'Manual'], default: 'Automatic' },
  price: { type: Number, required: true, min: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  location: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  accent: { type: String, default: 'Available now' },
  available: { type: Boolean, default: true },
  maintenance: { type: Boolean, default: false },
  specs: { type: Map, of: String, default: {} },
}, { timestamps: true })

export default mongoose.model('Car', carSchema)
