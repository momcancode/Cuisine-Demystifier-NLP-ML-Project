// // Perform an api call to the cuisine_ingredients data
// d3.json("/api/all").then(function(data) {
// 	console.log(data)
// });

d3.select("#findCuisine").on("click", (event) => findCuisine(event));

function findCuisine(event) {
    d3.event.preventDefault();
    console.log("Checking Cuisine");

    let data = d3.select("#ingredients").node().value;

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
        (data) => d3.select("#alertOutcome").text(data[0])
    );
}

// function showResult(data) {
//     console.log("showResult");
//     console.log(data);
//     var outcome = "Unknown";

//     if (data[0] == "I") {
//         outcome = "Survived";
//     } else {
//         outcome = "Dead";
//     }

//     ;
// }