import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "./components/navigationbar";
import MainWeatherCard from "./components/weathercardmain";
import FiveDayForecast from "./components/5days";
import TodayHighlights from "./components/highlightstoday";
import axios from "axios";

const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [city, setCity] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [fiveDayForecast, setFiveDayForecast] = useState(null);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    if (city) fetchWeatherData(city);
  }, [city]);

  useEffect(() => {
    
    try {
      const savedHistory = JSON.parse(localStorage.getItem("searchHistory"));
      if (savedHistory && Array.isArray(savedHistory)) {
        setSearchHistory(savedHistory);
      }
    } catch (error) {
      console.error("Error loading search history:", error);
      localStorage.removeItem("searchHistory");
    }
  }, []);

  const fetchAirQualityData = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      setAirQualityData(response.data.list[0]);
    } catch (error) {
      console.error("Error fetching air quality data:", error);
    }
  };

  const fetchForecastData = async (city) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
      );
      setFiveDayForecast(response.data);
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      setError("Failed to fetch 5-day forecast.");
    }
  };

  const fetchWeatherData = async (city) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
      );
      
      setWeatherData(response.data);
      
      
      await Promise.all([
        fetchAirQualityData(response.data.coord.lat, response.data.coord.lon),
        fetchForecastData(city)
      ]);
      
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setWeatherData(null);
      setFiveDayForecast(null);
      setAirQualityData(null);
      
      const errorMessage = error.response?.status === 404 
        ? "City not found. Please check the spelling and try again."
        : "Unable to fetch weather data. Please try again later.";
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchedCity) => {
    if (!searchedCity || searchedCity.trim() === "") return;
    
    const formattedCity = searchedCity.trim();
    setCity(formattedCity);
    
    
    setSearchHistory((prevHistory) => {
      const updatedHistory = [
        formattedCity,
        ...prevHistory.filter((c) => c.toLowerCase() !== formattedCity.toLowerCase()),
      ].slice(0, 5);
      
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const handleRefresh = () => {
    if (city) fetchWeatherData(city);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`weather-dashboard ${darkMode ? "dark-mode" : "light-mode"}`}
    >
      <Navbar
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="dashboard-container">
        {searchHistory.length > 0 && (
          <div className="search-history-container">
            <h3 className="search-history-title">Recent</h3>
            <div className="search-history-buttons">
              {searchHistory.map((cityName, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(cityName)}
                  className="history-button"
                >
                  {cityName}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Fetching weather data...</p>
          </div>
        )}

        {weatherData && airQualityData && !isLoading && (
          <div className="weather-content">
            <div className="weather-card-container">
              <MainWeatherCard weatherData={weatherData} />
              
              <div className="forecast-section">
                <h2 className="section-title">5 Days Forecast</h2>
                {fiveDayForecast && <FiveDayForecast forecastData={fiveDayForecast} />}
              </div>
            </div>
            
            <div className="highlights-container">
              <h2 className="section-title">Today's Highlights</h2>
              <TodayHighlights
                weatherData={weatherData}
                airQualityData={airQualityData}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .weather-dashboard {
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          transition: background-color 0.3s ease;
          overflow-x: hidden;
        }
        
        .dark-mode {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f8fafc;
        }
        
        .light-mode {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          color: #0f172a;
        }
        
        .dashboard-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
        }
        
        .search-history-container {
          margin: 10px 0;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .search-history-title {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          opacity: 0.9;
          color: #e2e8f0;
        }
        
        .search-history-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .history-button {
          background: linear-gradient(135deg, #334155 0%, #475569 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.8rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .history-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .error-message {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 12px 16px;
          margin: 10px 0;
          border-radius: 8px;
          font-size: 0.875rem;
          box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
          font-weight: 500;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 0;
        }
        
        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(99, 102, 241, 0.3);
          border-radius: 50%;
          border-top-color: #6366f1;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .weather-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        
        @media (min-width: 940px) {
          .weather-content {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        .weather-card-container, 
        .highlights-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .weather-card-container > div,
        .highlights-container > div {
          background: rgba(15, 23, 42, 0.7);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .weather-card-container > div:hover,
        .highlights-container > div:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.25);
        }
        
        .section-title {
          font-weight: 600;
          font-size: 1.25rem;
          margin-bottom: 12px;
          position: relative;
          display: inline-block;
          letter-spacing: 0.5px;
          color: #e2e8f0;
        }
        
        .section-title:after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 40px;
          height: 3px;
          background: linear-gradient(90deg, #334155 0%, #475569 100%);
          border-radius: 3px;
        }
        
        /* Override component styles */
        /* Note: These will apply if you have control over the child components */
        .dark-mode :global(.weather-card),
        .dark-mode :global(.forecast-card),
        .dark-mode :global(.highlight-card) {
          background: rgba(15, 23, 42, 0.8);
        }
        
        .light-mode :global(.weather-card),
        .light-mode :global(.forecast-card),
        .light-mode :global(.highlight-card) {
          background: rgba(255, 255, 255, 0.8);
        }
        
        /* Main weather card specific styling */
        :global(.weather-card) {
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%) !important;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Forecast cards specific styling */
        :global(.forecast-day) {
          background: rgba(30, 41, 59, 0.7) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        
        /* Highlight cards specific styling */
        :global(.highlight-item) {
          background: rgba(30, 41, 59, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>
    </motion.div>
  );
};

export default WeatherDashboard;