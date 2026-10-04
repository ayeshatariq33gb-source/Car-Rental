import CarCard from '../components/CarCard'
import SearchBox from '../components/SearchBox'
import { defaultContent, useContent } from '../ContentContext'

function Home({ cars, query, setQuery, goTo, onDetails }) {
  const { content } = useContent()
  const homeContent = content?.home || defaultContent.home
  const hero = content?.hero || defaultContent.hero
  const about = content?.about || defaultContent.about
  const services = Array.isArray(content?.services) ? content.services : defaultContent.services
  const testimonials = Array.isArray(content?.testimonials) ? content.testimonials : defaultContent.testimonials
  const faqs = Array.isArray(content?.faqs) ? content.faqs : []
  const availableCars = cars.filter((car) => car.available !== false && !car.maintenance)
  const heroCar = availableCars[0]
  const fleetLocations = [...new Set(availableCars.map((car) => car.location).filter(Boolean))].slice(0, 5)

  return <>
    <section className="hero-section">
      <div className="hero-copy">
        <p className="kicker">{homeContent.heroEyebrow || defaultContent.home.heroEyebrow}</p>
        <h1>{hero.title || defaultContent.hero.title}</h1>
        <p className="hero-description">{hero.subtitle || (heroCar ? `${availableCars.length} cars ready to rent, including the ${heroCar.name} in ${heroCar.location}.` : 'Our rental fleet is currently unavailable. Check back soon for cars from our live inventory.')}</p>
      </div>
      {heroCar && <div className="hero-car">
        <img src={hero.backgroundImageUrl || heroCar.image} alt={hero.backgroundImageUrl ? 'Roam rental journey' : `${heroCar.name} available in ${heroCar.location}`} />
        <div className="hero-caption"><span>{String(availableCars.length).padStart(2, '0')}</span><span>{heroCar.name} · {heroCar.location}</span></div>
      </div>}
      <SearchBox query={query} setQuery={setQuery} onSearch={() => goTo('cars')} buttonText={hero.ctaText} />
    </section>
    <section className="trusted">
      <span>{fleetLocations.length ? 'Available in' : 'Fleet locations'}</span>
      {fleetLocations.length ? fleetLocations.map((location) => <strong key={location}>{location.toUpperCase()}</strong>) : <strong>NO ACTIVE LOCATIONS</strong>}
    </section>
    <section className="section featured" id="cars">
      <div className="section-heading">
        <div><p className="kicker">{homeContent.featuredEyebrow || defaultContent.home.featuredEyebrow}</p><h2>{homeContent.featuredHeading || defaultContent.home.featuredHeading}</h2></div>
        <button className="outline-button" onClick={() => goTo('cars')}>View all cars <span>-&gt;</span></button>
      </div>
      <div className="car-grid">{availableCars.length ? availableCars.slice(0, 3).map((car) => <CarCard car={car} key={car.id} onDetails={onDetails} />) : <p className="empty-state">There are no available cars right now. Check back soon.</p>}</div>
    </section>
    <section className="why-section" id="why-roam">
      <div className="why-photo"><img src={about.bannerImageUrl || defaultContent.hero.backgroundImageUrl} alt="Road through the landscape" /><span>{about.heading || defaultContent.about.heading}</span></div>
      <div className="why-copy">
        <p className="kicker">{homeContent.aboutEyebrow || defaultContent.home.aboutEyebrow}</p><h2>{homeContent.aboutHeading || defaultContent.home.aboutHeading}</h2>
        <p>{about.missionStatement || about.description || defaultContent.about.missionStatement}</p>
        <div className="why-stats">{services.slice(0, 3).map((service, index) => <div key={`${service.title}-${index}`}><strong>{service.icon || `0${index + 1}`}</strong><span>{service.title || 'Service'}</span></div>)}</div>
        <button className="text-button" onClick={() => goTo('cars')}>{hero.ctaText || defaultContent.hero.ctaText} <span>-&gt;</span></button>
      </div>
    </section>
    {testimonials.map((testimonial, index) => <section className="quote-section" key={testimonial._id || `${testimonial.author}-${index}`}><p className="quote-mark">&quot;</p><blockquote>{testimonial.quote || ''}</blockquote><p className="quote-author">{testimonial.author || ''}<span>·</span>{testimonial.detail || ''}</p></section>)}
    {faqs.length > 0 && <section className="section faq-section"><div className="section-heading"><div><p className="kicker">{homeContent.faqEyebrow || defaultContent.home.faqEyebrow}</p><h2>{homeContent.faqHeading || defaultContent.home.faqHeading}</h2></div></div><div className="faq-list">{faqs.map((faq, index) => <details key={faq._id || `${faq.question}-${index}`}><summary>{faq.question || 'Question'}</summary><p>{faq.answer || ''}</p></details>)}</div></section>}
  </>
}

export default Home
