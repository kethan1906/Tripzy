/**
 * Weather Controller
 * OpenWeatherMap API integration
 */

const axios = require('axios');
const { Alert } = require('../models/ExpenseAlert');

// GET /api/weather/current?city=Paris
const getCurrentWeather = async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;

    let url;
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
    } else {
      return res.status(400).json({ error: 'city or lat/lon required' });
    }

    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
      // Return mock data if no API key
      return res.json({
        success: true,
        weather: {
          city: city || 'Unknown',
          temperature: 22,
          feelsLike: 20,
          description: 'Partly cloudy',
          condition: 'clouds',
          humidity: 65,
          windSpeed: 12,
          visibility: 10000,
          icon: '04d',
          sunrise: '06:30',
          sunset: '18:45',
          alerts: []
        },
        mock: true
      });
    }

    const response = await axios.get(url);
    const data = response.data;

    const weather = {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      condition: data.weather[0].main.toLowerCase(),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      visibility: data.visibility,
      icon: data.weather[0].icon,
      sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
      sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
      coordinates: { lat: data.coord.lat, lon: data.coord.lon }
    };

    res.json({ success: true, weather });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'City not found' });
    }
    next(error);
  }
};

// GET /api/weather/forecast?city=Paris
const getForecast = async (req, res, next) => {
  try {
    const { city, lat, lon, days = 5 } = req.query;

    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
      // Mock 5-day forecast
      const forecast = Array.from({ length: 5 }, (_, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        temperature: { min: 15 + i, max: 24 + i },
        description: ['Sunny', 'Partly cloudy', 'Cloudy', 'Light rain', 'Clear'][i],
        condition: ['clear', 'clouds', 'clouds', 'rain', 'clear'][i],
        humidity: 60 + i * 3,
        windSpeed: 8 + i * 2,
        icon: ['01d', '02d', '04d', '10d', '01d'][i],
        precipitation: i === 3 ? 60 : 0
      }));
      return res.json({ success: true, forecast, mock: true });
    }

    let url;
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=${days * 8}`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=${days * 8}`;
    }

    const response = await axios.get(url);
    const list = response.data.list;

    // Group by day
    const grouped = {};
    list.forEach(item => {
      const day = item.dt_txt.split(' ')[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(item);
    });

    const forecast = Object.entries(grouped).slice(0, days).map(([date, items]) => ({
      date,
      temperature: {
        min: Math.round(Math.min(...items.map(i => i.main.temp_min))),
        max: Math.round(Math.max(...items.map(i => i.main.temp_max)))
      },
      description: items[4]?.weather[0]?.description || items[0].weather[0].description,
      condition: items[4]?.weather[0]?.main.toLowerCase() || items[0].weather[0].main.toLowerCase(),
      humidity: Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length),
      windSpeed: Math.round(items.reduce((s, i) => s + i.wind.speed, 0) / items.length),
      icon: items[4]?.weather[0]?.icon || items[0].weather[0].icon,
      precipitation: items.filter(i => i.weather[0].main.toLowerCase().includes('rain')).length / items.length * 100
    }));

    res.json({ success: true, forecast });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCurrentWeather, getForecast };

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crowd Controller
 * Interfaces with ML service for crowd prediction
 */

// POST /api/crowd/predict
const predictCrowd = async (req, res, next) => {
  try {
    const { location, datetime, locationType } = req.body;

    try {
      const response = await axios.post(`${process.env.ML_SERVICE_URL}/predict/crowd`, {
        location, datetime, location_type: locationType || 'tourist_spot'
      }, { timeout: 8000 });

      return res.json({ success: true, prediction: response.data });
    } catch (mlError) {
      // Fallback mock prediction if ML service unavailable
      const hour = new Date(datetime || new Date()).getHours();
      const dayOfWeek = new Date(datetime || new Date()).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let score = 30;
      if (hour >= 10 && hour <= 17) score += 40;
      if (isWeekend) score += 20;
      if (hour >= 12 && hour <= 14) score += 15;
      score = Math.min(100, score + Math.floor(Math.random() * 15));

      return res.json({
        success: true,
        prediction: {
          level: score > 70 ? 'high' : score > 45 ? 'medium' : 'low',
          score,
          confidence: 0.75,
          peakHours: isWeekend ? ['10:00', '13:00', '15:00', '17:00'] : ['12:00', '17:00'],
          recommendation: score > 70 ? 'Visit early morning (before 10 AM) or after 6 PM' :
            score > 45 ? 'Moderate crowds expected, consider weekday visits' : 'Great time to visit!'
        },
        fallback: true
      });
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/crowd/hotspots?city=Paris&date=2024-01-15
const getCrowdHotspots = async (req, res, next) => {
  try {
    const { city, date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const hour = targetDate.getHours() || 12;

    // Mock hotspot data with varying crowd levels
    const hotspots = [
      { name: 'City Center / Main Square', crowdScore: 85, lat: 0.001, lng: 0.001 },
      { name: 'Main Tourist Attraction', crowdScore: 78, lat: 0.002, lng: -0.002 },
      { name: 'Shopping District', crowdScore: 65, lat: -0.001, lng: 0.003 },
      { name: 'Museum Quarter', crowdScore: hour >= 14 ? 72 : 45, lat: 0.003, lng: 0.002 },
      { name: 'Local Market', crowdScore: hour >= 9 && hour <= 12 ? 60 : 30, lat: -0.002, lng: -0.001 },
      { name: 'Park / Nature Area', crowdScore: 25, lat: 0.004, lng: -0.003 }
    ].map(h => ({
      ...h,
      crowdLevel: h.crowdScore > 70 ? 'high' : h.crowdScore > 45 ? 'medium' : 'low',
      lastUpdated: new Date().toISOString()
    }));

    res.json({ success: true, hotspots, city, timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

module.exports.predictCrowd = predictCrowd;
module.exports.getCrowdHotspots = getCrowdHotspots;
