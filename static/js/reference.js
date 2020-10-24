d3.select("#submit").on("click", handleSubmit);
var myMap = null;

function handleSubmit() {
  // Prevent the page from refreshing
  d3.event.preventDefault();

  // Select the input value from the form
  var stateSelection = d3.select("#ddstate").node().value;
  var roleSelection = d3.select("#ddrole").node().value;
  var url = `/get_jobs/${stateSelection}/${roleSelection}`;
  d3.json(url).then(function(data) {
    renderMap(data,stateSelection);
    renderWordCloud(data);
    renderWeekday(data);
    renderJobTable(data,stateSelection,roleSelection);
    render_Underemp();
    gotoBottom("#map");
  });
}

function gotoBottom(item){
  // var element = d3.select(item);
  location.href = item;
}

function renderMap(data,state){
    if (myMap !== undefined && myMap !== null) {
      myMap.remove(); // should remove the map from UI and clean the inner children of DOM element
    }

    var stateLocations = {
                          "Australian Capital Territory": [-35.28, 149.13, 7], 
                          "Victoria"                    : [-37.81, 144.96, 7], 
                          "New South Wales"             : [-33.86, 151.20, 7], 
                          "Queensland"                  : [-23.52, 149.13, 6], 
                          "Western Australia"           : [-31.95, 115.86, 7], 
                          "South Australia"             : [-34.93, 138.60, 7], 
                          "Northern Territory"          : [-19.49, 132.55, 6],
                          "All"                         : [-25.27, 133.77, 4] 
                        };
   
    for (const [key, value] of Object.entries(stateLocations)) {      
      if(key == state){
        myMap = L.map("map", {
          center: [value[0], value[1]],
          zoom: value[2]
          });        
      }
    }              


    // Adding light tile layer to the map
    var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/streets-v11",
        accessToken: API_KEY
        }).addTo(myMap);

        var response = data;
        // Create a new marker cluster group
        Street: streetmap
        var markers = L.markerClusterGroup({
            // spiderfyOnMaxZoom: false,
            showCoverageOnHover: false,
            // zoomToBoundsOnClick: false,
            iconCreateFunction: function (cluster) {
            var childCount = cluster.getChildCount();
            var c = ' marker-cluster-';
            if (childCount < 10) {
                c += 'small';
            }
            else if (childCount < 100) {
                c += 'medium';
            }
            else {
                c += 'large';
            }
            return new L.DivIcon({
                html: '<div><span>' + childCount + '</span></div>',
                className: 'marker-cluster' + c, iconSize: new L.Point(40, 40)
            });
            }
        });
        // Loop through data
        for (var i = 0; i < response.length; i++) {
            // Set the data location property to a variable
            var latitude = parseFloat(response[i].latitude);
            var longitude = parseFloat(response[i].longitude);
            // Check for location property
            if (latitude) {
            // Add a new marker to the cluster group and bind a pop-up
            markers.addLayer(L.marker([latitude, longitude])
                .bindPopup("<h3>" + response[i].title + "</h3> <hr> <h4>Company: " + response[i].company + "</h4>"
                + "<p><a target='_blank' href=" + response[i].redirect_url + ">Position description</a></p>" +
                "<p>Date posted: " + new Date(response[i].created) + "</p>"));
            }
        }
        // Add our marker cluster layer to the map
        myMap.addLayer(markers);
}

