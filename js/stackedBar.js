function StackedBar(){
    var width = 500,
        height = 200,
        margin = { left:50, right:50, top:50, bottom:50 };

    var xVal = function(d){return parseInt(d.tick);},
        xScale = d3.scaleLinear(),
        xAxis = d3.axisBottom();

    var yVal = function(d){return d.total;},
        yScale = d3.scaleLinear(),
        yAxis = d3.axisLeft();

    var sizeVal = function(d){return d[4];},
        sizeScale = d3.scaleLinear(),
        sizeScheme = [8., 15.];

    var colorVal = function(d){return d[2];},
        colorScale = d3.scaleOrdinal(),
        colorScheme = d3.schemeCategory20b;

    var shapeVal = function(d){return d[3];},
        shapeScale = d3.scaleOrdinal(),
        shapeScheme = d3.symbols;

    var visualVars = {};


    function translate(xDelta, yDelta){
        return "translate(" + xDelta + "," + yDelta + ")"
    }

    function my(selection){
        selection.each(function(data){
            var keys = data.columns.slice(1);

            xScale
                .domain(d3.extent(data, xVal)).nice()
                .range([0, width - margin.right - margin.left]);

            yScale
                .domain(d3.extent(data, yVal)).nice()
                .range([height - margin.bottom - margin.top, 0]);


            colorScale
                .domain(keys)
                .range(colorScheme);



            var svg = d3.select(this)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", translate(margin.left, margin.top));

            xAxis.scale(xScale)
                // .ticks(10)
                // .tickFormat(d3.formatPrefix(".1", 1e6));
            svg.append('g')
                .attr('class', 'x-axis')
                .attr('transform', translate(0, height-margin.bottom-margin.top))
                .call(xAxis)

            svg.append("g")
                .selectAll("g")
                .data(d3.stack().keys(keys)(data))
                .enter().append("g")
                .attr("fill", function(d) { return colorScale(d.key); })
                .selectAll(".bar")
                .data(function(d) { return d; })
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) {
                    return xScale(d.data.tick);
                })
                .attr("y", function(d) { return yScale(d[1]); })
                .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
                .attr("width", width/data.length);

            var legend = svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("text-anchor", "end")
                .selectAll("g")
                .data(keys.slice().reverse())
                .enter().append("g")
                .attr("transform", function(d, i) { return "translate(" + i * 20 + ", 0)"; });

            legend.append("rect")
                .attr("x", 19)
                .attr("width", 19)
                .attr("height", 19)
                .attr("fill", colorScale);

            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9.5)
                .attr("dy", "0.32em")
                .text(function(d) { return d; });

            /**
             * brushing
             */
            var brush = d3.brush()
                .extent(
                    [[0, 0], [width-margin.right-margin.left, height-margin.bottom-margin.top]]
                )
                .on('brush', update)
                .on('end', update)
            function update() {
                var extent = d3.event.selection;
                if(extent) {
                    var widthRange = [extent[0][0], extent[1][0]]
                    var heightRange = [extent[0][1], extent[1][1]]
                    var xSum = 0, ySum = 0, n = 0;
                    var colors = {}, shapes = {};

                    svg.selectAll('.bar')
                        .style('opacity', 0.3)
                        .filter(function (d) {
                            return widthRange[0] <= xScale(d.data.tick) && xScale(d.data.tick) <= widthRange[1] &&
                                heightRange[0] <= yScale(d[1]) && yScale(d[0]) <= heightRange[1]
                        })
                        .style('opacity', 1)
                        .each(function (d) {
                            console.log(d)
                        })

                }else{
                    svg.selectAll('.point')
                        .style('opacity', 1)
                    n = 0;
                    xSum = 0;
                    ySum = 0;
                    colors = {};
                    shapes = {};

                }
                if(n>0){

                }else{

                }
            }

            svg.append('g')
                .attr('class', 'brush')
                .call(brush)



            ///////////////////////////////////////////////////////////////////////////

        });
    }

    // TODO: Complete Getters and Setters /////////////////////////////////////////////
    my.width = function(value){
        if(!arguments.length) return width;
        width = value;
        return my;
    }

    my.height = function(value){
        if(!arguments.length) return height;
        height = value;
        return my;
    }

    my.x = function(fn){
        if(!arguments.length) return xVal;
        xVal = fn;
        return my;
    }

    my.y = function(fn){
        if(!arguments.length) return yVal;
        yVal = fn;
        return my;
    }

    my.color = function(fn){
        if(!arguments.length) return colorVal;
        colorVal = fn;
        return my;
    }

    my.shape = function(fn){
        if(!arguments.length) return shapeVal;
        shapeVal = fn;
        return my;
    }

    my.size = function(fn){
        if(!arguments.length) return sizeVal;
        sizeVal = fn;
        return my;
    }

    my.margin = function (value){
        if(!arguments.length) return margin;
        margin = value;
        return my;
    }

    my.visualVariables = function(value){
        if(!arguments.length) return visualVars;
        visualVars = value;
        return my;
    }
    ///////////////////////////////////////////////////////////////////////////////////

    return my;
}
