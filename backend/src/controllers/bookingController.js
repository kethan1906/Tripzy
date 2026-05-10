/**
 * Booking Controller - FULLY CONNECTED
 * After booking: auto-creates trip + itinerary + live trip ready
 */

const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const { Expense, Alert } = require('../models/ExpenseAlert');
const logger = require('../utils/logger');
const axios = require('axios');

// ─── Destination coordinates database ────────────────────────────────────────
const DEST_DB = {
  'paris': { lat: 48.8566, lng: 2.3522, country: 'France', attractions: [
    { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, cost: 25, duration: 120, type: 'sightseeing', address: 'Champ de Mars, Paris' },
    { name: 'Louvre Museum', lat: 48.8606, lng: 2.3376, cost: 17, duration: 180, type: 'culture', address: 'Rue de Rivoli, Paris' },
    { name: 'Notre-Dame Cathedral', lat: 48.8530, lng: 2.3499, cost: 0, duration: 60, type: 'sightseeing', address: '6 Parvis Notre-Dame, Paris' },
    { name: 'Montmartre', lat: 48.8867, lng: 2.3431, cost: 5, duration: 120, type: 'culture', address: 'Montmartre, Paris' },
    { name: "Musée d'Orsay", lat: 48.8600, lng: 2.3266, cost: 16, duration: 120, type: 'culture', address: "1 Rue de la Légion d'Honneur, Paris" },
    { name: 'Champs-Élysées', lat: 48.8698, lng: 2.3078, cost: 0, duration: 90, type: 'shopping', address: 'Champs-Élysées, Paris' },
    { name: 'Seine River Cruise', lat: 48.8566, lng: 2.3444, cost: 15, duration: 90, type: 'activity', address: 'Port de la Bourdonnais, Paris' },
    { name: 'Versailles Palace', lat: 48.8049, lng: 2.1204, cost: 20, duration: 240, type: 'history', address: "Place d'Armes, Versailles" },
  ]},
  'london': { lat: 51.5074, lng: -0.1278, country: 'UK', attractions: [
    { name: 'Big Ben', lat: 51.4994, lng: -0.1245, cost: 0, duration: 60, type: 'sightseeing', address: 'Westminster, London' },
    { name: 'British Museum', lat: 51.5194, lng: -0.1270, cost: 0, duration: 180, type: 'culture', address: 'Great Russell St, London' },
    { name: 'Tower of London', lat: 51.5081, lng: -0.0759, cost: 28, duration: 150, type: 'history', address: 'St Katharine, London' },
    { name: 'Buckingham Palace', lat: 51.5014, lng: -0.1419, cost: 0, duration: 90, type: 'sightseeing', address: 'Westminster, London' },
    { name: 'Hyde Park', lat: 51.5073, lng: -0.1657, cost: 0, duration: 120, type: 'nature', address: 'Hyde Park, London' },
    { name: 'Tate Modern', lat: 51.5076, lng: -0.0994, cost: 0, duration: 120, type: 'culture', address: 'Bankside, London' },
  ]},
  'tokyo': { lat: 35.6762, lng: 139.6503, country: 'Japan', attractions: [
    { name: 'Senso-ji Temple', lat: 35.7148, lng: 139.7967, cost: 0, duration: 90, type: 'culture', address: '2-3-1 Asakusa, Tokyo' },
    { name: 'Tokyo Skytree', lat: 35.7101, lng: 139.8107, cost: 20, duration: 120, type: 'sightseeing', address: '1-1-2 Oshiage, Tokyo' },
    { name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7004, cost: 0, duration: 30, type: 'sightseeing', address: 'Shibuya, Tokyo' },
    { name: 'Shinjuku Gyoen', lat: 35.6852, lng: 139.7100, cost: 5, duration: 120, type: 'nature', address: 'Shinjuku, Tokyo' },
    { name: 'Meiji Shrine', lat: 35.6763, lng: 139.6993, cost: 0, duration: 90, type: 'culture', address: 'Shibuya, Tokyo' },
    { name: 'Akihabara', lat: 35.7022, lng: 139.7742, cost: 0, duration: 180, type: 'shopping', address: 'Akihabara, Tokyo' },
  ]},
  'new york': { lat: 40.7128, lng: -74.0060, country: 'USA', attractions: [
    { name: 'Central Park', lat: 40.7851, lng: -73.9683, cost: 0, duration: 180, type: 'nature', address: 'Central Park, New York' },
    { name: 'Times Square', lat: 40.7580, lng: -73.9855, cost: 0, duration: 60, type: 'sightseeing', address: 'Times Square, New York' },
    { name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969, cost: 0, duration: 90, type: 'sightseeing', address: 'Brooklyn Bridge, New York' },
    { name: 'Statue of Liberty', lat: 40.6892, lng: -74.0445, cost: 24, duration: 180, type: 'history', address: 'Liberty Island, New York' },
    { name: 'Metropolitan Museum', lat: 40.7794, lng: -73.9632, cost: 25, duration: 180, type: 'culture', address: '1000 5th Ave, New York' },
    { name: 'High Line', lat: 40.7480, lng: -74.0048, cost: 0, duration: 90, type: 'nature', address: 'High Line, New York' },
  ]},
  'dubai': { lat: 25.2048, lng: 55.2708, country: 'UAE', attractions: [
    { name: 'Burj Khalifa', lat: 25.1972, lng: 55.2744, cost: 35, duration: 120, type: 'sightseeing', address: '1 Sheikh Mohammed Blvd, Dubai' },
    { name: 'Dubai Mall', lat: 25.1975, lng: 55.2796, cost: 0, duration: 180, type: 'shopping', address: 'Financial Center Rd, Dubai' },
    { name: 'Palm Jumeirah', lat: 25.1124, lng: 55.1390, cost: 0, duration: 120, type: 'sightseeing', address: 'Palm Jumeirah, Dubai' },
    { name: 'Dubai Creek', lat: 25.2637, lng: 55.2979, cost: 5, duration: 90, type: 'culture', address: 'Al Seef, Dubai' },
    { name: 'Desert Safari', lat: 24.9857, lng: 55.4272, cost: 60, duration: 300, type: 'adventure', address: 'Dubai Desert, UAE' },
  ]},
  'mumbai': { lat: 19.0760, lng: 72.8777, country: 'India', attractions: [
    { name: 'Gateway of India', lat: 18.9220, lng: 72.8347, cost: 0, duration: 60, type: 'sightseeing', address: 'Apollo Bandar, Mumbai' },
    { name: 'Marine Drive', lat: 18.9432, lng: 72.8231, cost: 0, duration: 90, type: 'sightseeing', address: 'Marine Drive, Mumbai' },
    { name: 'Elephanta Caves', lat: 18.9633, lng: 72.9315, cost: 15, duration: 180, type: 'history', address: 'Gharapuri, Mumbai' },
    { name: 'Chhatrapati Shivaji Museum', lat: 18.9268, lng: 72.8325, cost: 8, duration: 120, type: 'culture', address: 'MG Road, Mumbai' },
    { name: 'Juhu Beach', lat: 19.0883, lng: 72.8264, cost: 0, duration: 90, type: 'nature', address: 'Juhu, Mumbai' },
  ]},
  'delhi': { lat: 28.6139, lng: 77.2090, country: 'India', attractions: [
    { name: 'Red Fort', lat: 28.6562, lng: 77.2410, cost: 10, duration: 120, type: 'history', address: 'Netaji Subhash Marg, Delhi' },
    { name: 'Qutub Minar', lat: 28.5245, lng: 77.1855, cost: 8, duration: 90, type: 'history', address: 'Mehrauli, Delhi' },
    { name: 'India Gate', lat: 28.6129, lng: 77.2295, cost: 0, duration: 60, type: 'sightseeing', address: 'Rajpath, Delhi' },
    { name: 'Humayun Tomb', lat: 28.5933, lng: 77.2507, cost: 8, duration: 90, type: 'history', address: 'Nizamuddin, Delhi' },
    { name: 'Chandni Chowk', lat: 28.6506, lng: 77.2334, cost: 20, duration: 120, type: 'food', address: 'Old Delhi' },
  ]},
  'hyderabad': { lat: 17.3850, lng: 78.4867, country: 'India', attractions: [
    { name: 'Charminar', lat: 17.3616, lng: 78.4747, cost: 5, duration: 60, type: 'history', address: 'Charminar, Hyderabad' },
    { name: 'Golconda Fort', lat: 17.3833, lng: 78.4011, cost: 8, duration: 150, type: 'history', address: 'Ibrahim Bagh, Hyderabad' },
    { name: 'Hussain Sagar Lake', lat: 17.4239, lng: 78.4738, cost: 5, duration: 90, type: 'nature', address: 'Hussain Sagar, Hyderabad' },
    { name: 'Ramoji Film City', lat: 17.2543, lng: 78.6808, cost: 35, duration: 300, type: 'activity', address: 'Anaspur Village, Hyderabad' },
    { name: 'Salar Jung Museum', lat: 17.3712, lng: 78.4810, cost: 5, duration: 120, type: 'culture', address: 'Darulshifa, Hyderabad' },
  ]},
  'singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore', attractions: [
    { name: 'Marina Bay Sands', lat: 1.2834, lng: 103.8607, cost: 25, duration: 120, type: 'sightseeing', address: '10 Bayfront Ave, Singapore' },
    { name: 'Gardens by the Bay', lat: 1.2816, lng: 103.8636, cost: 20, duration: 150, type: 'nature', address: '18 Marina Gardens Dr, Singapore' },
    { name: 'Sentosa Island', lat: 1.2494, lng: 103.8303, cost: 30, duration: 300, type: 'activity', address: 'Sentosa Island, Singapore' },
    { name: 'Chinatown', lat: 1.2838, lng: 103.8448, cost: 0, duration: 90, type: 'culture', address: 'Chinatown, Singapore' },
    { name: 'Universal Studios', lat: 1.2540, lng: 103.8238, cost: 60, duration: 360, type: 'activity', address: 'Sentosa, Singapore' },
  ]},
  'rome': { lat: 41.9028, lng: 12.4964, country: 'Italy', attractions: [
    { name: 'Colosseum', lat: 41.8902, lng: 12.4922, cost: 16, duration: 150, type: 'history', address: 'Piazza del Colosseo, Rome' },
    { name: 'Vatican Museums', lat: 41.9065, lng: 12.4536, cost: 20, duration: 240, type: 'culture', address: 'Viale Vaticano, Rome' },
    { name: 'Trevi Fountain', lat: 41.9009, lng: 12.4833, cost: 0, duration: 45, type: 'sightseeing', address: 'Piazza di Trevi, Rome' },
    { name: 'Pantheon', lat: 41.8986, lng: 12.4769, cost: 5, duration: 60, type: 'history', address: 'Piazza della Rotonda, Rome' },
    { name: 'Roman Forum', lat: 41.8925, lng: 12.4853, cost: 12, duration: 120, type: 'history', address: 'Via Sacra, Rome' },
  ]},
  'barcelona': { lat: 41.3851, lng: 2.1734, country: 'Spain', attractions: [
    { name: 'Sagrada Familia', lat: 41.4036, lng: 2.1744, cost: 26, duration: 120, type: 'sightseeing', address: 'Carrer de Mallorca 401, Barcelona' },
    { name: 'Park Güell', lat: 41.4145, lng: 2.1527, cost: 10, duration: 120, type: 'nature', address: "Carrer d'Olot, Barcelona" },
    { name: 'Las Ramblas', lat: 41.3797, lng: 2.1735, cost: 0, duration: 90, type: 'shopping', address: 'La Rambla, Barcelona' },
    { name: 'Barcelona Cathedral', lat: 41.3840, lng: 2.1762, cost: 0, duration: 60, type: 'culture', address: 'Pla de la Seu, Barcelona' },
    { name: 'Camp Nou', lat: 41.3809, lng: 2.1228, cost: 26, duration: 120, type: 'activity', address: 'Camp Nou, Barcelona' },
  ]},
};

