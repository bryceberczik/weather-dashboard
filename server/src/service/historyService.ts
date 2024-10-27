import { readFile, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

class City {
  constructor(public name: string, public id: string = uuidv4()) {}
}

class HistoryService {
  private readonly DB_URL = `${process.cwd()}/db/db.json`;

  private async read(): Promise<City[]> {
    const weatherData = await readFile(this.DB_URL, 'utf-8');
    return JSON.parse(weatherData) || [];
  }

  private async write(cities: City[]): Promise<void> {
    await writeFile(this.DB_URL, JSON.stringify(cities, null, 4), 'utf-8');
  }

  async getCities(): Promise<City[]> {
    return this.read();
  }

  async addCity(name: string): Promise<void> {
    const cities = await this.read();
    if (!cities.some(city => city.name === name)) {
      cities.push(new City(name));
      await this.write(cities);
    }
  }

  async removeCity(id: string): Promise<void> {
    const cities = await this.read();
    const updatedCities = cities.filter(city => city.id !== id);
    if (updatedCities.length !== cities.length) {
      await this.write(updatedCities);
    }
  }
}

export default new HistoryService();