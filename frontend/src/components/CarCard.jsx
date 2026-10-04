import { icons } from '../data/icons'

function CarCard({ car, onDetails }) {
  return <article className="car-card"><div className="car-image-wrap"><img src={car.image} alt={car.name} /><span className="card-tag">{car.accent}</span><button className="heart" aria-label={`Save ${car.name}`}>heart</button></div><div className="car-card-body"><div className="card-heading"><div><p className="eyebrow">{car.type}</p><h3>{car.name}</h3></div><span className="rating">star {car.rating}</span></div><div className="car-specs"><span>{car.seats} seats</span><span>automatic</span><span>{car.location}</span></div><div className="card-footer"><p><strong>${car.price}</strong> <small>/ day</small></p><button className="text-button" onClick={() => onDetails(car)}>View details <span>{icons.arrow}</span></button></div></div></article>
}

export default CarCard
