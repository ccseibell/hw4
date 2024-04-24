

// Load the CSV file
async function loadData() {
    const data = await d3.csv("cleaned_data.csv");

    // Parse and map ordinal values to education and steak preparation
    data.forEach(d => {
        switch (d.Education) {
            case 'Less than high school degree': d.Education_Ordinal = 0; break;
            case 'High school degree': d.Education_Ordinal = 1; break;
            case 'Some college or Associate degree': d.Education_Ordinal = 2; break;
            case 'Bachelor degree': d.Education_Ordinal = 3; break;
            case 'Graduate degree': d.Education_Ordinal = 4; break;
        }

        switch (d.How_do_you_like_your_steak_prepared_) {
            case 'Rare': d.Steak_Preparation_Ordinal = 0; break;
            case 'Medium Rare': d.Steak_Preparation_Ordinal = 1; break;
            case 'Medium': d.Steak_Preparation_Ordinal = 2; break;
            case 'Medium Well': d.Steak_Preparation_Ordinal = 3; break;
            case 'Well': d.Steak_Preparation_Ordinal = 4; break;
        }
    });

    // Aggregate data by education level
    // Calculate percentages instead of counts
    const summary = d3.rollup(data, v => {
        const total = v.length; // Total number of respondents for each education level
        return {
            Rare: d3.sum(v, d => (d.Steak_Preparation_Ordinal === 0) ? 1 : 0) / total,
            MediumRare: d3.sum(v, d => (d.Steak_Preparation_Ordinal === 1) ? 1 : 0) / total,
            Medium: d3.sum(v, d => (d.Steak_Preparation_Ordinal === 2) ? 1 : 0) / total,
            MediumWell: d3.sum(v, d => (d.Steak_Preparation_Ordinal === 3) ? 1 : 0) / total,
            Well: d3.sum(v, d => (d.Steak_Preparation_Ordinal === 4) ? 1 : 0) / total
        };
    }, d => d.Education);

    // Normalize percentages so they add up to 1
    summary.forEach((value, key) => {
        const total = d3.sum(Object.values(value));
        Object.keys(value).forEach(key => {
            value[key] /= total;
        });
    });

    // Convert the summary into an array of objects
    // Each object represents an education level with percentages for each steak preparation type
    return Array.from(summary, ([key, value]) => ({
        Education: key,
        ...value
    }));
}

// Function to draw the visualization
function draw(data) {
    // Set dimensions and margins for the chart
    const margin = { top: 40, right: 160, bottom: 60, left: 60 },
          width = 960 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    // Append SVG object to the body of the page
    const svg = d3.select("#my_dataviz")
                  .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add X axis
    const x = d3.scaleBand()
                .range([0, width])
                .domain(data.map(d => d.Education))
                .padding(0.2);
    svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x).tickSizeOuter(0));

    // Add Y axis
    const y = d3.scaleLinear()
                .domain([0, 1]) // Percentage scale
                .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));

    // Color scale
    const color = d3.scaleOrdinal()
                    .domain(["Rare", "MediumRare", "Medium", "MediumWell", "Well"])
                    .range(['#ff9999', '#ffcc99', '#ffcc66', '#ff9966', '#cc6600']);

    // Show the bars
    svg.append("g")
       .selectAll("g")
       .data(d3.stack().keys(["Rare", "MediumRare", "Medium", "MediumWell", "Well"])(data))
       .enter().append("g")
         .attr("fill", d => color(d.key))
       .selectAll("rect")
       .data(d => d)
       .enter().append("rect")
         .attr("x", d => x(d.data.Education))
         .attr("y", d => y(d[1]))
         .attr("height", d => y(d[0]) - y(d[1]))
         .attr("width", x.bandwidth());
}

// Load and process data, then draw the chart
loadData().then(data => {
    draw(data);
});
