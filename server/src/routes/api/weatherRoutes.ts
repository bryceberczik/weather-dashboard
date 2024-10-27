import { Router } from 'express';
import HistoryService from '../../service/historyService.js';
import WeatherService from '../../service/weatherService.js';

const router = Router();

// POST: Get current weather for a city
router.post('/', async (req, res) => {
  try {
    const { cityName } = req.body;
    if (!cityName) {
      return res.status(400).json({ error: 'City name is required.' });
    }

    const currentWeather = await WeatherService.getWeatherForCity(cityName);
    return res.status(200).json(currentWeather);
  } catch (error) {
    console.error('Error fetching weather:', error);
    return res.status(500).json({ error: 'Failed to fetch weather.' });
  }
});

// GET: Retrieve history of cities
router.get('/history', async (_req, res) => {
  try {
    const cities = await HistoryService.getCities();
    res.status(200).json(cities);
  } catch (error) {
    console.error('Error fetching city history:', error);
    res.status(500).json({ error: 'Failed to fetch city history.' });
  }
});

// DELETE: Remove a city from history by ID
router.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await HistoryService.removeCity(id);
    res.status(202).send();
  } catch (error) {
    console.error(`Error removing city with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to remove city.' });
  }
});

export default router;