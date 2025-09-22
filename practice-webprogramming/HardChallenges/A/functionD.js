async function main(country) {
    const URL = `https://restcountries.com/v3.1/name/${country}`;
    console.log(`Fetching ${URL}`);
    const response = await fetch(URL)
        .then(res => res.json())
        .catch(err => console.log(err));

    output.textContent = JSON.stringify(response, null, 2);
    const countName = response[0].name.common;
    const capital = response[0].capital;
    const population = response[0].population;
    const region = response[0].region;
    const imgURL = response[0].flags.png;

    header.textContent = country;
    output.textContent = `
        Capital: ${capital} \n
        Population: ${population} \n
        Region: ${region} \n
    `;
    img.src = imgURL;
}

document.getElementById("submit").addEventListener("click", () => {
    output.textContent = 'Loading...';
    main(input.value);
});