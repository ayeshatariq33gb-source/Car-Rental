import mongoose from 'mongoose'
import SiteContent, { defaultSiteContent } from '../models/SiteContent.js'

const editableCollections = {
  services: ['title', 'icon', 'description'],
  faqs: ['question', 'answer'],
  testimonials: ['quote', 'author', 'detail', 'imageUrl'],
  quickLinks: ['label', 'url'],
}

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const mergeContent = (defaults, current, incoming) => {
  const merged = Object.fromEntries(Object.keys(defaults).map((key) => [key, current?.[key] ?? defaults[key]]))
  for (const key of Object.keys(defaults)) {
    const value = incoming?.[key]
    if (value === undefined) continue
    const fallback = defaults[key]
    const currentValue = current?.[key]
    if (Array.isArray(fallback)) {
      merged[key] = Array.isArray(value) ? value : currentValue ?? fallback
    } else if (isRecord(fallback)) {
      merged[key] = isRecord(value) ? mergeContent(fallback, currentValue || {}, value) : currentValue || fallback
    } else if (typeof value === typeof fallback) {
      merged[key] = value
    }
  }
  return merged
}

const getOrCreateContent = async () => {
  let content = await SiteContent.findOne({ key: 'primary' })
  if (!content) content = await SiteContent.create({ key: 'primary' })
  return content
}

export const getContent = async (_req, res) => {
  const content = await SiteContent.findOne({ key: 'primary', isActive: true }).lean()
  res.json({ content: content ? mergeContent(defaultSiteContent, {}, content) : defaultSiteContent })
}

export const updateContent = async (req, res) => {
  const incoming = req.body?.content ?? req.body
  if (!isRecord(incoming)) return res.status(400).json({ message: 'Content must be a JSON object' })
  const existing = await SiteContent.findOne({ key: 'primary' }).lean()
  const merged = mergeContent(defaultSiteContent, existing || {}, incoming)
  const content = await SiteContent.findOneAndUpdate(
    { key: 'primary' },
    { $set: { ...merged, key: 'primary' } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )
  res.json({ content: mergeContent(defaultSiteContent, {}, content.toObject()) })
}

export const addContentItem = async (req, res) => {
  const { collection } = req.params
  const allowedFields = editableCollections[collection]
  if (!allowedFields) return res.status(404).json({ message: 'Unsupported content collection' })
  if (!isRecord(req.body)) return res.status(400).json({ message: 'Item must be a JSON object' })
  const item = Object.fromEntries(allowedFields.map((field) => [field, String(req.body[field] ?? '').trim()]))
  const content = await getOrCreateContent()
  const target = collection === 'quickLinks' ? content.footer.quickLinks : content[collection]
  target.push(item)
  await content.save()
  res.status(201).json({ content: mergeContent(defaultSiteContent, {}, content.toObject()), item: target[target.length - 1] })
}

export const updateContentItem = async (req, res) => {
  const { collection, itemId } = req.params
  const allowedFields = editableCollections[collection]
  if (!allowedFields) return res.status(404).json({ message: 'Unsupported content collection' })
  if (!mongoose.isValidObjectId(itemId)) return res.status(400).json({ message: 'Invalid content item id' })
  if (!isRecord(req.body)) return res.status(400).json({ message: 'Item must be a JSON object' })
  const content = await SiteContent.findOne({ key: 'primary' })
  if (!content) return res.status(404).json({ message: 'Content item not found' })
  const target = collection === 'quickLinks' ? content.footer.quickLinks : content[collection]
  const item = target.id(itemId)
  if (!item) return res.status(404).json({ message: 'Content item not found' })
  for (const field of allowedFields) {
    if (Object.hasOwn(req.body, field)) item[field] = String(req.body[field] ?? '').trim()
  }
  await content.save()
  res.json({ content: mergeContent(defaultSiteContent, {}, content.toObject()), item })
}

export const deleteContentItem = async (req, res) => {
  const { collection, itemId } = req.params
  if (!editableCollections[collection]) return res.status(404).json({ message: 'Unsupported content collection' })
  if (!mongoose.isValidObjectId(itemId)) return res.status(400).json({ message: 'Invalid content item id' })
  const content = await SiteContent.findOne({ key: 'primary' })
  if (!content) return res.status(404).json({ message: 'Content item not found' })
  const target = collection === 'quickLinks' ? content.footer.quickLinks : content[collection]
  const item = target.id(itemId)
  if (!item) return res.status(404).json({ message: 'Content item not found' })
  item.deleteOne()
  await content.save()
  res.json({ content: mergeContent(defaultSiteContent, {}, content.toObject()) })
}
