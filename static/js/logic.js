// // Perform an api call to the cuisine_ingredients data
// d3.json("/api/all").then(function(data) {
// 	console.log(data)
// });

// Event: add ingredients' text to find cuisine
d3.select("#findCuisine").on("click", (event) => findCuisine(event));

function findCuisine(event) {
    d3.event.preventDefault();

	let ingredients = d3.select("#ingredients").node().value;
    
    if (ingredients==="") {
        d3.select("#alertOutcome").text("Please add some ingredients.");
    } else {
        let data = {
            "ingredients": ingredients
        };
    
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
    console.log(outcome);
    d3.select("#alertOutcome").html(
		`<span>
		Hei, are you craving for some <b>${outcome}</b> food?
		<i class="fas fa-pepper-hot"></i>
		<i class="fas fa-pizza-slice"></i>
        </span>
		`
	);
}

d3.select("#clear").on("click", (event) => clear(event));

function clear() {
	document.getElementById("ingredients").value="";
}


// d3.select("#give_feedback").on("click", (event) => findCuisine(event));

// function findCuisine(event) {
//     d3.event.preventDefault();
//     console.log("Checking Cuisine");

// 	let ingredients = d3.select("#ingredients").node().value;
	
// 	let data = {
// 		"ingredients": ingredients
// 	};

//     console.log(data);

//     d3.json(
//         "/predict", {
//             method: "POST",
//             body: JSON.stringify(data),
//             headers: {
//                 "Content-type": "application/json; charset=UTF-8"
//             }
//         }
//     ).then(
//         (result) => showResult(result)
//     );
// }