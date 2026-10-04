import { icons } from '../data/icons'

function SearchBox({ query, setQuery, onSearch, buttonText = 'Find a car' }) {
  return <div className="search-box"><label><span className="field-icon">{icons.pin}</span><span><small>Pick-up location</small><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="City, airport, or address" /></span></label><label><span className="field-icon">{icons.calendar}</span><span><small>Pick-up date</small><input type="date" defaultValue="2026-06-18" /></span></label><label><span className="field-icon">{icons.calendar}</span><span><small>Return date</small><input type="date" defaultValue="2026-06-22" /></span></label><button className="search-button" onClick={onSearch}>{buttonText || 'Find a car'} <span>{icons.arrow}</span></button></div>
}

export default SearchBox
