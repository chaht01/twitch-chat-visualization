var originDicts = {};
var dicts = {};
var colorVal = function(d){return d[2];},
    colorScale = d3.scaleOrdinal(),
    colorScheme = d3.schemeCategory20b;
var keys;
var player;
var currTick = 0;
var chatlogs = [];
var filterCat = [];
var dispatch = d3.dispatch("chat", "catFilter", "resize", "tick")
document.addEventListener("DOMContentLoaded", function () {
    embedVideo(187511298);
    embedChat()
    d3.csv("./data/parsed/tick_to_cats.csv", function(d, i, columns){
        for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
        d.total = t;
        return d;
    }, function(error, data) {
        if (error) throw error;

        keys = data.columns.slice(1);
        originDicts = updateDicts(data);
        var canvas = document.getElementById('stackedBarCanvas')
        paintCanvas(canvas, data);

        treeMap(dicts, false);

    });
});

var resizeTimer;

window.addEventListener('resize', function(e) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        treeMap(dicts);
        dispatch.call("resize")
    }, 250);

});




function embedChat() {
    d3.csv("./data/parsed_log.csv", function(d, i, columns){
        return d;
    }, function (error, data) {
        if (error) throw error;
        var chatDicts = {};
        var rankMap = [];
        for(var key in originDicts){
            rankMap.push(key);
        }
        rankMap.sort(function (a, b) {
            return originDicts[b] - originDicts[a]
        })
        data.forEach(function (d) {
            if(!(d['offset_seconds'] in chatDicts)){
                chatDicts[parseInt(d['offset_seconds'])] = []
            }
            d['cat'] = '';
            for(var r=0; r<rankMap.length; r++){
                if(d['parsed'].includes(rankMap[r])){
                    d['cat'] = rankMap[r];
                    break;
                }
            }
            chatDicts[parseInt(d['offset_seconds'])].push(d);
        })

        setInterval(function () {
            var playerTick = parseInt(player.getCurrentTime());
            dispatch.call("tick", null, playerTick);
            if(currTick != playerTick){
                currTick = playerTick;
                chatlogs = chatlogs.concat(chatDicts[currTick]);

                if(chatDicts[currTick]){
                    chatDicts[currTick].forEach(function (log) {
                        var node = document.createElement("LI");
                        // var catFlag = document.createElement("SPAN");
                        var text = document.createElement("SPAN");
                        node.classList.add("chatlog");
                        // catFlag.classList.add("category");


                        if(log['cat'].length!=0){
                            var catDict = {};
                            log['cat'].split('').forEach(function (char) {
                                if(!(char in catDict)){
                                    catDict[char] = 0;
                                }
                                catDict[char]++;
                            })
                            var start, end;
                            var offset = 1;
                            start = log['text'].indexOf(log['cat'][0]);
                            end = start;
                            if(Object.keys(catDict).length>1){
                                while(offset<log['cat'].length){
                                    end = log['text'].indexOf(log['cat'][offset], end+1);
                                    offset++;
                                }
                            }else{
                                for(var i=start+1; i<log['text'].length; i++){
                                    end = i;
                                    if(log['text'][i] != log['cat'][0]){
                                        end--;
                                        break;
                                    }
                                }
                            }

                            var strWithCat = log['text'].slice(0, start)+
                                "<span class='keyword' style='background:"+colorScale(log['cat'])+"'>"+
                                log['text'].slice(start, end+1)+
                                "</span>"+
                                log['text'].slice(end+1)
                            text.innerHTML = strWithCat;
                        }else{
                            text.innerHTML = log['text'];
                        }


                        // text.append(document.createTextNode(log["text"]));

                        // node.appendChild(catFlag);
                        node.appendChild(text);

                        var chatContainer = document.getElementById("chat");
                        chatContainer.appendChild(node);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    })
                }


            }
        },500)
    })
}

dispatch.on("chat.clear", function () {
    chatlogs = [];

    var chatContainer = document.getElementById("chat");
    while(chatContainer.hasChildNodes()){
        chatContainer.removeChild(chatContainer.firstChild);
    }

})

function embedVideo(id) {
    var options = {
        width: '100%',
        height: '100%',
        video: id,
        autoplay: false,
    };
    player = new Twitch.Player("twitchVideo", options);
}


