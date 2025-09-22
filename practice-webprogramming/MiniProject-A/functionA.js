async function func() {
    out.textContent = "Loading...";

    try {
        const reponse = await fetch("https://official-joke-api.appspot.com/random_joke");
        const body = await reponse.json();

        if( body ) {
            out.textContent = body.setup + "\n" + body.punchline;
        }
    } catch(err) {
        console.log(err);
    } finally {
        console.log("fetch jobs completed");
    }
}

document.getElementById("btn").addEventListener("click", () => {
    func();
})