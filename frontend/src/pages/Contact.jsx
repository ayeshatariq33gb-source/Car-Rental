import { defaultContent, useContent } from '../ContentContext'

function Contact() {
  const { content } = useContent()
  const contact = content?.contact || defaultContent.contact
  const phones = Array.isArray(contact.phoneNumbers) ? contact.phoneNumbers.filter(Boolean) : []
  const socials = Object.entries(contact.socialMedia || {}).filter(([, url]) => Boolean(url))

  return <section className="section contact-page">
    <div className="contact-heading">
      <div><p className="kicker">{contact.eyebrow || defaultContent.contact.eyebrow}</p><h1>{contact.heading || defaultContent.contact.heading}</h1></div>
      <p>{contact.workingHours || 'Send us a note and our team will get back to you.'}</p>
    </div>
    <div className="contact-layout">
      <div className="contact-details">
        <div><span>Email</span><a href={`mailto:${contact.supportEmail || defaultContent.contact.supportEmail}`}>{contact.supportEmail || defaultContent.contact.supportEmail}</a></div>
        {phones.map((phone) => <div key={phone}><span>Phone</span><a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a></div>)}
        {contact.officeAddress && <div><span>Office</span><p>{contact.officeAddress}</p></div>}
        {contact.workingHours && <div><span>Working hours</span><p>{contact.workingHours}</p></div>}
        {socials.length > 0 && <div><span>Social</span><div className="contact-socials">{socials.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer">{name}</a>)}</div></div>}
      </div>
      {contact.mapEmbedUrl && <div className="contact-map"><iframe title="Office map" src={contact.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>}
    </div>
  </section>
}

export default Contact
