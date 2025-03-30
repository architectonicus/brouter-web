class TrackProfileGraph  {
	
    constructor(data) {
      
        this._data = data;
        this._lineColorAttribute = 'gradient';
        this._fillColorAttribute = 'surface';
        this.parentContainer = $('#trackProfileGraph');

        this.lineColorAttrSelection = $(this.parentContainer).find('select[data-id="trackProfileGraphLineSelect"]');
        this.lineColorAttrSelection.val(this._lineColorAttribute);
        this.fillColorAttrSelection = $(this.parentContainer).find('select[data-id="trackProfileGraphFillSelect"]');
        this.fillColorAttrSelection.val(this._fillColorAttribute);
        
        //TODO static getter
        this._svgElementName = 'div.trackProfileGraphSvg';
        this.svgContainer = $(this.parentContainer).find(this._svgElementName);    
     
        this._box =  {
            width: 1100,
            height: 235,
            marginTop: 20,
            marginRight:  30,
            marginBottom: 30,
            marginLeft: 40
        };

        this._axes = {};  // DELETE?????

        const self = this;
        this.lineColorAttrSelection.on('change', function() {
            if( this.value && this.value != self._lineColorAttribute){
            self._lineColorAttribute = this.value;            
            self._initUI(self._data);
            }
        });
        this.fillColorAttrSelection.on('change', function() {
            if( this.value && this.value != self._fillColorAttribute){
            self._fillColorAttribute = this.value;            
            self._initUI(self._data);
            }
        });
        this._initUI(this._data);
    }

    _initUI(data){
        
        // Create the scales.
        const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.cumulDist))
        .range([this._box.marginLeft, this._box.width - this._box.marginRight]);

        const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.alt)).nice()
        .range([this._box.height - this._box.marginBottom, this._box.marginTop]);

        this._axes.x = x;
        this._axes.y = y;
        

        // Create the path generator.
        const line = d3.line()
        //.defined(d => !isNaN(d.alt))
        .x(d => x(d.cumulDist))
        .y(d => y(d.alt));

        // Create the SVG container.
        const svg = d3.create("svg")
        .attr("width", this._box.width)
        .attr("height", this._box.height)
        .attr("viewBox", [0, 0, this._box.width, this._box.height])
        .attr("style", "max-width: 100%; height: auto;");

        // Axes
        // X -> distance
        svg.append("g")
        .attr("transform", `translate(0,${this._box.height - this._box.marginBottom})`)
        .call(d3.axisBottom(x).ticks(this._box.width / 100).tickSizeOuter(0))
        .call(g => g.select(".tick:last-of-type text").append("tspan").text(" km"));
        //.call(g => g.select(".domain").remove());

        // Y -> Altitude
        svg.append("g")
        .attr("transform", `translate(${this._box.marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(this._box.height / 50))
        //.call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").append("tspan").text(" m"));

        // the line and fill color functions
        const lineColor = this.COLOR_FUNCTIONS[this._lineColorAttribute];
        const fillColor = this.COLOR_FUNCTIONS[this._fillColorAttribute];

        //Fill with polys under the line
        const altitudes = data.map( o => o.alt);
        const minAlt = d3.min(altitudes);
        for (let i = 1; i < data.length; i++) {// for each point and the next, create a poly
            const element = data[i];
            const poly = [
                [data[i - 1].cumulDist,data[i - 1].alt], 
                [data[i].cumulDist,data[i].alt], 
                [data[i].cumulDist, minAlt ],
                [ data[i - 1].cumulDist, minAlt ]
            ];
           
            // poly is a local line
            const localLine = d3.line()
            //.curve(d3.curveStep)
            //.defined(d => true)
            .x(d => x(d[0]))
            .y(d => y(d[1]));

            
            const polycolor = fillColor(data[i][this._fillColorAttribute]);
            var thing = svg.append("path")
            .datum(poly)
            .attr("fill", polycolor ) // use +1 index offset because we need 2 points to calc 
                                                            // the gradient, so, the gradient is only available on the next poly
                                                            // we have N points, but N - 1 polys
            
            .attr("stroke", polycolor) // creating artifacts; re use color?
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("data-segment-ix", i-1)
            .attr("d", localLine);
            //.on('mouseover', (event, d) => console.log(event));
            //.on('mouseover', (event, d) => console.log(d[0][0],d[1][0]));
        }

// Append the background line. this separates the colourful altitude profile line
        // from the polys
     
        svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 8)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("transform", `translate(0,-4)`) // so that it floats abot the profile polygons,
        .attr("d", line);

        if( this._lineColorAttribute === 'cumulativeAltitude'){//TO DO: cumulativeAltitude

            console.log("do cumulativeAltitude");
            
        let color = d3.scaleSequential(y.domain(),
        //d3.scaleSequential(y.domain(),d3.interpolateRgbBasis(["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#white", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#000000"]) ));
        d3.interpolateSpectral);
        //d3.interpolateTurbo);

        /*
        d3.scaleLinear()
        .domain([0, 0.5, 1])
        .range(["red", "green", "blue"])
        .interpolate(d3.interpolateRgb.gamma(2.2))
      (0.5)*/
      /* elevation colors
        color = d3.scaleSequential(y.domain(), d3.interpolateRgbBasis(["#3cab24","#21830d","#4db238","#b0c667","#c0d99a","#e9e491","#e5d38c","#dea855","#de9824","#cd580d","#ad3c18"]));
         */
        // Linear gradient for colored line
        svg.append("linearGradient")
        .attr("id", "line-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", this._box.height - this._box.marginBottom)
        .attr("x2", 0)
        .attr("y2", this._box.marginTop)
        .selectAll("stop")
        .data(d3.ticks(0, 1, 5))
        .join("stop")
        //.attr("offset", offset)
        .attr("offset", d => d)
        .attr("stop-color", color.interpolator());


        } else {
            console.log("do other");
        

svg.append("linearGradient")
            .attr("id", "line-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("x2", this._box.width)
        .selectAll("stop")
        .data(data)
        .join("stop")
            .attr("offset",  d => x(d.cumulDist) /  this._box.width)
            .attr("stop-color", d => lineColor(d[this._lineColorAttribute]) );
        }

        // Append the line itself
        svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "url(#line-gradient)")
        .attr("stroke-width", 4)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "square")
        .attr("transform", `translate(0,-6)`) // so that it floats abot the profile polygons,
        .attr("d", line);                     // giving it some white space in between
        
        this.svgContainer.on('mousemove', this._handleMouseMove.bind(this));
       
        this.svgContainer.empty();
        this.svgContainer.append(svg.node());
    }
    
    _handleMouseMove(ev){
        // (event) => {console.log(event); return false;}
        //console.log(ev); 

        
        const segmentix = ev.target.getAttribute('data-segment-ix');
        if( segmentix ) {
            const ix = parseInt(segmentix, 10);

            const evx = ev.originalEvent.clientX;// - this._box.marginLeft;
            const evy = ev.originalEvent.clientY;// - this._box.marginTop;

            const x = this._axes.x
            const y = this._axes.y
            const distanceFromStart = x.invert(evx);
            const completeDist = this._data[this._data.length-1].cumulDist;
            //TODO FIXME should use seg length, not total distance
            const alt = d3.interpolateNumber(this._data[ix].alt, this._data[ix+1].alt)(distanceFromStart/completeDist);

            console.log('distance: ',distanceFromStart,completeDist)
            console.log('alt: ',y(alt), ' / ', (distanceFromStart/completeDist))

    
            this._updateCursor(evx,y(alt));
        }

        
    }

    _updateCursor(x,y){
        this.svgContainer.find('circle[data-cursor]').detach();
        d3.select(this._svgElementName + ' svg').append('circle')
            .attr('data-cursor', true)
            .attr("transform", `translate(0,-10})`)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 6)
            .attr('stroke', 'black')
            .attr('fill', 'white');
    }

    update(track, segmentsLayer){
        
        //DiRRRRRRRRRRRRRRRRRRRRty  !!!!!!!!!!!!!!!
        function toSurface(obj){ // very inneficient... FIXME
            return new URLSearchParams(obj.feature.wayTags.replace(/\s+/g, '&')).get("surface"); 
        };

        let lastDist = 0;
        let lastPoint = null;
        let lastAlt = null;
        let cumulAlt = 0;
        function toObjOrNull(obj){

            if( !lastPoint ){
                lastPoint = new L.LatLng(obj.lat, obj.lng);
                lastAlt = obj.alt;
                return { alt: obj.alt, 
                    segLength: lastDist, 
                    surface: toSurface(obj), 
                    cumulDist: 0, 
                    cumulAlt: 0,                     
                    origDist: obj.feature.distance,
                    gradient: 0
                   }       
            }
            const currentPoint = new L.LatLng(obj.lat, obj.lng);
            const segLength = currentPoint.distanceTo(lastPoint);
            const gradient = 100*(obj.alt - lastAlt) / (segLength); // in 100%

            lastDist = segLength + lastDist;
            lastPoint = currentPoint;
            lastAlt = obj.alt;
            cumulAlt = obj.alt + lastAlt;

            return { alt: obj.alt, 
                     segLength: segLength, 
                     surface: toSurface(obj), 
                     cumulDist: lastDist/1000, // use km
                     cumulAlt: lastAlt,
                     origDist: obj.feature.distance,
                     gradient: gradient
                    }

            }
            

        this._data = track.getLatLngs().map( toObjOrNull );
        console.log('this._data: ',this._data)
        this._initUI(this._data);
    }

     static _SURF_TO_COLOR = {
        ground: 'black',
        compacted: 'brown',
        asphalt: 'grey'
    }

    _surfaceToColor(surf){
        return TrackProfileGraph._SURF_TO_COLOR[surf];
    }

    _gradToColor(grad){
        let c;
        if( grad <= -15 ){
            c = 'green'
        } else if( grad > -15 && grad <= -5 ){
            c = 'lime'
        } else if( grad > -5 && grad <= -0.25 ){
            c = 'palegreen'
        } else if( grad > -0.25 && grad <= 0.25 ){
            c = 'steelblue'
        } else if( grad > 0.25 && grad <= 5 ){
            c = 'gold'
        } else if( grad > 5 && grad <= 15 ){
            c = 'darkorange';
        } else {  // grad > 15  ){
           c = 'red';   
        }

        return c;
    }

    COLOR_FUNCTIONS = {
        surface: this._surfaceToColor,
        gradient: this._gradToColor        
    }

  }