function renderWordCloud(data){
  d3.select("#cloud").selectAll("div").remove();
  var jobListing = data
  var keywords = [];
  var titles = [];
  var areas = [];

  for (var i = 0; i < jobListing.length; i++) {
      keywords.push(jobListing[i].keyword) // Return keyword in a list
      titles.push(jobListing[i].title) // Return title in a list
      areas.push(jobListing[i].area) // Return area in a list
  };

  // Split words in title
  // Use RegEx to replace special characters with space 
  var splitTitles = [];

  for (var i = 0; i < titles.length; i++) {
      var temp = titles[i].replace(/[&\/\\#,+()$~%.'":*?<>{}[_-]|[\0\d]/g," ")
                          .split(" ");
      splitTitles = splitTitles.concat(temp);
  }

  // Count by unique
  var counts = {};

  for (var i = 0; i < splitTitles.length; i++) {
      counts[splitTitles[i]] = 1 + (counts[splitTitles[i]] || 0);
  }

  // Set the data
  var wordData = [];
  
  for (var item in counts) {
      wordData.push({ x: item, 
                  value: counts[item]
              });
  }

  // Remove dictionary if key is - | ] or blank. Clean up balance after RegEx
  var wordData = wordData.filter(item =>
    (item.x !== "|") &&
    (item.x !== "") &&
    (item.x !== "-") &&
    (item.x !== "]") && 
    (item.x !== "_") && 
    (item.x !== "and") &&
    (item.x !== "el") &&
    (item.x !== "the") &&
    (item.x !== "in") &&
    (item.x !== "or") &&
    (item.x !== "of") &&
    (item.x !== "a") &&
    (item.x !== "x") &&
    (item.x !== "at") &&
    (item.x !== "m"));

  // Sort the list of dictionaries by value
  wordData.sort(function(first, second) {
      return second.value - first.value;
  })

  // Limit to top 35 words
  var topWords = [];

  for (var i = 0; i < 35; i++) {
      topWords.push(wordData[i]);
  }


  // Render word cloud chart
  anychart.onDocumentReady(function() {

      var chartdata = topWords;
      var chart = anychart.tagCloud(chartdata);

      // Create and configure a color scale
      var customColorScale = anychart.scales.linearColor();
      customColorScale.colors(["#246ED1", "#23B5B5"]);

      // Bind customColorScale to the color scale of the chart
      chart.colorScale(customColorScale);

      // Add a color range
      chart.colorRange().enabled(true);

      // Set word angle to straight
      chart.angles([0]);

      // Set the chart title
      chart.title("Most Popular Words Used in Position Titles");

      // Configure the visual settings of the chart
      chart.hovered().fill("#FF5757");
      chart.hovered().fontWeight(800);
      
      // Set the container id
      chart.container("cloud");

      // Initiate drawing the chart
      chart.draw();
  })    
}

function renderWeekday(data){

    var dates = data.map(job => job.created);


    //Get the weekday of the dates
    const daysOfWeek = dates.map(date => new Date(date).getDay());
   

    // Now we have the days as numbers we can get their frequency

    function Frequency(array) {
        const frequency = {};

        array.forEach(value => frequency[value] = 0);
        const uniques = array.filter(value => ++frequency[value] == 1);
        return frequency;
    }

    //Passing in our dates in the function Frequency so we get a dictionary of days and frequencies of job ads:
    const DaysOfWeek = Frequency(daysOfWeek);

    //Initialise a dictionary with empty values to ensure all days of the week are showing on the graph wvwn there are no job posts: 
    var week = {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
    }
    //Consolidate two dictionnaries so all weekdays are showing:
    const accumulative = {
        ...week,
        ...DaysOfWeek
    }
    // Extract the weekdays from the dictionary Frequency and place them in an array to store our variable x:
    var x = [];
    // Iterate through each ID object
    Object.keys(accumulative).forEach(key => {
        // Concatenate "OTU" with each ID number
        x.push(key)
    });
    // Now translate to weekday values - Note in our data, the Saturday is index 0 and Friday is 6 therefore the sequence starting Saturday:
    const weekdays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const x_days = x.map(day => weekdays[day]);
    //Extracting the frequency values for our y
    var y = [];
    // Iterate through each value
    Object.values(accumulative).forEach(value => {
        y.push(value)
    });    
    

    // Create a function to change the order of the index and position Monday as index 0:

    function rearrange(array) {

        Array.prototype.move = function (from, to) {
            this.splice(to, 0, this.splice(from, 1)[0]);
        };

        array.move(0, 6)
        array.move(0, 6)
    }

    //Rearrange the arrays x_days and y:
    rearrange(x_days);
    rearrange(y);

    //Calling our bar plot function:
    barplot(y, x_days);



//Creating a function barplot to create our graph:
  function barplot(y, x_days) {

      var color = []
      var max = Math.max.apply(null, y);
      Object.values(y).forEach(value => {
          if (value === max) {
              color.push('#545454');
          }
          else {
              color.push('#23B5B5');
          }
      });


      var trace1 = {
          x: x_days,
          y: y,
          text: y.map(String),
          textfont: {
              size: 14
          },
          textposition: 'auto',
          hoverinfo: 'none',
          marker: {
              color: color,
              opacity: 0.6,
              line: {
                  color: "#545454",
                  width: 1.5
              }
          },
          type: 'bar'
      };

      var data = [trace1];

      var layout = {
          title: 'Job ads per weekday',
          titlefont: {
              size: 24,
              color: '#000000'
          },
          xaxis: {
              tickfont: {
                  size: 14,
                  color: '#000000'
              }
          },
          yaxis: {
              title: "Number of job ads",
              titlefont: {
                  size: 18,
                  color: '#000000'
              },
        // tickfont: {
            //     size: 14,
            //     color: '#000000'
            // },
            showticklabels: false,
          },
          showlegend: false,
          // height: 300,
          // width: 300
        };

        var hoverBar = ['toImage', 'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d','toggleHover', 'toggleSpikelines', 'hoverCompareCartesian', 'hoverClosestCartesian'];

        Plotly.newPlot('weekday-plot', data, layout, { modeBarButtonsToRemove: hoverBar });
  }
}

function renderJobTable(jobListing,stateSelection,roleSelection){
    d3.select("#individual-job").selectAll("div").remove();
    var url = `/get_benchmark/${stateSelection}/${roleSelection}`;
    d3.json(url).then(function(benchmarkListing) {
        var hoverBar = ['toImage', 'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d','toggleHover', 'toggleSpikelines', 'hoverCompareCartesian', 'hoverClosestCartesian'];
        jobListing = jobListing.filter(job => job.salary_min > 100);
        var loopMax = Math.min(jobListing.length, 30);
        for (i = 0; i < loopMax; i++) {

            // Get data and insert into variable
            var jobKeyword = jobListing[i].keyword;
            var jobRole = jobListing[i].title;
            var jobCompany = jobListing[i].company;
            var jobPlace = jobListing[i].area.replace("[", "").replaceAll("'", "").replace("]", "");
            var jobState = jobListing[i].state;
            var jobDate = jobListing[i].created;
            var jobTime = jobListing[i].contract_time;
            var jobType = jobListing[i].contract_type;
            var jobDescription = jobListing[i].description;
            var jobSalMin = jobListing[i].salary_min;
            var jobSalMax = jobListing[i].salary_max;

            // Create container div for job detail
            var containerDiv = document.createElement('div');
            containerDiv.id = 'job-container';
            containerDiv.className = 'container';

            // Create row div
            var rowDiv = document.createElement('div');
            rowDiv.className = 'row';

            // DIV FOR JOB LISTING
            // Create div for bootstrap
            var bootstrapDivLeft = document.createElement('div');
            bootstrapDivLeft.id = 'insertJobHere';
            bootstrapDivLeft.className = 'col-md-6 mx-auto';

            // Create h3 for job title
            var titleH3 =  document.createElement('h3');
            titleH3.innerText = jobRole;

            // Create a for company
            var companyA =  document.createElement('p');
            companyA.className = 'job-company';
            companyA.innerText = jobCompany;

            // Create ul
            var jobUl =  document.createElement('ul');

            // Create il for place
            var placeIl =  document.createElement('li');
            placeIl.className = 'job-place';
            placeIl.innerText = jobPlace;

            // Create il for date
            var dateIl =  document.createElement('li');
            dateIl.className = 'job-date';
            dateIl.innerText = jobDate;

            // Create il for contract time
            var timeIl =  document.createElement('li');
            timeIl.className = 'job-time';
            timeIl.innerText = jobTime;

            // Create il for contract type
            var typeIl =  document.createElement('li');
            typeIl.className = 'job-type';
            typeIl.innerText = jobType;

            // Create p for job description
            var descriptionP =  document.createElement('p');
            descriptionP.className = 'job-description'
            descriptionP.innerText = jobDescription;

            // DIV FOR CHART
            // Create div for bootstrap
            var bootstrapDivRight = document.createElement('div');
            bootstrapDivRight.id = 'insertChartHere'+i;
            bootstrapDivRight.className = 'col-md-6 benchmark-chart';

            // Append child 
            containerDiv.appendChild(rowDiv);
            rowDiv.appendChild(bootstrapDivLeft);
            bootstrapDivLeft.appendChild(titleH3);
            bootstrapDivLeft.appendChild(companyA);
            bootstrapDivLeft.appendChild(jobUl);
            jobUl.appendChild(dateIl);
            jobUl.appendChild(placeIl);
            if(jobTime !== 'NaN'){
                jobUl.appendChild(timeIl);
            }
            if(jobType !== 'NaN'){
                jobUl.appendChild(typeIl);
            }            
            
            bootstrapDivLeft.appendChild(descriptionP);
            rowDiv.appendChild(bootstrapDivRight);

            // Then append the whole thing onto the test section
            document.getElementById('individual-job').appendChild(containerDiv);

            // SETUP BENCHMARK CHART
            // Get keyword, state, title and company for filtering and plotting
            var selectedKeyword = jobKeyword;
            var selectedState = jobState;
            var selectedTitle = jobRole;
            var selectedCompany = jobCompany;
            var selectedJobRole = selectedCompany + ": " + selectedTitle;

            // Get Minimum & Maximum Salary - conditional function to deal with annual/daily/hourly rates
            if (jobSalMin == "") {
                var selectedMinSal = 0;
                var selectedMaxSal = 0;
            } else if (jobSalMax < 500) {
                selectedMinSal = selectedJob.salary_min * 8;
                selectedMaxSal = selectedJob.salary_max * 8;
            } else selectedMinSal = jobSalMin;
                selectedMaxSal = jobSalMax;

            // Calculate Median Salary 
            var selectedMedSal = (selectedMinSal + selectedMaxSal) / 2;

            // Conditional function to classify a job as "contract" or "permanent" based on salary expression (annual/daily rate)
            if (selectedMinSal < 30000) {
                var selectedContractType = "contract";
            } else selectedContractType = "permanent";
        
        // End temp code 
        
        // Filter by 1) Keyword 2) State 
        var filteredbenchmarkListing = benchmarkListing.filter(item =>
            (item.keyword === selectedKeyword) &&  // Replace with inputValue for job search keyword
            (item.state === selectedState)); // Replace with inputValue for state
        // Filter by Contract_Type
        var permanentBenchmarkListing = filteredbenchmarkListing.filter(item =>
            (item.contract_type === "permanent")); 
        var contractBenchmarkListing = filteredbenchmarkListing.filter(item =>
            (item.contract_type === "contract"));   
        // Setup permanent job benchmark information as arrays
        var permJobRoles = permanentBenchmarkListing.map(row => row.source + ": " + row.job_role);
        var permMinSals = permanentBenchmarkListing.map(row => row.min_sal);
        var permMaxSals = permanentBenchmarkListing.map(row => row.max_sal - row.median);
        var permMedSals = permanentBenchmarkListing.map(row => row.median - row.min_sal);
        var permMinSalsText = permanentBenchmarkListing.map(row => "$"+row.min_sal);
        var permMaxSalsText = permanentBenchmarkListing.map(row => "$"+row.max_sal);
        var permMedSalsText = permanentBenchmarkListing.map(row => "$"+row.median);
        // Setup contract job benchmark information as arrays
        var contractJobRoles = contractBenchmarkListing.map(row => row.source + ": " + row.job_role);
        var contractMinSals = contractBenchmarkListing.map(row => row.min_sal);
        var contractMaxSals = contractBenchmarkListing.map(row => row.max_sal - row.median);
        var contractMedSals = contractBenchmarkListing.map(row => row.median - row.min_sal);
        var contractMinSalsText = contractBenchmarkListing.map(row => "$"+row.min_sal);
        var contractMaxSalsText = contractBenchmarkListing.map(row => "$"+row.max_sal);
        var contractMedSalsText = contractBenchmarkListing.map(row => "$"+row.median);
        
        // Add conditional function to decide to plot permanent or contract benchmark chart
        if (selectedContractType === "permanent") {

            // Add selected data to array
            permJobRoles.push('OFFERED SALARY');
            permMinSals.push(selectedMinSal);
            permMaxSals.push((selectedMaxSal-selectedMedSal));
            permMedSals.push((selectedMedSal-selectedMinSal));
            permMinSalsText.push("$"+selectedMinSal);
            permMaxSalsText.push("$"+selectedMaxSal);
            permMedSalsText.push("$"+selectedMedSal);

            // Setup trace data
            var benchmarkTrace1 = {
                x: permMinSals,
                y: permJobRoles,
                text: permMinSalsText,
                name: "Minimum Salary",
                hoverinfo: "text+name",
                orientation: "h",
                type: "bar",
                marker: {
                    color: "rgb(35,181,181)",
                    opacity: 0.0,
                }
            };
    
            var benchmarkTrace2 = {
                x: permMedSals,
                y: permJobRoles,
                text: permMedSalsText,
                name: "Median Salary",
                hoverinfo: "text+name",
                orientation: "h",
                type: "bar",
                marker: {
                    color: "rgb(35,181,181)",
                    opacity: 0.6,
                    line: {
                        color: "rgb(84,84,84)",
                        width: 2,
                    }
                }
            };
    
            var benchmarkTrace3 = {
                x: permMaxSals,
                y: permJobRoles,
                text: permMaxSalsText,
                name: "Maximum Salary",
                hoverinfo: "text+name",
                orientation: "h",
                type: "bar",
                marker: {
                    color: "rgb(35,181,181)",
                    opacity: 0.6,
                    line: {
                        color: "rgb(84,84,84)",
                        width: 2,
                    }
                }
            };
            
            // Place trace into an array for plotting
            var permBenchmarkData = [benchmarkTrace1, benchmarkTrace2,  benchmarkTrace3];
            
            // Setup chart layout
            var permBenchmarkLayout = {
                title: "Salary Ranges: Offered vs Benchmark (Permanent Full Time)",
                barmode: "stack",
                bargroupgap: 0.1,
                yaxis : { 
                    showgrid : false 
                },
                xaxis: { 
                    zeroline : false, 
                    showgrid : false ,
                    title: "Salary per annum ($AUD)",
                },
                showlegend: false
            };

            // Render chart
            Plotly.newPlot(`insertChartHere${i}`, permBenchmarkData, permBenchmarkLayout,{ modeBarButtonsToRemove: hoverBar });

        } else if (selectedContractType === "contract") {

            // Add selected data to array
            contractJobRoles.push('OFFERED SALARY');
            contractMinSals.push(selectedMinSal);
            contractMaxSals.push((selectedMaxSal-selectedMedSal));
            contractMedSals.push((selectedMedSal-selectedMinSal));
            contractMinSalsText.push("$"+selectedMinSal);
            contractMaxSalsText.push("$"+selectedMaxSal);
            contractMedSalsText.push("$"+selectedMedSal);

            // Setup trace data
            var benchmarkTrace11 = {
                x: contractMinSals,
                y: contractJobRoles,
                text: contractMinSalsText,
                name: "Minimum Salary",
                hoverinfo: "text+name",
                orientation: "h",
                type: "bar",
                marker: {
                    color: "rgb(35,181,181)",
                    opacity: 0.0,
                }
            };

            var benchmarkTrace12 = {
                x: contractMedSals,
                y: contractJobRoles,
                text: contractMedSalsText,
                name: "Median Salary",
                hoverinfo: "text+name",
                orientation: "h",
                type: "bar",
                marker: {
                    color: "rgb(35,181,181)",
                    opacity: 0.6,
                    line: {
                        color: "rgb(84,84,84)",
                        width: 2,
                    }
                }
            };

            var benchmarkTrace13 = {
                x: contractMaxSals,
                y: contractJobRoles,
                text: contractMaxSalsText,
                name: "Maximum Salary",
                hoverinfo: "text+name",
                orientation: "h",
                type: "bar",
                marker: {
                    color: "rgb(35,181,181)",
                    opacity: 0.6,
                    line: {
                        color: "rgb(84,84,84)",
                        width: 2,
                    }
                }
            };

            // Place trace data into an array for plotting
            var contractBenchmarkData = [benchmarkTrace11, benchmarkTrace12,  benchmarkTrace13];

            // Setup chart layout
            var contractBenchmarkLayout = {
                title: "Salary Ranges: Offered vs Benchmark (Contract Day Rate)",
                barmode: "stack",
                bargroupgap: 0.1,
                yaxis : { 
                    showgrid : false 
                },
                xaxis: { 
                    zeroline : false, 
                    showgrid : false,
                    title: "Contract rate per day ($AUD)", 
                },
                showlegend: false,
                legend: {
                    orientation: "h",
                    xanchor: "center",
                    yanchor: "bottom",
                    x: 0.5,
                    y: -0.25,
                }
            };

            // Render chart
            Plotly.newPlot(`insertChartHere${i}`, contractBenchmarkData, contractBenchmarkLayout,{ modeBarButtonsToRemove: hoverBar });
        };
    
    };

	// Position axis titles above horizontal bar charts (problem: titles are really long)
    document.getElementById(`insertChartHere0`).on('plotly_afterplot', function() {
        var yAxisLabels = [].slice.call(document.querySelectorAll('[class^="yaxislayer"] .ytick text, [class*=" yaxislayer"] .ytick text'))
        var bar = document.querySelector('.plot .barlayer .bars path')
        var barHeight = bar.getBBox().height
        var offset = 0.1
        for (var x = 0; x < yAxisLabels.length; x++) {
            var yAxisLabel = yAxisLabels[x];
            yAxisLabel.setAttribute('text-anchor', 'start')
            yAxisLabel.setAttribute('y', yAxisLabel.getAttribute('y') - (barHeight / 4) * offset)
        };
    });       
  
    })
}

function render_Underemp(){ 

    var url1 = `/get_underemployment`;
    var url2 = `/get_historical_salary`;
    var hoverBar = ['toImage', 'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d','toggleHover', 'toggleSpikelines', 'hoverCompareCartesian', 'hoverClosestCartesian'];
    d3.select("#underemp-plot").selectAll("div").remove();

    d3.json(url2)
        .then(data => {var historicalSalaries = data;

        d3.json(url1)
        .then(data => {var underemploymentData = data;

            // Create a lookup table to sort and regroup the columns of data,
            // first by month, then by state:
            var lookup = {};

            function getData(month, state) {
                var byMonth, trace;
                if (!(byMonth = lookup[month])) {;
                    byMonth = lookup[month] = {};
                }
                    // If a container for this month + state doesn't exist yet,
                    // then create one:
                    if (!(trace = byMonth[state])) {
                        trace = byMonth[state] = {
                        x: [],
                        y: [],
                        id: [],
                        text: [],
                        marker: {size: []}
                        };
                    }
                    return trace;
            }

            // Go through each row, get the right trace, and append the data:
            for (var i = 0; i < historicalSalaries.length; i++) {
                var datum = historicalSalaries[i];
                var trace = getData(datum.month, datum.state);
                trace.text.push(datum.state);
                trace.id.push(datum.state);
                trace.x.push(datum.salary);
                trace.marker.size.push(datum.salary*0.5);
                
                // Filter underemployment data to find data with matching month-year
                var underemploymentMatch = underemploymentData.filter(item =>
                    (item.Period === datum.month));
                
                // Format data type from string to float
                underemploymentPercent = parseFloat(underemploymentMatch[0].People);

                // Append
                trace.y.push(underemploymentPercent); 
                    
            }
        
            // Get the group names:
            var months = Object.keys(lookup);

            // In this case, every month-year includes every state, 
            // so we can just infer the states from the *first* year:
            var firstMonth = lookup[months[0]];
            var states = Object.keys(firstMonth);

            // Create the main traces, one for each state:
            var traces = [];
            for (i = 0; i < states.length; i++) {
                var data = firstMonth[states[i]];

                // Create a single trace for the frames to pass data for each month
                traces.push({
                name: states[i],
                x: data.x.slice(),
                y: data.y.slice(),
                id: data.id.slice(),
                text: data.text.slice(),
                mode: 'markers',
                marker: {
                    size: data.marker.size.slice(),
                    sizemode: 'area',
                    sizeref: 18
                }
                });
            }

            // Create a frame for each month. 
            var frames = [];
            for (i = 0; i < months.length; i++) {
                frames.push({
                name: months[i],
                data: states.map(function (state) {
                    return getData(months[i], state);
                    })
                })
            }

            // Create slider steps, one for each frame. 
            var sliderSteps = [];
            for (i = 0; i < months.length; i++) {
                sliderSteps.push({
                method: 'animate',
                label: months[i],
                args: [[months[i]], {
                    mode: 'immediate',
                    transition: {duration: 300},
                    frame: {duration: 300, redraw: false},
                    }]
                });
            }

            var layout = {                
                title: {text: 'Movement Between IT Salaries and Underemployment Rate', x:0.5, y:0.98, xanchor:'center'},
                xaxis: {
                title: 'IT Salaries in Australia',
                range: [50000, 200000]
                },
                yaxis: {
                title: 'Underemployment Rate (%)',
                range: [4,17]
                },
                showlegend: true,
                legend: {
                x: 0,
                y: 0.9,
                xanchor: "left",
                yanchor: "bottom",
                orientation: "h"
                },
                hovermode: 'closest',
                // Use updatemenus to create a play button and a pause button
                updatemenus: [{
                x: 0,
                y: 0,
                yanchor: 'top',
                xanchor: 'left',
                showactive: false,
                direction: 'left',
                type: 'buttons',
                pad: {t: 87, r: 10},
                buttons: [{
                    method: 'animate',
                    args: [null, {
                    mode: 'immediate',
                    fromcurrent: true,
                    transition: {duration: 300},
                    frame: {duration: 500, redraw: false}
                    }],
                    label: 'Play'
                }, {
                    method: 'animate',
                    args: [[null], {
                    mode: 'immediate',
                    transition: {duration: 0},
                    frame: {duration: 0, redraw: false}
                    }],
                    label: 'Pause'
                }]
                }],
                // Add the slider and use `pad` to position it
                // nicely next to the buttons.
                sliders: [{
                pad: {l: 130, t: 55},
                currentvalue: {
                                visible: true,
                                prefix: 'Period:',
                                xanchor: 'right',
                                font: {size: 20, color: '#666'}
                                },
                steps: sliderSteps
                }]
            };
            
            // Create the plot:
            Plotly.newPlot('underemp-plot', {
                data: traces,
                layout: layout,
                frames: frames, 
                config:{displayModeBar: false}
            });

        });
        
    });

}