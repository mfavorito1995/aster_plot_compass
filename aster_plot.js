// Looker Wind Rose Chart (Compass-Oriented Aster Chart)
looker.plugins.visualizations.add({
  options: {
    radius: {
      section: "Data",
      order: 1,
      type: "number",
      label: "Circle Radius"
    },
    label_value: {
      section: "Data",
      order: 3,
      type: "string",
      label: "Data Labels",
      values: [{"On":"on"}, {"Off":"off"}],
      display: "radio",
      default: "off"
    },
    color_range: {
      section: "Format",
      order: 1,
      type: "array",
      label: "Color Range",
      display: "colors",
      default: ["#1f77b4"]
    },
  },

  create: function(element, config) {
    element.innerHTML = '<div id="windRoseChart"></div>';
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();
    element.innerHTML = '';

    const width = 500;
    const height = 500;
    const radius = config.radius || 200;
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];

    // Normalize input to ensure all directions exist
    let frequencyMap = {};
    directions.forEach(dir => frequencyMap[dir] = 0);

    const dimension = queryResponse.fields.dimension_like[0].name;
    const measure = queryResponse.fields.measure_like[0].name;

    data.forEach(d => {
      const dir = d[dimension].value.toUpperCase();
      if (frequencyMap.hasOwnProperty(dir)) {
        frequencyMap[dir] = +d[measure].value;
      }
    });

    const svg = d3.select(element)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    const angleScale = d3.scaleBand()
      .domain(directions)
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
      .domain([0, d3.max(Object.values(frequencyMap))])
      .range([0, radius]);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(d => radiusScale(d.value))
      .startAngle(d => angleScale(d.direction))
      .endAngle(d => angleScale(d.direction) + angleScale.bandwidth());

    const color = config.color_range[0];

    const arcs = directions.map(dir => ({ direction: dir, value: frequencyMap[dir] }));

    svg.selectAll("path")
      .data(arcs)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // Add labels
    svg.selectAll("text")
      .data(arcs)
      .enter()
      .append("text")
      .attr("transform", function(d) {
        const angle = angleScale(d.direction) + angleScale.bandwidth() / 2 - Math.PI/2;
        const r = radius + 15;
        return `translate(${Math.cos(angle) * r}, ${Math.sin(angle) * r})`;
      })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("font-size", "10px")
      .text(d => d.direction);

    done();
  }
});