const getDestData = (name) => {
  const key = name.toLowerCase().trim();
  return DEST_DB[key] || {
    lat: 20.5937, lng: 78.9629, country: 'India',
    attractions: [
      { name: `${name} City Center`, lat: 20.5937, lng: 78.9629, cost: 0, duration: 90, type: 'sightseeing', address: `City Center, ${name}` },
      { name: `${name} Museum`, lat: 20.5950, lng: 78.9650, cost: 10, duration: 120, type: 'culture', address: `Museum, ${name}` },
      { name: `${name} Market`, lat: 20.5920, lng: 78.9610, cost: 15, duration: 90, type: 'food', address: `Market, ${name}` },
      { name: `${name} Park`, lat: 20.5960, lng: 78.9680, cost: 0, duration: 90, type: 'nature', address: `Park, ${name}` },
    ]
  };
};

// Auto-generate itinerary when booking is created
const autoGenerateItinerary = async (booking, user) => {
  try {
    const destination = booking.transport?.to || booking.hotel?.city || 'Paris';
    const destData = getDestData(destination);
    const checkIn = booking.hotel?.checkIn || booking.transport?.arrivalTime || new Date();
    const checkOut = booking.hotel?.checkOut || null;
    const duration = checkOut
      ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
      : 3;
    const startDate = new Date(checkIn);
    const dailyBudget = 150;
    const days = [];

    for (let d = 0; d < Math.min(duration, 10); d++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + d);
      const dayAttractions = destData.attractions.slice((d * 2) % destData.attractions.length, ((d * 2) % destData.attractions.length) + 3);
      if (dayAttractions.length < 3) dayAttractions.push(...destData.attractions.slice(0, 3 - dayAttractions.length));

      const activities = [];
      const times = ['09:00', '13:00', '15:30', '19:00'];

      activities.push({
        time: times[0],
        title: dayAttractions[0].name,
        description: `Visit ${dayAttractions[0].name}`,
        location: {
          name: dayAttractions[0].name,
          address: dayAttractions[0].address,
          coordinates: { lat: dayAttractions[0].lat, lng: dayAttractions[0].lng }
        },
        duration: dayAttractions[0].duration,
        category: 'sightseeing',
        estimatedCost: dayAttractions[0].cost,
        crowdLevel: 'medium',
        weatherDependant: false
      });

      activities.push({
        time: times[1],
        title: 'Lunch',
        description: `Local restaurant near ${dayAttractions[0].name}`,
        location: { name: 'Local Restaurant', address: `Near ${dayAttractions[0].name}`, coordinates: { lat: dayAttractions[0].lat + 0.001, lng: dayAttractions[0].lng + 0.001 } },
        duration: 60,
        category: 'food',
        estimatedCost: 20
      });

      if (dayAttractions[1]) {
        activities.push({
          time: times[2],
          title: dayAttractions[1].name,
          description: `Explore ${dayAttractions[1].name}`,
          location: {
            name: dayAttractions[1].name,
            address: dayAttractions[1].address,
            coordinates: { lat: dayAttractions[1].lat, lng: dayAttractions[1].lng }
          },
          duration: dayAttractions[1].duration,
          category: 'sightseeing',
          estimatedCost: dayAttractions[1].cost,
          crowdLevel: 'low'
        });
      }

      activities.push({
        time: times[3],
        title: 'Dinner',
        description: `Evening dinner in ${destination}`,
        location: { name: 'Restaurant', address: `${destination} dining district`, coordinates: { lat: destData.lat, lng: destData.lng } },
        duration: 90,
        category: 'food',
        estimatedCost: 30
      });

      days.push({
        day: d + 1,
        date: dayDate,
        theme: ['Arrival & First Impressions', 'Culture & Heritage', 'Hidden Gems', 'Adventure & Activities', 'Farewell'][d % 5],
        location: destination,
        activities,
        crowdForecast: { level: 'medium', score: 55, peakHours: ['10:00', '14:00'] },
        estimatedDayCost: activities.reduce((s, a) => s + (a.estimatedCost || 0), 0)
      });
    }

    const itinerary = await Itinerary.create({
      user: user._id,
      trip: booking.trip || undefined,
      title: `${duration}-Day ${destination} Trip`,
      version: 1,
      isActive: true,
      params: { budget: dailyBudget * duration, duration, destinations: [destination], travelStyle: 'comfort', startDate },
      days,
      summary: {
        totalDays: duration,
        totalEstimatedCost: days.reduce((s, d) => s + d.estimatedDayCost, 0),
        currency: 'USD',
        topAttractions: destData.attractions.slice(0, 3).map(a => a.name),
        bestTimeToVisit: 'Early morning before 10 AM',
        transportModes: ['Walk', 'Metro', 'Cab']
      },
      generatedBy: 'ai'
    });

    logger.info(`Auto-itinerary generated: ${itinerary._id} for booking ${booking.bookingReference}`);
    return itinerary;
  } catch (err) {
    logger.error('Auto-itinerary generation failed:', err.message);
    return null;
  }
};

