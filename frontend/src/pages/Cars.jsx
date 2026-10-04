import CarCard from '../components/CarCard'

function Cars({ cars, loading, query, setQuery, type, setType, onDetails }) {
  return <section className="listing-page section"><div className="listing-title"><div><p className="kicker">The Roam fleet</p><h1>Choose your <em>companion.</em></h1></div><p>{loading ? 'Loading cars...' : `${cars.length} cars ready for your next trip`}</p></div><div className="filter-bar"><label className="filter-search"><span>pin</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city or car" /></label><div className="filter-pills">{['All', 'Luxury', 'SUV', 'Electric', 'Sport'].map((option) => <button className={type === option ? 'selected' : ''} key={option} onClick={() => setType(option)}>{option}</button>)}</div></div>{loading ? <p className="loading-state" role="status">Loading the Roam fleet...</p> : cars.length ? <div className="car-grid full-grid">{cars.map((car) => <CarCard car={car} key={car.id} onDetails={onDetails} />)}</div> : <div className="empty-state"><h2>No cars found</h2><p>Try another city or clear your filters.</p><button className="outline-button" onClick={() => { setQuery(''); setType('All') }}>Clear filters</button></div>}</section>
}

export default Cars
