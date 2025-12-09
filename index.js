let searchHistory = [];

// ---------- CLEAR INPUT ERROR ----------
const clearInputError = () => {
    const cityInput = document.getElementById("city");
    const inputError = document.getElementById("inputError");
    
    cityInput.classList.remove("error");
    inputError.classList.remove("show");
    inputError.textContent = "";
};

// ---------- SHOW INPUT ERROR ----------
const showInputError = (message) => {
    const cityInput = document.getElementById("city");
    const inputError = document.getElementById("inputError");
    
    cityInput.classList.add("error");
    inputError.textContent = message;
    inputError.classList.add("show");
};

// ---------- INPUT EVENT LISTENER ----------
document.getElementById("city").addEventListener("input", () => {
    clearInputError();
});

// ---------- TOGGLE DELETE BUTTON ----------
const toggleDeleteButton = () => {
    const btn = document.getElementById("deleteHistoryBtn");
    btn.style.display = searchHistory.length > 0 ? "block" : "none";
};

// ---------- UPDATE BACKGROUND ----------
// const updateBackground = (temperature) => {
//     const body = document.body;
//     body.classList.remove('hot', 'warm', 'moderate', 'cold', 'freezing');
    
//     if (temperature >= 35) {
//         body.classList.add('hot');
//     } else if (temperature >= 25) {
//         body.classList.add('warm');
//     } else if (temperature >= 15) {
//         body.classList.add('moderate');
//     } else if (temperature >= 5) {
//         body.classList.add('cold');
//     } else {
//         body.classList.add('freezing');
//     }
// };

// ---------- GET CITY COORDINATES ----------
const getCityCoordinates = async (city) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error("Network error! Unable to connect to the server.");
    }
    
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found! Please check the spelling and try again.");
    }

    const { latitude, longitude, name, admin1, country } = data.results[0];
    return { latitude, longitude, name, admin1, country };
};

// ---------- GET WEATHER DATA ----------
const getWeatherData = async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error("Failed to fetch weather data. Please try again.");
    }
    
    const data = await response.json();
    return data;
};

// ---------- GET WEATHER ----------
const getWeather = async () => {
    const city = document.getElementById("city").value;

    // Clear previous errors
    clearInputError();
    document.getElementById("errorMessage").classList.remove("show");
    document.getElementById("weatherInfo").classList.remove("show");

    // Validate input
    if (city.trim() === "") {
        showInputError("Please enter a city name!");
        return;
    }

    try {
        showLoading(true);

        // Get coordinates
        const { latitude, longitude, name, admin1, country } = await getCityCoordinates(city);
        
        // Get weather data
        const weatherData = await getWeatherData(latitude, longitude);
        console.log(weatherData)
        
        const weather = weatherData.current_weather;
        const humidity = weatherData.hourly.relative_humidity_2m[0] 

        showLoading(false);

        const data = {
            name: name,
            temperature: weather.temperature,
            humidity: humidity,
            wind: weather.windspeed,
            state: admin1 ? admin1 :"State Not Found",
            country:country
        };

        displayWeather(data);
        addToHistory(name);
        //updateBackground(weather.temperature);

    } catch (error) {
        showLoading(false);
        showError(error.message);
    }
};

// ---------- DISPLAY WEATHER ----------
const displayWeather = (data) => {
    const { name, temperature, humidity, wind, state, country } = data;

    const weatherInfo = document.getElementById("weatherInfo");
    weatherInfo.innerHTML = `
        <div class="weather-item"><strong>City:</strong> ${name}</div>
        <div class="weather-item"><strong>State :</strong> ${state} </div>
        <div class="weather-item"><strong>Country :</strong> ${country} </div>
        <div class="weather-item"><strong>Temperature:</strong> ${temperature}°C</div>
        <div class="weather-item"><strong>Humidity:</strong> ${humidity}%</div>
        <div class="weather-item"><strong>Wind Speed:</strong> ${wind} km/h</div>
    `;

    weatherInfo.classList.add("show");
};

// ---------- LOADING ----------
const showLoading = (isLoading) => {
    const loading = document.getElementById("loading");
    if (isLoading) loading.classList.add("show");
    else loading.classList.remove("show");
};

// ---------- ERROR ----------
const showError = (message) => {
    const errorElement = document.getElementById("errorMessage");
    errorElement.textContent = message;
    errorElement.classList.add("show");
};

// ---------- ADD TO HISTORY ----------
const addToHistory = (cityName) => {
    searchHistory = [cityName, ...searchHistory];
    searchHistory = [...new Set(searchHistory)];
    searchHistory = searchHistory.slice(0, 5);

    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));

    displayHistory();
    toggleDeleteButton();
};

// ---------- DISPLAY HISTORY ----------
const displayHistory = () => {
    const historyList = document.getElementById("historyList");

    if (searchHistory.length === 0) {
        historyList.innerHTML = '<div class="no-history">No recent searches</div>';
        return;
    }

    historyList.innerHTML = searchHistory
        .map((city) => `<div class="history-item" onclick="searchFromHistory('${city}')">${city}</div>`)
        .join("");

    toggleDeleteButton();
};

// ---------- SEARCH FROM HISTORY ----------
const searchFromHistory = (cityName) => {
    document.getElementById("city").value = cityName;
    getWeather();
};

// ---------- ENTER KEY PRESS ----------
document.getElementById("city").addEventListener("keypress", (e) => {
    if (e.key === "Enter") getWeather();
});

// ---------- LOAD HISTORY ON PAGE LOAD ----------
window.addEventListener("load", () => {
    const history = localStorage.getItem("searchHistory");
    const weatherHistory = JSON.parse(history);

    if (weatherHistory) {
        searchHistory = weatherHistory;
    }

    displayHistory();
});

// ---------- DELETE HISTORY ----------
let deleteHistory = () => {
    localStorage.removeItem("searchHistory");
    searchHistory = [];

    document.getElementById("weatherInfo").classList.remove("show");
    document.getElementById("city").value = "";

    displayHistory();
    toggleDeleteButton();
};