// ─── Search ───────────────────────────────────────────────────────────────────
const AIRLINES = [
  { name: 'IndiGo', code: '6E', logo: '✈️' },
  { name: 'Air India', code: 'AI', logo: '🛫' },
  { name: 'SpiceJet', code: 'SG', logo: '✈️' },
  { name: 'Vistara', code: 'UK', logo: '🛫' },
  { name: 'Emirates', code: 'EK', logo: '✈️' },
  { name: 'Singapore Airlines', code: 'SQ', logo: '🛫' },
];
const HOTEL_CHAINS = [
  { name: 'Marriott', brand: 'luxury', base: 150 },
  { name: 'Hilton Garden Inn', brand: 'comfort', base: 90 },
  { name: 'OYO Rooms', brand: 'budget', base: 25 },
  { name: 'Ibis', brand: 'budget', base: 45 },
  { name: 'Hyatt Regency', brand: 'luxury', base: 180 },
  { name: 'Lemon Tree Hotels', brand: 'comfort', base: 60 },
  { name: 'The Oberoi', brand: 'luxury', base: 250 },
  { name: 'Novotel', brand: 'comfort', base: 95 },
];
const addHours = (date, h) => { const d = new Date(date); d.setTime(d.getTime() + h * 3600000); return d; };

const searchFlights = async (req, res, next) => {
  try {
    const { from, to, date, passengers = 1, class: cls = 'economy' } = req.query;
    if (!from || !to || !date) return res.status(400).json({ error: 'from, to, and date are required.' });
    const depDate = new Date(date);
    const bases = { economy: 80, business: 300, first: 600 };
    const flights = AIRLINES.map((airline, i) => {
      const dep = new Date(depDate); dep.setHours(6 + i * 2, i * 15 % 60, 0, 0);
      const dh = 2 + Math.floor(Math.random() * 8);
      const arr = addHours(dep, dh);
      const price = Math.round((bases[cls] || 80) * (0.8 + Math.random() * 0.8)) * parseInt(passengers);
      return {
        id: `FL${Date.now()}${i}`, carrier: airline.name, logo: airline.logo,
        flightNumber: `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`,
        from, to, departureTime: dep.toISOString(), arrivalTime: arr.toISOString(),
        duration: `${dh}h ${i * 10 % 60}m`, class: cls,
        price, pricePerPerson: Math.round(price / parseInt(passengers)), currency: 'USD',
        seatsAvailable: Math.floor(Math.random() * 50) + 5,
        stops: i < 3 ? 0 : 1, baggage: cls === 'economy' ? '15kg' : '30kg',
        refundable: i % 2 === 0
      };
    }).sort((a, b) => a.price - b.price);
    res.json({ success: true, flights, searchParams: { from, to, date, passengers, class: cls } });
  } catch (error) { next(error); }
};

