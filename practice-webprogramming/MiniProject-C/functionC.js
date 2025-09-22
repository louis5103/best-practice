async function fetchAPI(lat, lon) {
    try {
        const URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const response = await fetch(URL);
        const body = await response.json();

        // 1. Correctly create a new object with key-value pairs
        const prettyJson = {
            time: body.current_weather.time,
            temperature: body.current_weather.temperature,
            wind_speed: body.current_weather.windspeed, // 3. Use correct property 'windspeed'
            wind_direction: body.current_weather.winddirection, // 3. Use correct property 'winddirection'
            is_day: body.current_weather.is_day,
            weather_code: body.current_weather.weathercode, // 3. Use correct property 'weathercode'
        };

        // 4. Display the newly created 'prettyJson' object
        // Use JSON.stringify with spacing for better readability
        output.textContent = JSON.stringify(prettyJson, null, 2);

    } catch (error) {
        console.error(error);
        output.textContent = `Error: ${error.message}`;
    }
}

// This part of your code is fine
document.getElementById('button').addEventListener('click', () => {
    output.textContent = 'Loading...';
    // Get values from input fields with IDs 'input1' and 'input2'
    fetchAPI(input1.value, input2.value);
});