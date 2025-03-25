
class TrackProfileGraph  {
	
    

    constructor(data) {
      // Always call super first in constructor
      //super();
      
        this._data = data;

       this._initUI(this._data);

    }

    _initUI(data){
        
        
        const width = 600;
        const height = 400;
        const marginTop = 20;
        const marginRight = 30;
        const marginBottom = 30;
        const marginLeft = 40;

        

        // Create the scales.
        const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.distance))
        .range([marginLeft, width - marginRight]);

        const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.alt)).nice()
        .range([height - marginBottom, marginTop]);

        

        const color = d3.scaleSequential(y.domain(), d3.interpolateTurbo);

        // Create the path generator.
        const line = d3.line()
        .defined(d => !isNaN(d.alt))
        .x(d => x(d.distance))
        .y(d => y(d.alt));

        // Create the SVG container.
        const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

        svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
        //.call(g => g.select(".domain").remove());

        svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y))
        //.call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").append("tspan").text("m"));

        //FILL
        //data2 = [];
        //data2.length = data.length + 2;
        const minAlt = 0; //TDFixed
        for (let i = 0; i < data.length - 1; i++) {
            const element = data[i];
            const iData = [
                [data[i].distance,data[i].alt], [data[i+1].distance,data[i+1].alt], [ data[i+1].distance, minAlt ],[ data[i].distance, minAlt ]
            ];
           
            const localLine = d3.line()
            //.curve(d3.curveStep)
            //.defined(d => true)
            .x(d => x(d[0]))
            .y(d => y(d[1]));

            svg.append("path")
            .datum(iData)
            .attr("fill", this._SURF_TO_COLOR[data[i].surf])
            .attr("stroke", "none")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", localLine)
            .on('mouseover', (event, d) => console.log(event));
            //.on('mouseover', (event, d) => console.log(d[0][0],d[1][0]));
        }

     // Append the background line.
        svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 8)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);



        // Append the color gradient.

        svg.append("linearGradient")
        .attr("id", "line-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", height - marginBottom)
        .attr("x2", 0)
        .attr("y2", marginTop)
        .selectAll("stop")
        .data(d3.ticks(0, 1, 5))
        .join("stop")
        .attr("offset", d => d)

        .attr("stop-color", color.interpolator());

        // Append the line.
        svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "url(#line-gradient)")
        .attr("stroke-width", 4)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "square")
        .attr("d", line);



        const container = $('#trackProfileGraph');    
        container.empty();
        // Append the SVG element.
        container.append(svg.node());


    }
    
    update(track, segmentsLayer){
        console.log(track);

        var geojsonFeatures = geoDataExchange.buildGeojsonFeatures(track.getLatLngs(), {
            interpolate: false,
            normalize: false,
        });
        //console.log(track.getLatLngs());
        //console.log(geojsonFeatures);

        //DiRRRRRRRRRRRRRRRRRRRRty  !!!!!!!!!!!!!!!
        function toSurface(obj){
            return new URLSearchParams(obj.feature.wayTags.replace(/\s+/g, '&')).get("surface"); 
        };

        const set  = new Set();

        let lastDist = 0;
        function toObjOrNull(obj){

            const key = obj.message[0]+""+obj.message[1];
            if(set.has(key)){
                return null;
            } else {
                set.add(key);
                lastDist =  obj.feature.distance + lastDist;
                return { alt: obj.alt, distance: lastDist, surf: toSurface(obj)}
            }
        }

       
        //this.addData(geojsonFeatures);
        const temp = track.getLatLngs().map( toObjOrNull );
        this._data = temp.filter( (o) => o);
        
console.log(this._data);
        this._initUI(this._data);
    }

    _SURF_TO_COLOR = {
        ground: 'black',
        compacted: 'brown',
        asphalt: 'grey'
    }
  }
