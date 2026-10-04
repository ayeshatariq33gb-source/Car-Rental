import { defaultContent, useContent } from '../ContentContext'

function About({ goTo }) {
  const { content } = useContent()
  const about = content?.about || defaultContent.about
  const services = Array.isArray(content?.services) ? content.services : defaultContent.services
  return <section className="about-page section">
    <div className="about-hero">
      <div>
        <p className="kicker">{about.eyebrow || 'The Roam story'}</p>
        <h1>{about.heading || defaultContent.about.heading}</h1>
        <p className="about-lead">{about.description || defaultContent.about.description}</p>
      </div>
      <div className="about-hero-image"><img src={about.bannerImageUrl || defaultContent.hero.backgroundImageUrl} alt="Open road through a green forest" /><span>Our mission<br /><em>Made to wander.</em></span></div>
    </div>
    <div className="about-values">
      <div><p className="kicker">{about.valuesEyebrow || 'What we believe'}</p><h2>{about.valuesHeading || 'Go further. Stay curious.'}</h2></div>
      <div className="about-value-copy"><p>{about.missionStatement || defaultContent.about.missionStatement}</p><div className="about-value-grid">{services.map((service, index) => <div key={`${service.title}-${index}`}><strong>{service.icon || String(index + 1).padStart(2, '0')}</strong><h3>{service.title || 'Service'}</h3><p>{service.description || ''}</p></div>)}</div></div>
    </div>
    <div className="about-cta"><p className="kicker">{about.ctaEyebrow || 'Your next chapter'}</p><h2>{about.ctaHeading || 'There is more road out there.'}</h2><button className="primary-button" onClick={() => goTo('cars')}>{about.ctaText || 'Explore the fleet'} <span>-&gt;</span></button></div>
  </section>
}

export default About
