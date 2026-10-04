import Car from '../models/Car.js'
import mongoose from 'mongoose'

export const getCars = async (req, res) => {
  const filter = {}
  if (req.query.type) filter.type = req.query.type
  if (req.query.location) filter.location = new RegExp(req.query.location, 'i')
  if (req.query.available !== undefined) filter.available = req.query.available === 'true'
  res.json({ cars: await Car.find(filter).sort({ createdAt: -1 }) })
}

export const getCar = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid car id' })
  const car = await Car.findById(req.params.id)
  if (!car) return res.status(404).json({ message: 'Car not found' })
  res.json({ car })
}

export const createCar = async (req, res) => res.status(201).json({ car: await Car.create(req.body) })

export const updateCar = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid car id' })
  const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!car) return res.status(404).json({ message: 'Car not found' })
  res.json({ car })
}

export const deleteCar = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid car id' })
  const car = await Car.findByIdAndDelete(req.params.id)
  if (!car) return res.status(404).json({ message: 'Car not found' })
  res.json({ message: 'Car deleted successfully' })
}
