// Perform an api call to the vba fauna data
d3.json("/api/all").then(function(data) {
	console.log(data)
});