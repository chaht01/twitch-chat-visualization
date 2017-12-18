function ScatterPlot(){
    var width = 500,
        height = 500,
        margin = { left:50, right:50, top:50, bottom:50 };

    // TODO: Complete Initialization Below ////////////////////////////////////////////
    var xVal = function(d){return d[0];},
        xScale = d3.scaleLinear(),
        xAxis = d3.axisBottom();

    var yVal = function(d){return d[1];},
        yScale = d3.scaleLinear(),
        yAxis = d3.axisLeft();

    var sizeVal = function(d){return d[4];},
        sizeScale = d3.scaleLinear(),
        sizeScheme = [8., 15.];

    var colorVal = function(d){return d[2];},
        colorScale = d3.scaleOrdinal(),
        colorScheme = d3.schemeAccent;

    var shapeVal = function(d){return d[3];},
        shapeScale = d3.scaleOrdinal(),
        shapeScheme = d3.symbols;

    var visualVars = {};

    //////////////////////////////////////////////////////////////////////////////////

    function translate(xDelta, yDelta){
        return "translate(" + xDelta + "," + yDelta + ")"
    }

    function my(selection){
        selection.each(function(data){

            // TODO: Complete Scaling Below //////////////////////////////////////////
            xScale
                .domain(d3.extent(data, xVal)).nice()
                .range([0, width - margin.right - margin.left]);

            yScale
                .domain(d3.extent(data, yVal)).nice()
                .range([height - margin.bottom - margin.top, 0]);

            sizeScale
                .domain(d3.extent(data, sizeVal)).nice()
                .range(sizeScheme);

            colorScale
                .domain(d3.extent(data, colorVal))
                .range(colorScheme);

            shapeScale
                .domain(d3.extent(data, shapeVal))
                .range(shapeScheme);

            //////////////////////////////////////////////////////////////////////////

            var svg = d3.select(this)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", translate(margin.left, margin.top));

            // TODO: Render X-Axis Below /////////////////////////////////////////////
            xAxis.scale(xScale)
                .ticks(10)
                .tickFormat(d3.formatPrefix(".1", 1e6));
            svg.append('g')
                .attr('class', 'x-axis')
                .attr('transform', translate(0, height-margin.bottom-margin.top))
                .call(xAxis)


            ///////////////////////////////////////////////////////////////////////////

            // TODO: Render Y-Axis Below //////////////////////////////////////////////
            yAxis.scale(yScale)
                .ticks(10)
                .tickFormat(d3.formatPrefix(".1", 1e6));
            svg.append('g')
                .attr('class', 'y-axis')
                .attr('transform', translate(0, 0))
                .call(yAxis)


            ///////////////////////////////////////////////////////////////////////////

            // TODO: Render Points Below //////////////////////////////////////////////
            svg.selectAll(".point")
                .data(data)
                .enter()
                .append('path')
                .attr('class', 'point')
                .attr('transform', function (d) {
                    return translate(xScale(xVal(d)), yScale(yVal(d)))
                })

                .attr('d', d3.symbol()
                    .type(function(d){
                        return shapeScale(shapeVal(d));
                    })
                    .size(function(d){
                        return sizeScale(sizeVal(d));
                    })
                )
                .attr('fill', function (d) {
                    return colorScale(colorVal(d));
                })

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

                    svg.selectAll('.point')
                        .style('opacity', 0.3)
                        .filter(function (d) {
                            return widthRange[0] <= xScale(xVal(d)) && xScale(xVal(d)) <= widthRange[1] &&
                                heightRange[0] <= yScale(yVal(d)) && yScale(yVal(d)) <= heightRange[1]
                        })
                        .style('opacity', 1)
                        .each(function (d) {
                            n++;
                            xSum += xScale(xVal(d));
                            ySum += yScale(yVal(d));
                            if(!(colorVal(d) in colors)){
                                colors[colorVal(d)] = 0;
                            }
                            colors[colorVal(d)]++;
                            if(!(shapeVal(d) in shapes)){
                                shapes[shapeVal(d)] = 0;
                            }
                            shapes[shapeVal(d)]++;
                        })
                    for(var key in colors){
                        if(colors[key]==0){
                            delete colors[key];
                        }
                    }
                    for(var key in shapes){
                        if(shapes[key]==0){
                            delete shapes[key];
                        }
                    }
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
                    d3.select('#num-of-points').text(n);
                    d3.select('#mean-x').text(d3.format('.2f')(xSum / n));
                    d3.select('#mean-y').text(d3.format('.2f')(ySum / n));
                    d3.select('#freq-shape').text(
                        (function () {
                            var str = "";
                            for(var key in shapes){
                                str += key+": "+shapes[key]+", "
                            }
                            return str.slice(0, -2);
                        })()
                    );
                    d3.select('#freq-color').text(
                        (function () {
                            var str = "";
                            for(var key in colors){
                                str += key+": "+colors[key]+", "
                            }
                            return str.slice(0, -2);
                        })()
                    );
                }else{
                    d3.select('#num-of-points').text("");
                    d3.select('#mean-x').text("");
                    d3.select('#mean-y').text("");
                    d3.select('#freq-shape').text("");
                    d3.select('#freq-color').text("");
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
