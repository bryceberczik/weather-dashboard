import dotenv from 'dotenv';
import historyService from './historyService.js';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '../.env') });

interface Coordinates {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state: string;
}

class Weather {
  constructor(
    public city: string,
    public date: string,
    public icon: string,
    public iconDescription: string,
    public tempF: string,
    public windSpeed: string,
    public humidity: string
  ) {}
}

class WeatherService {
  private readonly baseURL = process.env.API_BASE_URL!;
  private readonly apiKey = process.env.API_KEY!;
  private city = '';

  private getCurrentDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
  }

  private async fetchJSON(query: string): Promise<any> {
    const response = await fetch(query);
    return response.json();
  }

  private buildQuery(path: string, params: Record<string, string | number>): string {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return `${this.baseURL}${path}?${queryString}&appid=${this.apiKey}`;
  }

  private buildGeocodeQuery(): string {
    return this.buildQuery('/geo/1.0/direct', { q: `${this.city},US` });
  }

  private buildWeatherQueries({ lat, lon }: Coordinates): Record<string, string> {
    const params = { lat, lon, units: 'imperial' };
    return {
      current: this.buildQuery('/data/2.5/weather', params),
      forecast: this.buildQuery('/data/2.5/forecast', params),
    };
  }

  private async fetchLocationData(): Promise<Coordinates> {
    const data: Coordinates[] = await this.fetchJSON(this.buildGeocodeQuery());
    return data[0] || ({} as Coordinates); // Fallback to empty object if not found
  }

  private async fetchWeatherData(coords: Coordinates): Promise<Record<string, any>> {
    const { current, forecast } = this.buildWeatherQueries(coords);
    const [currentWeatherData, forecastData] = await Promise.all([
      this.fetchJSON(current),
      this.fetchJSON(forecast),
    ]);
    return { currentWeatherData, forecastData };
  }

  private parseWeather(data: any): Weather {
    return new Weather(
      this.city,
      this.getCurrentDate(data.dt),
      data.weather[0].icon,
      data.weather[0].description,
      data.main.temp,
      data.wind.speed,
      data.main.humidity
    );
  }

  private buildForecastArray(forecastList: any[], currentWeather: Weather): Weather[] {
    const forecast: Weather[] = [];

    for (const item of forecastList) {
      const weatherDate = item.dt_txt.split(' ')[0];
      if (weatherDate === currentWeather.date || forecast.some(f => f.date === weatherDate)) continue;

      forecast.push(this.parseWeather(item));
      if (forecast.length >= 5) break;
    }

    return forecast;
  }

  async getWeatherForCity(city: string): Promise<Weather[]> {
    this.city = city;
    const location = await this.fetchLocationData();

    if (!Object.keys(location).length) {
      return [new Weather('City not found', '', '', '', '', '', '')];
    }

    const { currentWeatherData, forecastData } = await this.fetchWeatherData(location);
    const currentWeather = this.parseWeather(currentWeatherData);
    const forecast = this.buildForecastArray(forecastData.list, currentWeather);

    await historyService.addCity(city);

    return [currentWeather, ...forecast];
  }
}

export default new WeatherService();
