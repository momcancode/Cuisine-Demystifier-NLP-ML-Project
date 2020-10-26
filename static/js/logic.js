// // Perform an api call to the cuisine_ingredients data
// d3.json("/api/all").then(function(data) {
// 	console.log(data)
// });


console.log("App Ready");

d3.select("#doCheckTicket").on("click", (event) => doCheckTicket(event));

function doCheckTicket(event) {
    d3.event.preventDefault();
    console.log("Checking Ticket");

    let age = d3.select("#inputAge").node().value;
    let gender = d3.select("#inputGender").node().value;
    let passengerClass = d3.select("#inputPassengerClass").node().value;
    let numberOfSiblings = d3.select("#inputNumberOfSiblings").node().value;
    let numberOfParents = d3.select("#inputNumberOfParents").node().value;
    let fare = d3.select("#inputFare").node().value;
    let portOfEmbarkment = d3.select("#inputPortOfEmbarkment").node().value;

    let data = {
        "age": parseFloat(age),
        "gender": gender,
        "passengerClass": parseInt(passengerClass),
        "numberOfSiblings": parseInt(numberOfSiblings),
        "numberOfParents": parseInt(numberOfParents),
        "fare": parseFloat(fare),
        "portOfEmbarkment": portOfEmbarkment,
    }

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
        (data) => showResult(data)
    );

}

function showResult(data) {
    console.log("showResult");
    console.log(data);
    var outcome = "Unknown";

    if (data[0] == 1) {
        outcome = "Survived";
    } else {
        outcome = "Dead";
    }

    d3.select("#alertOutcome").text(outcome);


}