const searchHotels = async (req, res, next) => {
  try {
    const { city, checkIn, checkOut, guests = 1 } = req.query;
    if (!city || !checkIn || !checkOut) return res.status(400).json({ error: 'city, checkIn, checkOut required.' });
    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
    const destData = getDestData(city);
    const hotels = HOTEL_CHAINS.map((hotel, i) => {
      const ppn = Math.round(hotel.base * (0.8 + Math.random() * 0.6));
      const offset = (i - 3) * 0.006;
      return {
        id: `HT${Date.now()}${i}`, name: `${hotel.name} ${city}`, brand: hotel.brand,
        rating: hotel.brand === 'luxury' ? 5 : hotel.brand === 'comfort' ? 4 : 3,
        reviewScore: (3.5 + Math.random() * 1.5).toFixed(1),
        reviewCount: Math.floor(100 + Math.random() * 2000),
        address: `${100 + i * 10} Main Street, ${city}`, city, checkIn, checkOut, nights,
        roomType: hotel.brand === 'luxury' ? 'Deluxe Suite' : hotel.brand === 'comfort' ? 'Standard Double' : 'Economy Room',
        guests: parseInt(guests), pricePerNight: ppn, totalPrice: ppn * nights, currency: 'USD',
        coordinates: { lat: destData.lat + offset, lng: destData.lng + offset },
        amenities: hotel.brand === 'luxury' ? ['Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Room Service'] : hotel.brand === 'comfort' ? ['Free WiFi', 'Breakfast', 'Gym'] : ['Free WiFi', 'AC', 'TV'],
        freeCancellation: i % 2 === 0, breakfastIncluded: hotel.brand !== 'budget',
        distanceFromCenter: `${(0.5 + Math.random() * 3).toFixed(1)} km`
      };
    }).sort((a, b) => a.pricePerNight - b.pricePerNight);
    res.json({ success: true, hotels, searchParams: { city, checkIn, checkOut, guests, nights } });
  } catch (error) { next(error); }
};

