// // Perform an api call to the cuisine_ingredients data
// d3.json("/api/all").then(function(data) {
// 	console.log(data)
// });

d3.select("#findCuisine").on("click", (event) => findCuisine(event));

function findCuisine(event) {
    d3.event.preventDefault();
    console.log("Checking Cuisine");

	let ingredients = d3.select("#ingredients").node().value;
	
	let data = {
		"ingredients": ingredients
	};

    console.log(data);

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

function showResult(result) {
    console.log("showResult");
    console.log(result);
	var outcome = result["result"][0];
	console.log(outcome);
    d3.select("#alertOutcome").text(outcome);
}