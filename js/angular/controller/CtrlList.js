app.controller('VideoListController', function ($location, $sce, videoListValue) {
    var videoList = this;
    console.log(videoListValue)
    videoList.list = videoListValue

    videoList.viewDetail = function(item){
        $location.path('/detail/'+item.id);
    }





    var colorScale = d3.scaleOrdinal(),
        colorScheme = d3.schemeCategory20b;

    function updateDicts(data, video) {
        video.keys.forEach(function (key) {
            video.dicts[key] = 0;
        })
        data.forEach(function (d) {
            for (var cat in d){
                if(cat in video.dicts){
                    video.dicts[cat]+=parseInt(d[cat]);
                }
            }
        })
        return video.dicts;
    }
    videoList.trustSrc = function(src) {
        return $sce.trustAsResourceUrl(src);
    }
    videoList.initVideo = function (video) {
        video.dicts = {};
        video.originDicts = {};
        d3.csv(video.path.timeline, function(d, i, columns){
            for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
            d.total = t;
            return d;
        }, function(error, data) {
            if (error) throw error;

            video.keys = data.columns.slice(1);
            video.originDicts = updateDicts(data, video);
            var canvas = document.getElementById('preview_chart_'+video.id)
            var streamContainer =canvas.parentNode;
            paintCanvas(canvas, data, streamContainer, video);
            rationalMap(data, video)
        });

    }

    function rationalMap(data, video) {
        var container = document.getElementById('preview_map_'+video.id).parentNode;
        var svg = d3.select('#preview_map_'+video.id);
        var xScale = d3.scaleLinear(),
            yScale = d3.scaleLinear();

        var width = container.clientWidth * 0.85,
            height = width*0.75,
            tooltipHeight = 50,
            tooltipWidth = 65,
            margin = {left: 50, bottom: 50};
        svg
            .attr("width", width)
            .attr("height", height)


        var mapData = [],
            totalCnt = 0;
        d3.stack().keys(video.keys)(data).forEach(function(data, i){
            var color = colorScale(data.key);
            var catWidth = video.originDicts[data.key]
            var catHeight = data.map(function(d){
                return d[1]-d[0]
            }).reduce(function(a,b){
                return Math.max(a,b);
            })
            totalCnt += catWidth;
            mapData.push({
                name: data.key,
                color: color,
                width: catWidth,
                height: catHeight,
            })
        })
        mapData.sort(function (a, b) {
            return a.width - b.width
        })
        mapData.forEach(function (d, i) {
            d.x =  i==0 ? 0 : mapData[i-1].width + mapData[i-1].x
        })




        xScale
            .domain([0, totalCnt])
            .range([0, width-margin.left])
        yScale
            .domain(d3.extent(mapData, function (d) {
                return d.height
            }))
            .range([0, height-tooltipHeight-margin.bottom])

        var cell = svg.selectAll('sharpe')
            .data(mapData)
            .enter()
            .append('rect')
            .attr('width', function (d) {
                return xScale(d.width)
            })
            .attr('height', function (d) {
                return yScale(d.height)
            })
            .attr('x', function (d) {
                return xScale(d.x)+margin.left
            })
            .attr('y', function (d) {
                return height-yScale(d.height) - margin.bottom
            })
            .attr('fill', function (d) {
                return d.color
            })


        var feed = svg
            .append('text')
            .attr('class', 'total_feed')

        var feedMax = svg
            .append('text')
            .attr('class', 'total_feed_max')

        var tooltip = svg
            .append("g")
            .attr("class", "tooltip")
            .attr("opacity", 0)
        tooltip
            .append("rect")
            .attr("class", "tooltip_inner")
            .attr('width', function(){
                return tooltipWidth
            })
            .attr('height', function(){
                return tooltipHeight-10
            })
            .attr('fill', '#3B3F44')

        var text = tooltip
            .append('text')
            .attr("fill", "#fff")

        cell
            .on('mouseover', function (d) {
                text
                    .text(function () {
                        return d.name;
                    })
                    .attr("dy", function () {return tooltipHeight/2;})
                    .attr("dx", function () {return tooltipWidth/2;})
                    .attr("text-anchor", "middle")
                tooltip
                    .attr('transform', function () {
                        return "translate(" + (margin.left+xScale(d.x) + xScale(d.width)/2 - tooltipWidth/2) + "," + (height-yScale(d.height)-tooltipHeight - margin.bottom) + ")"
                    })

                tooltip
                    .attr('opacity', 0.9)

                feed
                    .text(d.width)
                    .attr("font-size", 10)
                    .attr("dx", function () {
                        return margin.left + xScale(d.x) + xScale(d.width)/2
                    })
                    .attr("dy", function () {
                        return height-margin.bottom-10
                    })
                    .attr("text-anchor", "middle")
                    .attr("fill", "#fff")

                feedMax
                    .text(d.height)
                    .attr("font-size", 10)
                    .attr("dx", function () {
                        return margin.left + xScale(d.x) + xScale(d.width)/2
                    })
                    .attr("dy", function () {
                        return height-margin.bottom - yScale(d.height) + 15
                    })
                    .attr("text-anchor", "middle")
                    .attr("fill", "#fff")
            })
            .on('mouseout', function (d) {
                tooltip
                    .attr("opacity", 0)
                feed
                    .text("")
                feedMax
                    .text("")
            })

        svg.append("text")
            .attr('transform', function () {
                return "translate(" + ((width-margin.left)/2) + "," + ((height-margin.bottom)+margin.bottom/2) + ")"
            })
            .attr("fill", "#fff")
            .text("total feed")

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("fill", "#fff")
            .text("max feed per tick");



    }






    function paintCanvas(canvas, data, container, video) {
        var context = canvas.getContext('2d')
        var width = container.clientWidth,
            height = 200;
        var tickVal = function(d){return parseInt(d.tick);},
            xScale = d3.scaleLinear(),
            xAxis = d3.axisBottom();
        var countVal = function(d){return d.total;},
            yScale = d3.scaleLinear(),
            yAxis = d3.axisLeft();


        xScale
            .domain(d3.extent(data, tickVal))

        yScale
            .domain(d3.extent(data, countVal))

        drawChart(width, height)

        function drawChart(width, height){
            xScale
                .range([0, width]);

            yScale
                .range([0, height]);

            colorScale
                .domain(video.keys)
                .range(colorScheme);


            canvas.width = width;
            canvas.height = height;
            context.fillStyle = "transparent";
            context.fillRect(0, 0, canvas.width, canvas.height)

            var tickrange = d3.extent(data, tickVal);
            d3.stack().keys(video.keys)(data).forEach(function(data){
                context.fillStyle = colorScale(data.key);

                    data.forEach(function (d) {
                        if(d[0]!=d[1]){
                            context.beginPath();

                            var x = xScale(d.data.tick);
                            var y;
                            var length = yScale(d[1]) - yScale(d[0]);
                            y = yScale(d[1]);

                            context.rect(x, height-y, width / (tickrange[1] - tickrange[0]), length);

                            context.fill();
                        }
                    })


            });
        }
    }
})
