'use client'

import { FormEvent, useMemo, useState } from 'react'
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  LocateFixed,
  MapPin,
  Search,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  Snowflake,
  CloudLightning
} from 'lucide-react'

const baseUrl = '/api/backend';

const WEATHER_VIDEOS = {
  clearDay: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-1167-large.mp4',
  clearNight: 'https://assets.mixkit.co/videos/preview/mixkit-night-sky-with-stars-and-clouds-1357-large.mp4',
  clouds: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-in-a-blue-sky-1173-large.mp4',
  rain: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-a-window-1245-large.mp4',
  fog: 'https://assets.mixkit.co/videos/preview/mixkit-foggy-forest-in-the-morning-1358-large.mp4',
  snow: 'https://assets.mixkit.co/videos/preview/mixkit-snow-falling-in-a-forest-1174-large.mp4',
  storm: 'https://assets.mixkit.co/videos/preview/mixkit-lightning-in-the-clouds-1187-large.mp4',
} as const

const WEATHER_BACKGROUNDS = {
  clearDay: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2400&q=85',
  clearNight: 'https://images.unsplash.com/photo-1532763303805-529d595877c5?auto=format&fit=crop&w=2400&q=85',
  clouds: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=2400&q=85',
  rain: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=2400&q=85',
  fog: 'https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=2400&q=85',
  snow: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=2400&q=85',
  storm: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=2400&q=85',
} as const

type Unit = 'C' | 'F'
type Weather = {
  city: string
  country: string
  temperature: number
  feelsLike: number
  high: number
  low: number
  humidity: number
  wind: number
  pressure: number
  visibility: number
  sunrise: string
  sunset: string
  timezone: string
  code: number
  isDay: boolean
  forecast: { date: string; high: number; low: number; code: number }[]
}

const initialWeather: Weather = {
  city: 'New York', country: 'US', temperature: 17, feelsLike: 17, high: 17, low: 17,
  humidity: 61, wind: 3.3, pressure: 1017, visibility: 10, sunrise: '03:18 PM', sunset: '04:36 AM', timezone: 'America/New_York', code: 2, isDay: true,
  forecast: [
    { date: 'Today', high: 17, low: 17, code: 2 },
    { date: 'Thu, Aug 28', high: 25, low: 25, code: 2 },
    { date: 'Fri, Aug 29', high: 24, low: 24, code: 3 },
    { date: 'Sat, Aug 30', high: 24, low: 24, code: 2 },
    { date: 'Sun, Aug 31', high: 24, low: 24, code: 0 },
  ],
}

function weatherLabel(code: number) {
  if (code === 800) return 'Clear Sky'
  if (code === 801 || code === 802) return 'Scattered Clouds'
  if (code === 803 || code === 804) return 'Overcast Clouds'
  if (code >= 700 && code < 800) return 'Fog / Mist'
  if (code >= 600 && code < 700) return 'Snow'
  if (code >= 500 && code < 600) return 'Rain'
  if (code >= 300 && code < 400) return 'Drizzle'
  if (code >= 200 && code < 300) return 'Thunderstorm'
  return 'Cloudy'
}

function WeatherIcon({ code, size = 34 }: { code: number; size?: number }) {
  const props = { size, strokeWidth: 1.8 }
  if (code === 800) return <Sun {...props} />
  if (code === 801 || code === 802) return <CloudSun {...props} />
  if (code === 803 || code === 804) return <Cloud {...props} />
  if (code >= 700 && code < 800) return <CloudFog {...props} />
  if (code >= 600 && code < 700) return <Snowflake {...props} /> 
  if (code >= 500 && code < 600) return <CloudRain {...props} />
  if (code >= 300 && code < 400) return <CloudDrizzle {...props} />
  if (code >= 200 && code < 300) return <CloudLightning {...props} />
  return <Cloud {...props} />
}

function convert(value: number, unit: Unit) {
  return unit === 'C' ? Math.round(value) : Math.round(value * 9 / 5 + 32)
}

function formatDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: timezone }).format(date)
}

function weatherScene(code: number, isDay: boolean) {
  if (!isDay && (code === 800 || code === 801)) return 'clearNight'
  if (code === 800) return 'clearDay'
  if (code >= 801 && code <= 804) return 'clouds'
  if (code >= 700 && code < 800) return 'fog'
  if (code >= 600 && code < 700) return 'snow'
  if (code >= 500 && code < 600) return 'rain'
  if (code >= 300 && code < 400) return 'rain' // Map drizzle to rain video
  if (code >= 200 && code < 300) return 'storm'
  return 'clouds'
}

