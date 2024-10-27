import { Router } from 'express';
const router = Router();

import HistoryService from '../../service/historyService.js';
import WeatherService from '../../service/weatherService.js';

router.post('/', async(req, res) => {
  const currentWeather = await WeatherService.getWeatherForCity(req.body.cityName);
  res.status(200).send(currentWeather);
});

router.get('/history', async (_req, res) => {
  const cities = await HistoryService.getCities();
  res.status(200).send(cities);
});

router.delete('/history/:id', async (req, res) => {
  const id = req.params.id;
  await HistoryService.removeCity(id);
  res.status(202).send();
});

export default router;