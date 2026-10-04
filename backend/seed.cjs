const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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
  available: { type: Boolean, default: true }
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);

const sampleCars = [
  { 
    name: 'Audi A5 Sportback', 
    type: 'Luxury', 
    seats: 5, 
    transmission: 'Automatic', 
    price: 89, 
    rating: 4.9, 
    location: 'New York', 
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=900&q=85', 
    accent: 'Most popular' 
  },
  { 
    name: 'Range Rover Evoque', 
    type: 'SUV', 
    seats: 5, 
    transmission: 'Automatic', 
    price: 112, 
    rating: 4.8, 
    location: 'Los Angeles', 
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=85', 
    accent: 'New arrival' 
  },
  { 
    name: 'Mercedes-Benz C-Class', 
    type: 'Luxury', 
    seats: 5, 
    transmission: 'Automatic', 
    price: 105, 
    rating: 4.9, 
    location: 'Miami', 
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=85', 
    accent: 'Executive pick' 
  },
  { 
    name: 'Volvo XC40 Recharge', 
    type: 'Electric', 
    seats: 5, 
    transmission: 'Automatic', 
    price: 95, 
    rating: 4.7, 
    location: 'Austin', 
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=85', 
    accent: 'Eco choice' 
  },
  { 
    name: 'BMW 4 Series Coupe', 
    type: 'Sport', 
    seats: 4, 
    transmission: 'Automatic', 
    price: 120, 
    rating: 4.9, 
    location: 'Chicago', 
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=85', 
    accent: 'Weekend ready' 
  },
  { 
    name: 'Tesla Model 3', 
    type: 'Electric', 
    seats: 5, 
    transmission: 'Automatic', 
    price: 69, 
    rating: 4.6, 
    location: 'San Francisco', 
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=900&q=85', 
    accent: 'Smart value' 
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database Connected for Seeding...');

    let inserted = 0;
    for (const car of sampleCars) {
      const result = await Car.updateOne({ name: car.name }, { $setOnInsert: car }, { upsert: true });
      if (result.upsertedCount) inserted += 1;
    }
    console.log(`Seed complete: added ${inserted} cars; existing cars were preserved.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error with seed data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();