function treeMap(dicts) {
    var container = document.getElementById('treeMap');
    var width = container.clientWidth,
        height = container.clientHeight,
        margin = { left:50, right:50, top:50, bottom:50 },
        svg;
    d3.select("#treeMap").selectAll("svg").remove()
    svg = d3.select("#treeMap")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")

    var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
        color = d3.scaleOrdinal(d3.schemeCategory20c.map(fader)),
        format = d3.format(",d");

    var treemap = d3.treemap()
        .tile(d3.treemapResquarify)
        .size([width, height])
        .round(true)

    var treeLikeDicts = function (d) {
        var ret = {
            name:"keywords",
            children:[]
        };
        var i = 0;
        for(var item in d){
            ret.children.push(
                {
                    name: "keyword_"+i,
                    children:[
                        {
                            name: item,
                            size: d[item]
                        }
                    ]
                }
            )
            i++;
        }
        return ret;
    }

    var root = d3.hierarchy(treeLikeDicts(dicts))
        .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
        .sum(sumBySize)
        .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

    treemap(root);

    var cell = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    dispatch.on("catFilter.opacity", function () {
        cell
            .style("opacity", 0.3)
            .filter(function (d) {
                var idx = filterCat.indexOf(d.data.name);
                return filterCat.length ==0 || idx>-1
            })
            .style("opacity", 1)
    })

    cell
        .on('click', function (d) {
            var idx = filterCat.indexOf(d.data.name);
            if(idx>-1){
                filterCat.splice(idx, 1)
            }else{
                filterCat.push(d.data.name)
            }
            dispatch.call("catFilter")
        })
    cell.append("rect")
        .attr("id", function(d) { return d.data.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("fill", function(d) {
                return colorScale(d.data.name);
        })



    cell.append("clipPath")
        .attr("id", function(d) { return "clip-" + d.data.id; })
        .append("use")
        .attr("xlink:href", function(d) { return "#" + d.data.id; });


    cell.append("text")
        .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
        .attr("dy", function (d) {return (d.y1 - d.y0)/2;})
        .attr("dx", function (d) {return (d.x1 - d.x0)/2;})
        .attr("text-anchor", "middle")
        .attr("font-size", function (d) {
            return (d.x1-d.x0)*(d.y1-d.y0)/1000
        })
        .attr("fill", "#000")
        .text(function(d) { return d.data.name.split(/(?=[A-Z][^A-Z])/g); });

    cell.append("title")
        .text(function(d) { return d.data.name.split(/(?=[A-Z][^A-Z])/g) + "\n" + format(d.value); });

    cell
        .style("opacity", 0.3)
        .filter(function (d) {
            var idx = filterCat.indexOf(d.data.name);
            return filterCat.length ==0 || idx>-1
        })
        .style("opacity", 1)
    function sumBySize(d) {
        return d.size;
    }
}

function updateDicts(data) {
    keys.forEach(function (key) {
        dicts[key] = 0;
    })
    data.forEach(function (d) {
        for (var cat in d){
            if(cat in dicts){
                dicts[cat]+=parseInt(d[cat]);
            }
        }
    })
    return dicts;
}

function paintCanvas(canvas, data) {
    var context = canvas.getContext('2d')
    var width = 200,
        height,
        margin = { left:50, right:50, top:50, bottom:50 };
    var tickVal = function(d){return parseInt(d.tick);},
        xScale = d3.scaleLinear(),
        xAxis = d3.axisBottom();
    var countVal = function(d){return d.total;},
        yScale = d3.scaleLinear(),
        yAxis = d3.axisLeft();
    var tickRange = d3.extent(data, tickVal)
    var defaultHeight = tickRange[1] - tickRange[0];

    xScale
        .domain(d3.extent(data, countVal))
    yScale
        .domain(d3.extent(data, tickVal))

    setHeightAndDraw();
    dispatch.on("resize.timeline", function () {
        setHeightAndDraw()
    })
    function setHeightAndDraw() {
        var resolution = document.getElementById("resolutionBar")
        var maxResolution = resolution.max;
        if(parseInt(resolution.value)< parseInt(maxResolution)){
            height = defaultHeight / resolution.value;
        }else{
            height = document.getElementById("timelineChart").clientHeight
        }
        document.getElementById('resolutionValue').innerText =
            resolution.value == resolution.max ? "100% Height" : "1px : "+resolution.value+"sec";

        drawChart(width, height)
    }

    document.getElementById("resolutionBar").addEventListener("change", setHeightAndDraw);

    dispatch.on("catFilter.timeline", function () {
        drawChart(width,height)
    })

    function drawChart(width, height){
        xScale
            .range([0, width]);

        yScale
            .range([0, height]);

        colorScale
            .domain(keys)
            .range(colorScheme);


        canvas.width = width;
        canvas.height = height;
        context.fillStyle = "#0f0f0f";
        context.fillRect(0, 0, canvas.width, canvas.height)
        keys.forEach(function (key) {
            dicts[key] = 0;
        })
        data.forEach(function (d) {
            for (var cat in d){
                if(cat in dicts){
                    dicts[cat]+=parseInt(d[cat]);
                }
            }
        })
        var tickrange = d3.extent(data, tickVal);
        d3.stack().keys(keys)(data).forEach(function(data){
            context.fillStyle = colorScale(data.key);
            if(filterCat.length==0 || filterCat.indexOf(data.key)>-1) {
                data.forEach(function (d) {
                    if(d[0]!=d[1]){
                        context.beginPath();

                        var y = yScale(d.data.tick);
                        var x;
                        var length = xScale(d[1]) - xScale(d[0]);
                        if(filterCat.length==0){
                            x = xScale(d[0]);

                            context.rect(x, y, length, height / (tickrange[1] - tickrange[0]));
                        }else{

                            context.rect(0, y, length, height / (tickrange[1] - tickrange[0]));
                        }
                        context.fill();
                    }
                })
            }

        });

        var brush = d3.brushY()
            .extent(
                [[0, 0], [width, height]]
            )
            .on('brush', update)
            .on('end', update)
        var extent = [0, 0];
        function update() {
            var newExtent = d3.event.selection;
            if(newExtent) {
                var heightRange = [newExtent[0], newExtent[1]]
                var result = []
                var startTick = 0
                for(var i=0; i<data.length; i++){
                    if(heightRange[0] <= yScale(data[i].tick) && yScale(data[i].tick) <= heightRange[1]){
                        result.push(data[i]);
                        if(startTick==0){
                            startTick = data[i].tick
                        }
                    }
                }
                updateDicts(result);
                treeMap(dicts);
                if(newExtent[0]!=extent[0]){
                    player.seek(startTick);
                    currTick = startTick;
                    dispatch.call("chat")
                }
                extent = newExtent;
            }else{
                updateDicts(data);
                treeMap(dicts);
            }

        }

        var svg = d3.select("#stackedBarFake");
        if(svg){
            var fakeContainer = document.getElementById("stackedBarFake");
            while(fakeContainer.hasChildNodes()){
                fakeContainer.removeChild(fakeContainer.firstChild);
            }
        }
        var svg_container = svg
            .append("svg")
            .attr("width", width)
            .attr("height", height)

        svg_container
            .append('rect')
            .attr("width", width)
            .attr("height", 1)
            .attr('class', 'progressbar')
            .attr("fill", '#ff0000')

        svg_container
            .append('rect')
            .attr("width", width)
            .attr("height", 1)
            .attr('class', 'currentbar')
            .attr("fill", '#40D583')

        svg_container
            .append('text')
            .attr("dy", 5)
            .attr("dx", width-10)
            .attr("text-anchor", "end")
            .attr("font-size", function (d) {
                return 16
            })
            .attr("fill", function (d) {
                return "#ff0000"
            })
            .attr("class", "timestamp")

        svg_container
            .append('g')
            .attr('class', 'brush')
            .call(brush)


        var tickScale = d3.scaleLinear();
        tickScale
            .range(d3.extent(data, tickVal))
            .domain([0, height])

        svg
            .on("mousemove", function () {
                var coords = d3.mouse(this)
                svg
                    .select('.progressbar')
                    .attr('y', coords[1])
                var lapseTick = tickScale(coords[1]);
                var formatedText = tickFormat(lapseTick)
                svg
                    .select('.timestamp')
                    .attr("dy", coords[1])
                    .text(function () {
                        return formatedText
                    })
            })
        dispatch.on("tick.timeline", function (currTick) {
            svg_container
                .select('.currentbar')
                .attr('y', yScale(currTick))
        })
    }

    function tickFormat(val) {
        var h = parseInt(val/3600),
            m = parseInt((val%3600)/60),
            s = parseInt(val%60);
        if(m<10) m = "0"+m;
        if(s<10) s = "0"+s;
        return h+":"+m+":"+s
    }
}
