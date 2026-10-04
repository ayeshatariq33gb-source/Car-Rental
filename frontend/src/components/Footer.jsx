import { defaultContent, useContent } from '../ContentContext'

function Footer({ goTo, onAbout }) {
  const { content } = useContent()
  const footerContent = content?.footer || defaultContent.footer
  const links = Array.isArray(footerContent.quickLinks) ? footerContent.quickLinks : defaultContent.footer.quickLinks
  const navigateLink = (url) => {
    const route = { '/': 'home', '/cars': 'cars', '/about': 'about', '/contact': 'contact' }[url]
    if (route) goTo(route)
    else if (url?.startsWith('http')) window.open(url, '_blank', 'noopener,noreferrer')
  }
  return (
    <footer id="footer"><div className="footer-brand"><button className="brand" onClick={() => goTo('home')}><span className="brand-mark">R</span><span>roam<span className="brand-dot">.</span></span></button><p>{footerContent.tagline || defaultContent.footer.tagline}</p></div><div className="footer-links"><div><strong>{footerContent.exploreHeading || defaultContent.footer.exploreHeading}</strong>{links.map((link, index) => <button key={link._id || `${link.label}-${index}`} onClick={() => navigateLink(link.url)}>{link.label || 'Link'}</button>)}</div><div><strong>{footerContent.companyHeading || defaultContent.footer.companyHeading}</strong><button onClick={onAbout}>About us</button><button onClick={() => goTo('contact')}>Contact</button></div><div><strong>{footerContent.socialHeading || defaultContent.footer.socialHeading}</strong>{Object.entries(content?.contact?.socialMedia || {}).filter(([, url]) => url).map(([network, url]) => <button key={network} onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>{network}</button>)}</div></div><div className="footer-bottom"><span>{footerContent.copyrightText || defaultContent.footer.copyrightText}</span><span>{footerContent.tagline || defaultContent.footer.tagline}</span></div></footer>
  )
}

export default Footer
