const API_KEY = '63cf752c4fbf03de756a26da7df661b1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const themeToggle = document.getElementById('theme-toggle');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

const cityName = document.getElementById('city-name');
const date = document.getElementById('date');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const weatherIcon = document.getElementById('weather-icon');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const forecastContainer = document.getElementById('forecast-container');

const unitButtons = document.querySelectorAll('.unit-toggle button');
let currentUnit = 'celsius';

const body = document.body;
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.toggle('dark-mode', savedTheme === 'dark');
    themeToggle.checked = savedTheme === 'dark';
}

let latestWeatherData = null;
let latestForecastData = null;

searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    console.log('Search button clicked for city:', city);
    if (city) {
        getWeatherByCity(city);
    } else {
        showError('Please enter a city name');
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        console.log('Enter key pressed for city:', city);
        if (city) {
            getWeatherByCity(city);
        } else {
            showError('Please enter a city name');
        }
    }
});

themeToggle.addEventListener('change', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
});

unitButtons.forEach(button => {
    button.addEventListener('click', () => {
        unitButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentUnit = button.dataset.unit;
        updateWeatherDisplay(latestWeatherData, latestForecastData);
    });
});

async function getWeatherByCity(city) {
    try {
        console.log('Fetching weather for city:', city);
        showLoading();
        const weatherData = await fetchWeatherData(city);
        console.log('Weather data received:', weatherData);
        
        const forecastData = await fetchForecastData(city);
        console.log('Forecast data received:', forecastData);
        
        latestWeatherData = weatherData;
        latestForecastData = forecastData;
        
        updateWeatherDisplay(weatherData, forecastData);
        hideLoading();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message || 'City not found. Please try again.');
        hideLoading();
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function fetchWeatherData(city) {
    console.log('Fetching weather data for:', city);
    const response = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'City not found');
    }
    return response.json();
}

async function fetchWeatherDataByCoords(lat, lon) {
    const response = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Weather data not found');
    }
    return response.json();
}

async function fetchForecastData(city) {
    const response = await fetch(
        `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Forecast data not found');
    }
    return response.json();
}

async function fetchForecastDataByCoords(lat, lon) {
    const response = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Forecast data not found');
    }
    return response.json();
}

function updateWeatherDisplay(weatherData, forecastData) {
    if (!weatherData) {
        console.error('No weather data provided to update display');
        return;
    }

    console.log('Updating display with weather data:', weatherData);

    cityName.textContent = weatherData.name;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    date.textContent = `${day}/${month}/${year}`;

    const temp = currentUnit === 'celsius' ? weatherData.main.temp : celsiusToFahrenheit(weatherData.main.temp);
    temperature.textContent = `${Math.round(temp)}°${currentUnit === 'celsius' ? 'C' : 'F'}`;
    
    weatherDescription.textContent = weatherData.weather[0].description;
    weatherIcon.src = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;

    const feelsLikeTemp = currentUnit === 'celsius' ? weatherData.main.feels_like : celsiusToFahrenheit(weatherData.main.feels_like);
    feelsLike.textContent = `${Math.round(feelsLikeTemp)}°${currentUnit === 'celsius' ? 'C' : 'F'}`;
    humidity.textContent = `${weatherData.main.humidity}%`;
    wind.textContent = `${weatherData.wind.speed} m/s`;
    pressure.textContent = `${weatherData.main.pressure} hPa`;

    sunrise.textContent = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString();
    sunset.textContent = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString();

    updateForecast(forecastData);
}

function updateForecast(forecastData) {
    if (!forecastData || !forecastData.list) {
        console.error('Invalid forecast data:', forecastData);
        return;
    }

    forecastContainer.innerHTML = '';
    const dailyForecasts = forecastData.list.filter(forecast => 
        forecast.dt_txt.includes('12:00:00')
    ).slice(0, 5);

    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const temp = currentUnit === 'celsius' ? forecast.main.temp : celsiusToFahrenheit(forecast.main.temp);
        
        const forecastElement = document.createElement('div');
        forecastElement.className = 'forecast-item';
        forecastElement.innerHTML = `
            <div class="forecast-date">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].description}">
            <div class="forecast-temp">${Math.round(temp)}°${currentUnit === 'celsius' ? 'C' : 'F'}</div>
        `;
        forecastContainer.appendChild(forecastElement);
    });
}

function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function showLoading() {
    loadingSpinner.style.display = 'block';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showError(message) {
    console.error('Error:', message);
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// Initialize with user's location if available
if (navigator.geolocation) {
    getWeatherByCity();
} 
