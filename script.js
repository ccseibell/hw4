// Load and process the CSV file
async function loadData() {
    const data = await d3.csv("cleaned_data.csv");
    console.log("Data loaded successfully");
    console.log("Raw Data:", data);
    console.log("Count of Rare:", data.filter(d => d.Steak_Preparation_Ordinal === 0).length);

    // Map values for education and steak preparation
    return data.map(d => ({
        ...d,
        Education_Ordinal: mapEducation(d.Education),
        Steak_Preparation_Ordinal: mapSteakPreparation(d.How_do_you_like_your_steak_prepared_)
    }));
}

function mapEducation(education) {
    const levels = {
        'Less than high school degree': 0,
        'High school degree': 1,
        'Some college or Associate degree': 2,
        'Bachelor degree': 3,
        'Graduate degree': 4
    };
    return levels[education] || -1; // Testing for unmatched
}

function mapSteakPreparation(preparation) {
    const trimmedPreparation = preparation.trim().toLowerCase();
    const preparations = {
        'rare': 0,
        'medium rare': 1,
        'medium': 2,
        'medium well': 3,
        'well': 4
    };
    return preparations.hasOwnProperty(trimmedPreparation) ? preparations[trimmedPreparation] : -1;
}


function transformData(data) {
    const summary = d3.rollup(data, group => {
        const total = group.length;
        return {
            Rare: group.filter(d => d.Steak_Preparation_Ordinal === 0).length / total,
            MediumRare: group.filter(d => d.Steak_Preparation_Ordinal === 1).length / total,
            Medium: group.filter(d => d.Steak_Preparation_Ordinal === 2).length / total,
            MediumWell: group.filter(d => d.Steak_Preparation_Ordinal === 3).length / total,
            Well: group.filter(d => d.Steak_Preparation_Ordinal === 4).length / total
        };
    }, d => d.Education_Ordinal);

    // Normalize the percentages to ensure they add up to 1 within each group
    summary.forEach((value, key) => {
        const sum = Object.values(value).reduce((acc, curr) => acc + curr, 0);
        Object.keys(value).forEach(k => value[k] /= sum);
    });

    console.log("Data transformed successfully:", summary);

    // Sort the summary data by steak preparation ordinal values
    const sortedSummary = Array.from(summary).sort((a, b) => a[0] - b[0]);

     
    const sortedData = sortedSummary.map(([key, value]) => ({ Education: key, ...value }));

    return sortedData;
}

function draw(data) {
    d3.select("#my_dataviz").select("svg").remove();
    const margin = { top: 40, right: 160, bottom: 60, left: 60 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      svg = d3.select("#my_dataviz").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    console.log("Data in draw function:", data);
  
    // Create a map from ordinal to label
    const educationLabels = {
      0: 'Less than high school degree',
      1: 'High school degree',
      2: 'Some college or Associate degree',
      3: 'Bachelor degree',
      4: 'Graduate degree'
    };
  
    
    const educationLevels = [0, 1, 2, 3, 4];
    
  
    // Map ordinal values to labels for the x-axis
    const x = d3.scaleBand()
      .range([0, width])
      .domain(educationLevels.map(d => educationLabels[d]))
      .padding(0);
    console.log("x.domain():", x.domain());
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));
  
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);
  
    svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));
  
    const color = d3.scaleOrdinal()
      .domain(["Rare", "MediumRare", "Medium", "MediumWell", "Well"])
      .range(['#ff9999', '#ffcc99', '#ffcc66', '#ff9966', '#cc6600']);
  
    console.log("Color domain:", color.domain());

    const stack = d3.stack().keys(["Rare", "MediumRare", "Medium", "MediumWell", "Well"]);
  
    console.log("Data before stack operation:", data);
    console.log("Data after stack operation:", stack(data));
  
    svg.selectAll("g.layer")
      .data(stack(data))
      .enter().append("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter().append("rect")
      .attr("x", d => x(educationLabels[d.data.Education]))
      .attr("y", d => {
        console.log("Bar attributes - y:", d[1]); // Print the 'y' attribute for each bar
        return y(d[1]);
      })
      .attr("height", d => {
        console.log("Bar attributes - height:", y(d[0]) - y(d[1])); // Print the 'height' attribute for each bar
        return y(d[0]) - y(d[1]);
      })
      .attr("width", x.bandwidth())
      .attr("stroke", "#fff")  // Adding white stroke
      .attr("stroke-width", 1);  // Set stroke width
  
    console.log("Visualization drawn successfully");
  }


// Initialization and handling button click to apply filters
async function main() {
    const rawData = await loadData();

    // Function to apply filters and redraw the chart
    function updateVisualization() {
        

        const filters = {
            Lot: document.getElementById('lotFilter').value,
            Smoke: document.getElementById('smokeFilter').value,
            Drink: document.getElementById('drinkFilter').value,
            Gamble: document.getElementById('gambleFilter').value,
            Skydiving: document.getElementById('skydivingFilter').value,
            Speeding: document.getElementById('speedingFilter').value,
            Cheated: document.getElementById('cheatedFilter').value
        };
        console.log("Filters applied:", filters); 

        // Filter data based on the selected values
        const filteredData = rawData.filter(d => {
    return (filters.Lot === "All" || d.Lot_A_or_B === filters.Lot) &&
           (filters.Smoke === "All" || d.Do_you_ever_smoke_cigarettes_ === filters.Smoke) &&
           (filters.Drink === "All" || d.Do_you_ever_drink_alcohol_ === filters.Drink) &&
           (filters.Gamble === "All" || d.Do_you_ever_gamble_ === filters.Gamble) &&
           (filters.Skydiving === "All" || d.Have_you_ever_been_skydiving_ === filters.Skydiving) &&
           (filters.Speeding === "All" || d.Do_you_ever_drive_above_the_speed_limit_ === filters.Speeding) &&
           (filters.Cheated === "All" || d.Have_you_ever_cheated_on_your_significant_other_ === filters.Cheated);
});
        console.log("Filtered Data:", filteredData); // Debug: Log filtered data to verify the output
        if (filteredData.length === 0) {
            console.log("No data meets the filter criteria");
        }

        const transformedData = transformData(filteredData);
        draw(transformedData);
    }

    // Attach event listener to button
    document.getElementById('updateButton').addEventListener('click', updateVisualization);

    // Initial draw
    updateVisualization();
}


main();
