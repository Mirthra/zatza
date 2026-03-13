"use client";

import { useEffect, useState } from "react";

interface Weather {
  tempF: number;
  icon: string;
  description: string;
  city: string;
}

// Map Open-Meteo weather codes to emoji + description
function weatherFromCode(code: number, isDay: boolean): { icon: string; description: string } {
  if (code === 0) return { icon: isDay ? "☀️" : "🌙", description: "Clear" };
  if (code === 1) return { icon: isDay ? "🌤️" : "🌙", description: "Mostly clear" };
  if (code === 2) return { icon: "⛅", description: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", description: "Overcast" };
  if (code <= 48) return { icon: "🌫️", description: "Foggy" };
  if (code <= 55) return { icon: "🌦️", description: "Drizzle" };
  if (code <= 65) return { icon: "🌧️", description: "Rain" };
  if (code <= 77) return { icon: "🌨️", description: "Snow" };
  if (code <= 82) return { icon: "🌦️", description: "Showers" };
  return { icon: "⛈️", description: "Thunderstorm" };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude: lat, longitude: lon } = coords;

          // Fetch weather from Open-Meteo (free, no API key)
          const [weatherRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit&wind_speed_unit=mph`
            ),
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            ),
          ]);

          const weatherData = await weatherRes.json() as {
            current: { temperature_2m: number; weather_code: number; is_day: number };
          };
          const geoData = await geoRes.json() as {
            address: { city?: string; town?: string; village?: string; county?: string };
          };

          const { temperature_2m, weather_code, is_day } = weatherData.current;
          const { icon, description } = weatherFromCode(weather_code, is_day === 1);
          const city =
            geoData.address.city ??
            geoData.address.town ??
            geoData.address.village ??
            geoData.address.county ??
            "Your location";

          setWeather({ tempF: Math.round(temperature_2m), icon, description, city });
        } catch {
          setError(true);
        }
      },
      () => setError(true)
    );
  }, []);

  if (error || !weather) return null;

  return (
    <div className="px-3 py-2 mx-2 rounded-md bg-accent/30 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{weather.icon}</span>
        <span className="text-foreground font-semibold">{weather.tempF}°F</span>
        <span className="text-muted-foreground">{weather.description}</span>
      </div>
      <div className="mt-0.5 text-muted-foreground/70 truncate">{weather.city}</div>
    </div>
  );
}
