async function fetchAPI(inputValue) {
    try {
        output.textContent = "Loading...";
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${inputValue}`);
        const body = await response.json();

        const name = inputValue;
        const height = body.height;
        const weight = body.weight;

        const imgURL = body.sprites.front_default;
        const imgResponse = await fetch(imgURL);

        output.textContent = `Pokemon: ${name}, ${height}, ${weight}`;
        let imgTag = document.createElement("img");
        document.body.append(imgTag);
        imgTag.src = URL.createObjectURL(inputValue);

    } catch(err) {

    } finally {

    }

}

document.getElementById("btn").addEventListener("click", () => {
    fetchAPI(document.getElementById("input").value);
})