export default function Page() {
  const [weather, setWeather] = useState(initialWeather)
  const [unit, setUnit] = useState<Unit>('C')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const now = useMemo(() => formatDate(new Date(), weather.timezone), [weather.timezone])
  const temp = (value: number) => `${convert(value, unit)}°`

  async function searchCity(event: FormEvent) {
    event.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      // Call your custom Spring Boot API on Render
      const [currentRes, forecastRes] = await Promise.all([
        fetch(`${baseUrl}/weather?city=${encodeURIComponent(query)}`),
        fetch(`${baseUrl}/forecast?city=${encodeURIComponent(query)}`)
      ]);
  
      if (!currentRes.ok || !forecastRes.ok) throw new Error('City not found');
      const data = await currentRes.json();
      const forecastData = await forecastRes.json();

      // OpenWeatherMap returns data every 3 hours. Filter to grab only the 12:00 PM reading for each day.
      const dailyForecasts = forecastData.list.filter((item: any) => item.dt_txt.includes('12:00:00'));

      // Map the Spring Boot JSON to the React state
      setWeather({
        city: data.name,
        country: data.sys?.country || 'N/A', 
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        high: data.main.temp_max,
        low: data.main.temp_min,
        humidity: data.main.humidity,
        wind: data.wind.speed,
        pressure: data.main.pressure,
        visibility: data.visibility ? data.visibility / 1000 : 10, // Convert meters to km
        sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : initialWeather.sunrise,
        sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : initialWeather.sunset,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        code: data.weather[0].id, // OpenWeatherMap condition ID
        isDay: true,
        forecast: dailyForecasts.map((day: any) => ({
        date: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          high: day.main.temp_max,
          low: day.main.temp_min,
          code: day.weather[0].id
        }))
      })
      setQuery('')
    } catch { setError('We couldn’t find that city. Try another search.') } finally { setLoading(false) }
  }

  return (
    <main className="weather-shell">
      {(() => {
        const scene = weatherScene(weather.code, weather.isDay)
        return <>
          <video
            key={scene}
            className="weather-video"
            autoPlay
            muted
            loop
            playsInline
            poster={WEATHER_BACKGROUNDS[scene]}
            aria-hidden="true"
          >
            <source src={WEATHER_VIDEOS[scene]} type="video/mp4" />
          </video>
          <div className="weather-backdrop" style={{ backgroundImage: `url(${WEATHER_BACKGROUNDS[scene]})` }} aria-hidden="true" />
        </>
      })()}
      <div className="weather-overlay" />
      <section className="weather-content">
        <header className="topbar">
          <form className="search-wrap" onSubmit={searchCity}>
            <Search size={18} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for any city worldwide...." aria-label="Search for a city" />
            <button type="button" className="location-button" aria-label="Use current location"><LocateFixed size={18} /></button>
          </form>
          <div className="unit-switch" aria-label="Temperature unit">
            <button className={unit === 'C' ? 'active' : ''} onClick={() => setUnit('C')}>°C</button>
            <button className={unit === 'F' ? 'active' : ''} onClick={() => setUnit('F')}>°F</button>
          </div>
        </header>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="dashboard-grid">
          <article className="glass-card current-card">
            <div className="current-heading">
              <div className="place"><MapPin size={18} /><div><h1>{weather.city}</h1><span>{weather.country}</span></div></div>
              <div className="date-time"><strong>{now}</strong><span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
            </div>
            <div className="hero-weather"><div><div className="temperature">{temp(weather.temperature)}<span>{unit}</span></div><h2>{weatherLabel(weather.code)}</h2><p>H: {temp(weather.high)} &nbsp; L: {temp(weather.low)}</p></div><WeatherIcon code={weather.code} size={84} /></div>
            <div className="metrics-grid">
              <Metric icon={<LocateFixed />} label="Visibility" value={`${weather.visibility.toFixed(1)} km`} />
              <Metric icon={<Wind />} label="Wind Speed" value={`${weather.wind.toFixed(1)} m/s`} />
              <Metric icon={<Droplets />} label="Humidity" value={`${weather.humidity}%`} />
              <Metric icon={<Gauge />} label="Pressure" value={`${weather.pressure} hPa`} />
              <Metric icon={<Thermometer />} label="Feels Like" value={temp(weather.feelsLike) + unit} />
            </div>
            <div className="sun-row"><SunStat icon={<Sunrise />} label="Sunrise" value={weather.sunrise} warm /><SunStat icon={<Sunset />} label="Sunset" value={weather.sunset} /></div>
          </article>
          <aside className="glass-card forecast-card"><h2><CloudSun size={25} />5 Day Forecast</h2><div className="forecast-list">{weather.forecast.map((day) => <div className="forecast-item" key={day.date}><WeatherIcon code={day.code} size={35} /><div className="forecast-copy"><strong>{day.date}</strong><span>{weatherLabel(day.code)}</span></div><span className="rain">♧ 0%</span><div className="forecast-temp"><strong>{temp(day.high)}</strong><span>{temp(day.low)}</span></div></div>)}</div></aside>
        </div>
        {loading && <div className="loading">Updating forecast...</div>}
      </section>
    </main>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="metric"><span className="metric-icon">{icon}</span><span className="metric-label">{label}</span><strong>{value}</strong></div> }
function SunStat({ icon, label, value, warm }: { icon: React.ReactNode; label: string; value: string; warm?: boolean }) { return <div className={`sun-stat ${warm ? 'warm' : ''}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div> }
