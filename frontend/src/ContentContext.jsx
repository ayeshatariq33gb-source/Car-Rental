import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

export const defaultContent = {
  isActive: true,
  home: {
    heroEyebrow: 'The road is yours',
    featuredEyebrow: 'Curated for you',
    featuredHeading: 'Find your next favorite.',
    aboutEyebrow: 'Why roam',
    aboutHeading: 'Less logistics. More living.',
    faqEyebrow: 'Good to know',
    faqHeading: 'Frequently asked questions.',
  },
  hero: {
    title: 'Go somewhere worth going.',
    subtitle: 'Find the road that finds you.',
    ctaText: 'Explore the fleet',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1600&q=85',
  },
  about: {
    eyebrow: 'The Roam story',
    heading: 'Travel should feel like freedom.',
    description: 'Thoughtful car rentals for the roads ahead.',
    missionStatement: 'Make every journey feel simple, personal, and open to possibility.',
    bannerImageUrl: 'https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=1200&q=85',
    valuesEyebrow: 'What we believe',
    valuesHeading: 'Go further. Stay curious.',
    ctaEyebrow: 'Your next chapter',
    ctaHeading: 'There is more road out there.',
    ctaText: 'Explore the fleet',
  },
  contact: {
    eyebrow: 'We are here to help',
    heading: 'Let us talk about your next trip.',
    supportEmail: 'hello@roam.example',
    phoneNumbers: [''],
    officeAddress: '',
    mapEmbedUrl: '',
    workingHours: '',
    socialMedia: { instagram: '', facebook: '', x: '', youtube: '', tiktok: '' },
  },
  services: [
    { title: 'Considered cars', icon: 'car', description: 'A well-maintained fleet, ready for the road.' },
    { title: 'Clear pricing', icon: 'check', description: 'Straightforward prices, with no surprises.' },
    { title: 'Human support', icon: 'support', description: 'Helpful people when your plans need a hand.' },
  ],
  faqs: [],
  testimonials: [],
  footer: {
    exploreHeading: 'Explore',
    companyHeading: 'Company',
    socialHeading: 'Follow along',
    copyrightText: '© 2026 Roam Rentals',
    tagline: 'Made for the way you move.',
    quickLinks: [
      { label: 'All cars', url: '/cars' },
      { label: 'About us', url: '/about' },
      { label: 'Contact', url: '/contact' },
    ],
  },
}

const ContentContext = createContext({
  content: defaultContent,
  loading: false,
  error: '',
  refresh: async () => defaultContent,
  saveContent: async () => defaultContent,
})

const mergeDefaults = (defaults, incoming) => Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
  const value = incoming?.[key]
  if (Array.isArray(fallback)) return [key, Array.isArray(value) ? value : fallback]
  if (fallback && typeof fallback === 'object') return [key, mergeDefaults(fallback, value)]
  return [key, value ?? fallback]
}))

export function ContentProvider({ children }) {
  const [content, setContent] = useState(defaultContent)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = async () => {
    setLoading(true)
    try {
      const response = await api.getSiteContent()
      setContent(mergeDefaults(defaultContent, response))
      setError('')
      return response
    } catch (requestError) {
      setError(requestError.message || 'Unable to load site content')
      return defaultContent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const saveContent = async (nextContent) => {
    const saved = await api.updateSiteContent(nextContent)
    setContent(mergeDefaults(defaultContent, saved))
    setError('')
    return saved
  }

  return <ContentContext.Provider value={{ content, loading, error, refresh, saveContent }}>{children}</ContentContext.Provider>
}

export const useContent = () => useContext(ContentContext)
