/**
 * Database Seeder
 * Creates sample data for development/demo
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const { Expense, Alert } = require('../models/ExpenseAlert');
const Itinerary = require('../models/Itinerary');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tripzy');
  console.log('✅ Connected to MongoDB for seeding');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Trip.deleteMany({}),
    Booking.deleteMany({}),
    Expense.deleteMany({}),
    Alert.deleteMany({}),
    Itinerary.deleteMany({})
  ]);
  console.log('🗑️  Cleared existing data');

  // Create demo user
  const user = await User.create({
    name: 'Alex Traveler',
    email: 'demo@tripzy.com',
    password: 'demo1234',
    preferences: {
      currency: 'USD',
      travelStyle: 'comfort',
      notifications: { email: true, push: true, weatherAlerts: true, crowdAlerts: true }
    }
  });
  console.log(`👤 Created user: ${user.email} / password: demo1234`);

  // Create trips
  const now = new Date();
  const trip1 = await Trip.create({
    user: user._id,
    title: 'Paris Adventure',
    description: 'A romantic week in the city of lights',
    destinations: [{ name: 'Paris', city: 'Paris', country: 'France', coordinates: { lat: 48.8566, lng: 2.3522 } }],
    startDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 22),
    budget: { total: 3000, currency: 'USD' },
    interests: ['culture', 'food', 'history'],
    travelStyle: 'comfort',
    status: 'planning',
    tags: ['europe', 'romantic', 'culture']
  });

  const trip2 = await Trip.create({
    user: user._id,
    title: 'Tokyo Tech & Culture',
    description: 'Exploring the blend of tradition and innovation',
    destinations: [{ name: 'Tokyo', city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lng: 139.6503 } }],
    startDate: new Date(now.getFullYear(), now.getMonth() + 3, 1),
    endDate: new Date(now.getFullYear(), now.getMonth() + 3, 10),
    budget: { total: 4500, currency: 'USD' },
    interests: ['culture', 'food', 'shopping', 'photography'],
    travelStyle: 'comfort',
    status: 'planning',
    tags: ['asia', 'technology', 'culture']
  });

  const trip3 = await Trip.create({
    user: user._id,
    title: 'NYC Weekend Getaway',
    description: 'Quick trip to the Big Apple',
    destinations: [{ name: 'New York', city: 'New York', country: 'USA', coordinates: { lat: 40.7128, lng: -74.0060 } }],
    startDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
    endDate: new Date(now.getFullYear(), now.getMonth() - 1, 13),
    budget: { total: 1500, currency: 'USD' },
    interests: ['culture', 'food', 'shopping'],
    travelStyle: 'comfort',
    status: 'completed'
  });
  console.log(`✈️  Created ${3} sample trips`);

  // Create bookings for trip1
  const flightBooking = await Booking.create({
    user: user._id,
    trip: trip1._id,
    type: 'flight',
    status: 'confirmed',
    transport: {
      from: 'New York (JFK)', to: 'Paris (CDG)',
      departureTime: new Date(now.getFullYear(), now.getMonth() + 1, 15, 10, 0),
      arrivalTime: new Date(now.getFullYear(), now.getMonth() + 1, 16, 6, 30),
      carrier: 'AirTripzy', flightNumber: 'TZ1042', class: 'economy', seats: 2, duration: '7h 30m'
    },
    pricing: { basePrice: 480, taxes: 72, fees: 28, totalPrice: 580, currency: 'USD', paidAmount: 580 },
    passengers: [{ name: 'Alex Traveler' }]
  });

  const hotelBooking = await Booking.create({
    user: user._id,
    trip: trip1._id,
    type: 'hotel',
    status: 'confirmed',
    hotel: {
      name: 'Grand Tripzy Paris', address: '15 Rue de Rivoli', city: 'Paris', country: 'France',
      checkIn: new Date(now.getFullYear(), now.getMonth() + 1, 16),
      checkOut: new Date(now.getFullYear(), now.getMonth() + 1, 22),
      nights: 6, roomType: 'Deluxe Double', guests: 2, rating: 4,
      amenities: ['Free WiFi', 'Breakfast', 'Gym', 'Concierge'],
      coordinates: { lat: 48.8606, lng: 2.3376 }
    },
    pricing: { basePrice: 900, taxes: 135, fees: 45, totalPrice: 1080, currency: 'USD', paidAmount: 1080 }
  });
  console.log(`🎫 Created ${2} sample bookings`);

  // Create expenses for completed trip
  const expenseCategories = [
    { category: 'transport', title: 'Flight NYC-NYC round trip', amount: 320 },
    { category: 'accommodation', title: 'Hotel - 3 nights', amount: 450 },
    { category: 'food', title: 'Dinner at Times Square', amount: 85 },
    { category: 'food', title: 'Broadway pre-show brunch', amount: 65 },
    { category: 'activities', title: 'Empire State Building', amount: 40 },
    { category: 'activities', title: 'MoMA tickets', amount: 50 },
    { category: 'shopping', title: 'Souvenir shopping', amount: 120 },
    { category: 'transport', title: 'Uber rides', amount: 75 },
    { category: 'food', title: 'Coffee & snacks', amount: 35 },
    { category: 'misc', title: 'Tips & misc', amount: 60 }
  ];

  for (const exp of expenseCategories) {
    await Expense.create({
      user: user._id,
      trip: trip3._id,
      ...exp,
      currency: 'USD',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 10 + Math.floor(Math.random() * 3))
    });
  }
  console.log(`💰 Created ${expenseCategories.length} sample expenses`);

  // Create alerts
  await Promise.all([
    Alert.create({
      user: user._id, trip: trip1._id,
      type: 'weather', severity: 'warning',
      title: 'Rain Expected in Paris',
      message: 'Light rain forecast for your trip days 2-4. Pack an umbrella and consider indoor alternatives.',
      isActionRequired: true,
      action: { label: 'Update Itinerary', url: `/itinerary/${trip1._id}` }
    }),
    Alert.create({
      user: user._id, trip: trip1._id,
      type: 'crowd', severity: 'info',
      title: 'High Crowds at Eiffel Tower',
      message: 'Crowd levels predicted HIGH at Eiffel Tower on Saturday 12-4 PM. Book timed entry tickets in advance.',
      isActionRequired: false
    }),
    Alert.create({
      user: user._id,
      type: 'booking', severity: 'info',
      title: 'Flight Check-In Open',
      message: 'Online check-in is now open for your Paris flight TZ1042. Check in 24 hours before departure.',
      isActionRequired: true,
      action: { label: 'Check In', url: '#' }
    }),
    Alert.create({
      user: user._id, trip: trip2._id,
      type: 'system', severity: 'info',
      title: 'Tokyo Trip - 90 Days Away',
      message: 'Your Tokyo trip is 90 days away. Time to start planning your itinerary!',
      isActionRequired: false
    })
  ]);
  console.log(`🔔 Created 4 sample alerts`);

  console.log('\n✅ Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo Login:');
  console.log('  Email:    demo@tripzy.com');
  console.log('  Password: demo1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
