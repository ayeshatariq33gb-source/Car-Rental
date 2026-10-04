import mongoose from 'mongoose'

const { Schema } = mongoose

export const defaultSiteContent = {
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
  isActive: true,
}

const serviceSchema = new Schema({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  description: { type: String, default: '' },
}, { _id: true })

const faqSchema = new Schema({
  question: { type: String, default: '' },
  answer: { type: String, default: '' },
}, { _id: true })

const testimonialSchema = new Schema({
  quote: { type: String, default: '' },
  author: { type: String, default: '' },
  detail: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { _id: true })

const quickLinkSchema = new Schema({
  label: { type: String, default: '' },
  url: { type: String, default: '' },
}, { _id: true })

const siteContentSchema = new Schema({
  key: { type: String, default: 'primary', unique: true, immutable: true },
  home: {
    heroEyebrow: { type: String, default: defaultSiteContent.home.heroEyebrow },
    featuredEyebrow: { type: String, default: defaultSiteContent.home.featuredEyebrow },
    featuredHeading: { type: String, default: defaultSiteContent.home.featuredHeading },
    aboutEyebrow: { type: String, default: defaultSiteContent.home.aboutEyebrow },
    aboutHeading: { type: String, default: defaultSiteContent.home.aboutHeading },
    faqEyebrow: { type: String, default: defaultSiteContent.home.faqEyebrow },
    faqHeading: { type: String, default: defaultSiteContent.home.faqHeading },
  },
  hero: {
    title: { type: String, default: defaultSiteContent.hero.title },
    subtitle: { type: String, default: defaultSiteContent.hero.subtitle },
    ctaText: { type: String, default: defaultSiteContent.hero.ctaText },
    backgroundImageUrl: { type: String, default: defaultSiteContent.hero.backgroundImageUrl },
  },
  about: {
    eyebrow: { type: String, default: defaultSiteContent.about.eyebrow },
    heading: { type: String, default: defaultSiteContent.about.heading },
    description: { type: String, default: defaultSiteContent.about.description },
    missionStatement: { type: String, default: defaultSiteContent.about.missionStatement },
    bannerImageUrl: { type: String, default: defaultSiteContent.about.bannerImageUrl },
    valuesEyebrow: { type: String, default: defaultSiteContent.about.valuesEyebrow },
    valuesHeading: { type: String, default: defaultSiteContent.about.valuesHeading },
    ctaEyebrow: { type: String, default: defaultSiteContent.about.ctaEyebrow },
    ctaHeading: { type: String, default: defaultSiteContent.about.ctaHeading },
    ctaText: { type: String, default: defaultSiteContent.about.ctaText },
  },
  contact: {
    eyebrow: { type: String, default: defaultSiteContent.contact.eyebrow },
    heading: { type: String, default: defaultSiteContent.contact.heading },
    supportEmail: { type: String, default: defaultSiteContent.contact.supportEmail },
    phoneNumbers: { type: [String], default: defaultSiteContent.contact.phoneNumbers },
    officeAddress: { type: String, default: '' },
    mapEmbedUrl: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    socialMedia: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      x: { type: String, default: '' },
      youtube: { type: String, default: '' },
      tiktok: { type: String, default: '' },
    },
  },
  services: { type: [serviceSchema], default: defaultSiteContent.services },
  faqs: { type: [faqSchema], default: [] },
  testimonials: { type: [testimonialSchema], default: [] },
  footer: {
    exploreHeading: { type: String, default: defaultSiteContent.footer.exploreHeading },
    companyHeading: { type: String, default: defaultSiteContent.footer.companyHeading },
    socialHeading: { type: String, default: defaultSiteContent.footer.socialHeading },
    copyrightText: { type: String, default: defaultSiteContent.footer.copyrightText },
    tagline: { type: String, default: defaultSiteContent.footer.tagline },
    quickLinks: { type: [quickLinkSchema], default: defaultSiteContent.footer.quickLinks },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, minimize: false })

const SiteContent = mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema)
export default SiteContent