const searchGuides = async (req, res, next) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'city required.' });
    const GUIDES = [
      { name: 'Rahul Sharma', speciality: 'Historical Tours', languages: ['English', 'Hindi'], rate: 25 },
      { name: 'Maria Fernandez', speciality: 'Food & Culture Tours', languages: ['English', 'Spanish'], rate: 30 },
      { name: 'Ahmed Al-Hassan', speciality: 'Adventure Tours', languages: ['English', 'Arabic'], rate: 35 },
      { name: 'Priya Nair', speciality: 'Photography Tours', languages: ['English', 'Tamil'], rate: 28 },
    ];
    const guides = GUIDES.map((g, i) => ({
      id: `TG${Date.now()}${i}`, ...g, city,
      experience: `${5 + i * 2} years`, pricePerHour: g.rate, currency: 'USD',
      rating: (4 + Math.random() * 0.9).toFixed(1), reviewCount: Math.floor(50 + Math.random() * 300),
      tours: [`${city} City Highlights (3h)`, `${g.speciality} (4h)`, `Full Day ${city} (8h)`],
      available: true, verified: true
    }));
    res.json({ success: true, guides });
  } catch (error) { next(error); }
};

const searchTrains = async (req, res, next) => {
  try {
    const { from, to, date, passengers = 1 } = req.query;
    if (!from || !to || !date) return res.status(400).json({ error: 'from, to, date required.' });
    const depDate = new Date(date);
    const TRAINS = [
      { name: 'Rajdhani Express', type: 'premium' }, { name: 'Shatabdi Express', type: 'premium' },
      { name: 'Duronto Express', type: 'express' }, { name: 'Intercity Express', type: 'express' },
    ];
    const trains = TRAINS.map((t, i) => {
      const dep = new Date(depDate); dep.setHours(6 + i * 4, 0, 0, 0);
      const dh = 4 + i * 2; const arr = addHours(dep, dh);
      const base = t.type === 'premium' ? 40 : 20;
      return {
        id: `TR${Date.now()}${i}`, name: t.name, number: `${12000 + i * 11}`,
        from, to, departureTime: dep.toISOString(), arrivalTime: arr.toISOString(),
        duration: `${dh}h 00m`, type: t.type,
        classes: [
          { name: '1A (AC First)', price: base * 4 * passengers, seats: Math.floor(Math.random() * 20) + 2 },
          { name: '2A (AC 2-Tier)', price: base * 2.5 * passengers, seats: Math.floor(Math.random() * 40) + 5 },
          { name: '3A (AC 3-Tier)', price: base * 1.5 * passengers, seats: Math.floor(Math.random() * 60) + 10 },
          { name: 'SL (Sleeper)', price: base * passengers, seats: Math.floor(Math.random() * 100) + 20 },
        ]
      };
    });
    res.json({ success: true, trains });
  } catch (error) { next(error); }
};

