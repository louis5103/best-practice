async function toConvert(amount, unit){
    const response = await fetch('https://open.er-api.com/v6/latest/USD')
        .then(res => res.json())
        .then(data => data.rates)

    const targetUnit = response[unit]
    const rated = amount * targetUnit;
    p.textContent = `${amount} USD = ${rated} ${unit} ` + "\n" +
                     `${amount/amount} USD = ${rated / amount}`
}

document.getElementById("button").addEventListener("click", () => {
    var option = document.getElementById("select");
    toConvert(input.value, option.options[option.selectedIndex].value);
})

