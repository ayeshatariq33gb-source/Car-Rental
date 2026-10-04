import { useEffect, useState } from 'react'
import { defaultContent, useContent } from '../ContentContext'

const tabs = [
  { id: 'hero', label: 'Hero Banner' },
  { id: 'about', label: 'About & Services' },
  { id: 'contact', label: 'Contact Details' },
  { id: 'faqs', label: 'FAQs' },
]

const blankService = () => ({ title: '', icon: '', description: '' })
const blankFaq = () => ({ question: '', answer: '' })
const blankTestimonial = () => ({ quote: '', author: '', detail: '', imageUrl: '' })
const blankQuickLink = () => ({ label: '', url: '' })

function AdminContentEditor() {
  const { content, saveContent, loading: contentLoading } = useContent()
  const [draft, setDraft] = useState(content)
  const [activeTab, setActiveTab] = useState('hero')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: '', text: '' })

  useEffect(() => { setDraft({ ...defaultContent, ...content }) }, [content])

  const updateSection = (section, key, value) => {
    setDraft((current) => ({
      ...current,
      [section]: { ...(current[section] || defaultContent[section]), [key]: value },
    }))
  }

  const updateItem = (collection, index, key, value) => {
    setDraft((current) => ({
      ...current,
      [collection]: (current[collection] || []).map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }))
  }

  const updateQuickLink = (index, key, value) => {
    setDraft((current) => ({
      ...current,
      footer: {
        ...(current.footer || defaultContent.footer),
        quickLinks: (current.footer?.quickLinks || []).map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
      },
    }))
  }

  const updateSocial = (key, value) => updateSection('contact', 'socialMedia', {
    ...(draft.contact?.socialMedia || defaultContent.contact.socialMedia),
    [key]: value,
  })

  const updatePhone = (index, value) => updateSection('contact', 'phoneNumbers',
    (draft.contact?.phoneNumbers || []).map((phone, phoneIndex) => phoneIndex === index ? value : phone))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice({ type: '', text: '' })
    try {
      await saveContent(draft)
      setNotice({ type: 'success', text: 'Site content saved.' })
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to save content.' })
    } finally {
      setSaving(false)
    }
  }

  const addItem = (collection, item) => setDraft((current) => ({ ...current, [collection]: [...(current[collection] || []), item()] }))
  const removeItem = (collection, index) => setDraft((current) => ({
    ...current,
    [collection]: (current[collection] || []).filter((_, itemIndex) => itemIndex !== index),
  }))
  const addQuickLink = () => setDraft((current) => ({
    ...current,
    footer: { ...(current.footer || defaultContent.footer), quickLinks: [...(current.footer?.quickLinks || []), blankQuickLink()] },
  }))
  const removeQuickLink = (index) => setDraft((current) => ({
    ...current,
    footer: { ...(current.footer || defaultContent.footer), quickLinks: (current.footer?.quickLinks || []).filter((_, itemIndex) => itemIndex !== index) },
  }))

  return <form className="cms-editor" onSubmit={save}>
    <div className="cms-editor-head">
      <div>
        <p className="kicker">Website content</p>
        <h2>Content editor</h2>
        <p>Changes are published as soon as they are saved.</p>
      </div>
      <button className="admin-action-button" type="submit" disabled={saving || contentLoading}>
        {saving ? 'Saving…' : contentLoading ? 'Loading…' : 'Save changes'}
      </button>
    </div>

    <div className="cms-tabs" role="tablist" aria-label="Content sections">
      {tabs.map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? 'active' : ''} key={tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
    </div>

    {notice.text && <p className={`cms-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'} aria-live="polite">{notice.text}</p>}

    {activeTab === 'hero' && <div className="cms-fields">
      <Field label="Hero eyebrow" value={draft.home?.heroEyebrow} onChange={(value) => updateSection('home', 'heroEyebrow', value)} />
      <Field label="Hero title" value={draft.hero?.title} onChange={(value) => updateSection('hero', 'title', value)} />
      <Field label="Subtitle" value={draft.hero?.subtitle} onChange={(value) => updateSection('hero', 'subtitle', value)} multiline />
      <Field label="Call-to-action text" value={draft.hero?.ctaText} onChange={(value) => updateSection('hero', 'ctaText', value)} />
      <Field label="Background image URL" value={draft.hero?.backgroundImageUrl} onChange={(value) => updateSection('hero', 'backgroundImageUrl', value)} type="url" placeholder="https://…" />
      {draft.hero?.backgroundImageUrl && <img className="cms-image-preview" src={draft.hero.backgroundImageUrl} alt="Hero image preview" onError={(event) => { event.currentTarget.hidden = true }} />}
      <section className="cms-subsection">
        <h3>Homepage section headings</h3>
        <Field label="Featured cars eyebrow" value={draft.home?.featuredEyebrow} onChange={(value) => updateSection('home', 'featuredEyebrow', value)} />
        <Field label="Featured cars heading" value={draft.home?.featuredHeading} onChange={(value) => updateSection('home', 'featuredHeading', value)} />
        <Field label="About section eyebrow" value={draft.home?.aboutEyebrow} onChange={(value) => updateSection('home', 'aboutEyebrow', value)} />
        <Field label="About section heading" value={draft.home?.aboutHeading} onChange={(value) => updateSection('home', 'aboutHeading', value)} />
      </section>
    </div>}

    {activeTab === 'about' && <div className="cms-fields">
      <Field label="About page eyebrow" value={draft.about?.eyebrow} onChange={(value) => updateSection('about', 'eyebrow', value)} />
      <Field label="About heading" value={draft.about?.heading} onChange={(value) => updateSection('about', 'heading', value)} />
      <Field label="About description" value={draft.about?.description} onChange={(value) => updateSection('about', 'description', value)} multiline />
      <Field label="Mission statement" value={draft.about?.missionStatement} onChange={(value) => updateSection('about', 'missionStatement', value)} multiline />
      <Field label="Banner image URL" value={draft.about?.bannerImageUrl} onChange={(value) => updateSection('about', 'bannerImageUrl', value)} type="url" placeholder="https://…" />
      <Field label="Values eyebrow" value={draft.about?.valuesEyebrow} onChange={(value) => updateSection('about', 'valuesEyebrow', value)} />
      <Field label="Values heading" value={draft.about?.valuesHeading} onChange={(value) => updateSection('about', 'valuesHeading', value)} />
      <Field label="About CTA eyebrow" value={draft.about?.ctaEyebrow} onChange={(value) => updateSection('about', 'ctaEyebrow', value)} />
      <Field label="About CTA heading" value={draft.about?.ctaHeading} onChange={(value) => updateSection('about', 'ctaHeading', value)} />
      <Field label="About CTA button text" value={draft.about?.ctaText} onChange={(value) => updateSection('about', 'ctaText', value)} />
      <CollectionEditor title="Services / features" items={draft.services || []} fields={[
        ['title', 'Title'], ['icon', 'Icon name or mark'], ['description', 'Description'],
      ]} onChange={(index, key, value) => updateItem('services', index, key, value)} onAdd={() => addItem('services', blankService)} onRemove={(index) => removeItem('services', index)} />
      <CollectionEditor title="Testimonials" items={draft.testimonials || []} fields={[
        ['author', 'Name'], ['detail', 'Role or detail'], ['quote', 'Quote'], ['imageUrl', 'Image URL'],
      ]} onChange={(index, key, value) => updateItem('testimonials', index, key, value)} onAdd={() => addItem('testimonials', blankTestimonial)} onRemove={(index) => removeItem('testimonials', index)} />
      <section className="cms-subsection">
        <h3>Footer content</h3>
        <Field label="Explore column heading" value={draft.footer?.exploreHeading} onChange={(value) => updateSection('footer', 'exploreHeading', value)} />
        <Field label="Company column heading" value={draft.footer?.companyHeading} onChange={(value) => updateSection('footer', 'companyHeading', value)} />
        <Field label="Social column heading" value={draft.footer?.socialHeading} onChange={(value) => updateSection('footer', 'socialHeading', value)} />
        <Field label="Copyright text" value={draft.footer?.copyrightText} onChange={(value) => updateSection('footer', 'copyrightText', value)} />
        <Field label="Footer tagline" value={draft.footer?.tagline} onChange={(value) => updateSection('footer', 'tagline', value)} />
        <CollectionEditor title="Footer quick links" items={draft.footer?.quickLinks || []} fields={[
          ['label', 'Label'], ['url', 'URL or page path'],
        ]} onChange={updateQuickLink} onAdd={addQuickLink} onRemove={removeQuickLink} />
      </section>
    </div>}

    {activeTab === 'contact' && <div className="cms-fields">
      <Field label="Contact eyebrow" value={draft.contact?.eyebrow} onChange={(value) => updateSection('contact', 'eyebrow', value)} />
      <Field label="Contact heading" value={draft.contact?.heading} onChange={(value) => updateSection('contact', 'heading', value)} />
      <Field label="Support email" value={draft.contact?.supportEmail} onChange={(value) => updateSection('contact', 'supportEmail', value)} type="email" />
      <section className="cms-subsection">
        <div className="cms-subsection-heading"><h3>Phone numbers</h3><button type="button" className="cms-add" onClick={() => updateSection('contact', 'phoneNumbers', [...(draft.contact?.phoneNumbers || []), ''])}>Add phone</button></div>
        {(draft.contact?.phoneNumbers || []).map((phone, index) => <div className="cms-inline-row" key={`phone-${index}`}><Field label={`Phone ${index + 1}`} value={phone} onChange={(value) => updatePhone(index, value)} type="tel" /><ItemActions onRemove={() => updateSection('contact', 'phoneNumbers', draft.contact.phoneNumbers.filter((_, i) => i !== index))} /></div>)}
      </section>
      <Field label="Office address" value={draft.contact?.officeAddress} onChange={(value) => updateSection('contact', 'officeAddress', value)} multiline />
      <Field label="Map embed URL" value={draft.contact?.mapEmbedUrl} onChange={(value) => updateSection('contact', 'mapEmbedUrl', value)} type="url" placeholder="https://…" />
      <Field label="Working hours" value={draft.contact?.workingHours} onChange={(value) => updateSection('contact', 'workingHours', value)} multiline />
      <section className="cms-subsection">
        <h3>Social media</h3>
        <div className="cms-fields cms-social-grid">
          {Object.entries(draft.contact?.socialMedia || defaultContent.contact.socialMedia).map(([network, url]) => <Field key={network} label={network} value={url} onChange={(value) => updateSocial(network, value)} type="url" placeholder="https://…" />)}
        </div>
      </section>
    </div>}

    {activeTab === 'faqs' && <div className="cms-fields">
      <Field label="FAQ eyebrow" value={draft.home?.faqEyebrow} onChange={(value) => updateSection('home', 'faqEyebrow', value)} />
      <Field label="FAQ section heading" value={draft.home?.faqHeading} onChange={(value) => updateSection('home', 'faqHeading', value)} />
      <p className="cms-help">Questions and answers shown to visitors can be added, edited, or removed here.</p>
      <CollectionEditor title="Frequently asked questions" items={draft.faqs || []} fields={[
        ['question', 'Question'], ['answer', 'Answer'],
      ]} onChange={(index, key, value) => updateItem('faqs', index, key, value)} onAdd={() => addItem('faqs', blankFaq)} onRemove={(index) => removeItem('faqs', index)} />
    </div>}
  </form>
}

function Field({ label, value, onChange, multiline = false, type = 'text', placeholder = '' }) {
  return <label className="cms-field">
    <span>{label}</span>
    {multiline
      ? <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} />
      : <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}
  </label>
}

function CollectionEditor({ title, items, fields, onChange, onAdd, onRemove }) {
  const renderField = (index, [key, label]) => (
    <label className="cms-field" key={key}>
      <span>{label}</span>
      {key === 'description' || key === 'quote' || key === 'answer'
        ? <textarea rows={3} value={items[index]?.[key] ?? ''} onChange={(event) => onChange(index, key, event.target.value)} />
        : <input type={key.toLowerCase().includes('url') ? 'url' : 'text'} value={items[index]?.[key] ?? ''} onChange={(event) => onChange(index, key, event.target.value)} />}
    </label>
  )

  return <section className="cms-subsection">
    <div className="cms-subsection-heading"><h3>{title}</h3><button type="button" className="cms-add" onClick={onAdd}>Add item</button></div>
    {items.length ? items.map((item, index) => <div className="cms-item" key={item._id || `${title}-${index}`}>
      <div className="cms-item-fields">{fields.map((field) => renderField(index, field))}</div>
      <ItemActions onRemove={() => onRemove(index)} />
    </div>) : <p className="cms-help">No items yet.</p>}
  </section>
}

function ItemActions({ onRemove }) {
  return <button type="button" className="cms-remove" onClick={onRemove}>Remove</button>
}

export default AdminContentEditor