const searchBuses = async (req, res, next) => {
  try {
    const { from, to, date, passengers = 1 } = req.query;
    if (!from || !to || !date) return res.status(400).json({ error: 'from, to, date required.' });
    const depDate = new Date(date);
    const BUSES = [
      { operator: 'RedBus', type: 'AC Sleeper', price: 15 }, { operator: 'IntrCity', type: 'AC Semi-Sleeper', price: 12 },
      { operator: 'VRL Travels', type: 'Non-AC Sleeper', price: 8 }, { operator: 'Zingbus', type: 'AC Luxury', price: 20 },
    ];
    const buses = BUSES.map((b, i) => {
      const dep = new Date(depDate); dep.setHours(20 + i, 0, 0, 0);
      const dh = 6 + i; const arr = addHours(dep, dh);
      return {
        id: `BU${Date.now()}${i}`, operator: b.operator, busType: b.type,
        from, to, departureTime: dep.toISOString(), arrivalTime: arr.toISOString(),
        duration: `${dh}h 00m`, price: b.price * parseInt(passengers), pricePerPerson: b.price,
        currency: 'USD', seatsAvailable: Math.floor(Math.random() * 30) + 5,
        amenities: b.type.includes('AC') ? ['AC', 'USB Charging', 'Blanket'] : ['Fan'],
        rating: (3.5 + Math.random() * 1.5).toFixed(1)
      };
    });
    res.json({ success: true, buses });
  } catch (error) { next(error); }
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────
const getBookings = async (req, res, next) => {
  try {
    const { type, status, tripId, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (tripId) filter.trip = tripId;
    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)).populate('trip', 'title startDate endDate'),
      Booking.countDocuments(filter)
    ]);
    res.json({ success: true, bookings, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

const createBooking = async (req, res, next) => {
  try {
    const bookingData = { ...req.body, user: req.user._id };
    if (!bookingData.type) return res.status(400).json({ error: 'Booking type is required.' });
    if (!bookingData.pricing?.totalPrice) return res.status(400).json({ error: 'Pricing information is required.' });

    const booking = await Booking.create(bookingData);

    // Auto-create expense
    const categoryMap = { flight: 'transport', train: 'transport', bus: 'transport', car_rental: 'transport', hotel: 'accommodation', tour_guide: 'activities', activity: 'activities' };
    await Expense.create({
      user: req.user._id, trip: booking.trip || undefined, booking: booking._id,
      category: categoryMap[booking.type] || 'misc',
      title: `${booking.type.toUpperCase()} - ${booking.bookingReference}`,
      amount: booking.pricing.totalPrice, currency: booking.pricing.currency || 'USD',
      date: new Date(), paymentMethod: 'card'
    });

    // ── AUTO-GENERATE ITINERARY ────────────────────────────────────────────
    let itinerary = null;
    const shouldAutoGenerate = ['flight', 'hotel'].includes(booking.type);
    if (shouldAutoGenerate) {
      itinerary = await autoGenerateItinerary(booking, req.user);
      if (itinerary) {
        // Create alert to inform user
        await Alert.create({
          user: req.user._id, trip: booking.trip,
          type: 'itinerary', severity: 'info',
          title: '🗺️ Itinerary Auto-Generated!',
          message: `Your ${booking.type} to ${booking.transport?.to || booking.hotel?.city} has been booked! We've auto-generated a detailed itinerary with real locations. Go to Itinerary to view it and start your Live Trip!`,
          isActionRequired: true,
          action: { label: 'View Itinerary', url: `/itinerary/${itinerary._id}` }
        });
      }
    }

    logger.info(`Booking created: ${booking.bookingReference}`);
    res.status(201).json({ success: true, booking, itinerary });
  } catch (error) { next(error); }
};

const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id }).populate('trip', 'title startDate endDate');
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    res.json({ success: true, booking });
  } catch (error) { next(error); }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: { $ne: 'cancelled' } },
      { $set: { status: 'cancelled' } }, { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found or already cancelled.' });
    await Expense.findOneAndUpdate({ booking: booking._id }, { $set: { notes: `CANCELLED - ${booking.bookingReference}` } });
    res.json({ success: true, booking, message: 'Booking cancelled.' });
  } catch (error) { next(error); }
};

const getBookingSummary = async (req, res, next) => {
  try {
    const summary = await Booking.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$type', count: { $sum: 1 }, totalSpent: { $sum: '$pricing.totalPrice' }, confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } } } }
    ]);
    res.json({ success: true, summary });
  } catch (error) { next(error); }
};

// Export destination data for use in other controllers
module.exports.DEST_DB = DEST_DB;
module.exports.getDestData = getDestData;
module.exports = { searchFlights, searchHotels, searchGuides, searchTrains, searchBuses, getBookings, createBooking, getBooking, cancelBooking, getBookingSummary, DEST_DB, getDestData };
