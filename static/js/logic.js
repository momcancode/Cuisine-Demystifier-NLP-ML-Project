// Event: add ingredients' text to find cuisine
d3.select("#findCuisine").on("click", (event) => findCuisine(event));

function findCuisine(event) {
    d3.event.preventDefault();

	let ingredients = d3.select("#ingredients").node().value;
    
    if (ingredients.trim() === "") {
        d3.select("#alertOutcome").text("Please add some ingredients.");
    } else {
        let data = {"ingredients": ingredients};
    
        d3.json(
            "/predict", {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            }
        ).then(
            (result) => showResult(result)
        );
    }
}

function showResult(result) {
    var outcome = result["result"][0];
    d3.select("#alertOutcome").html(
		`<span>
		Are you craving for some <b>${outcome}</b> food?
		<i class="fas fa-pepper-hot"></i>
		<i class="fas fa-pizza-slice"></i>
        </span>
		`
	);
}

// Clear text in textarea
d3.select("#clear").on("click", (event) => clear(event));

function clear() {
	document.getElementById("ingredients").value="";
}

// Event: user gives feedback about model's predictions
d3.select("#giveFeedback").on("click", (event) => giveFeedback(event));

function giveFeedback(event) {
    d3.event.preventDefault();
    console.log("Giving Feedback");

    let chosenCuisine = d3.select("#chosenCuisine").node().value;
    let enteredCuisine = d3.select("#enteredCuisine").node().value;
	let recipeName = d3.select("#recipeName").node().value;
	let recipeLink = d3.select("#recipeLink").node().value;

	let feedback = {
        "chosenCuisine": chosenCuisine,
        "enteredCuisine": enteredCuisine,
        "recipeName": recipeName,
        "recipeLink": recipeLink,
	};

    console.log(feedback);

    d3.json(
        "/feedback", {
            method: "POST",
            body: JSON.stringify(feedback),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }
    ).then(
        d3.select("#thankyou").text("Thanks for your feedback!")
    );
}