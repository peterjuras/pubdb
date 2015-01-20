var RAW_CARD_HTML = "<div class=\"card myCard {4}\"><div class=\"content\"><a href=\"{3}\"><i class=\"right floated download icon\"></i></a><div class=\"header\">{0}</div><div class=\"meta\">{2}</div><div class=\"description\">{1}</div></div></div>";
var RAW_YEAR_HTML = "<h2 id=\"yearSection{0}\">{0}</h2><div class=\"ui cards\">";
var MEDIEN_IFO_LINK = "https://www.medien.ifi.lmu.de/";
var authorPubGroups;

$(document).ready(function () {
    if (!String.prototype.format) {
        String.prototype.format = function () {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined'
                  ? args[number]
                  : match
                ;
            });
        };
    }

    var param = getParameterByName('id');
    var id = param ? parseInt(param) : 6;

    displayAuthor(id);
});

$(window).resize(function () {
    plotBarChart();

    switchFloatedChart();
});

function switchFloatedChart() {
    if ($(window).width() >= 768) {
        $('#barChartArea').addClass('left');
    } else {
        
    }
}

function displayAuthor(id) {
    var author, authorPubs = [], cardHtml = '';
    authors.some(function (element) {
        var authorFound = element.id == id;
        if (authorFound) {
            author = element;
        }
        return authorFound;
    });

    $('#authorName').text(author.name);

    author.publications.forEach(function (element) {
        publications.some(function (pub) {
            if (pub.id.indexOf(element) != -1) {
                authorPubs.push(pub);
                console.log(pub);
            }
        });
    });

    authorPubs.sort(function (a, b) {
        return parseInt(b.year) - parseInt(a.year);
    });

    authorPubGroups = groupByYear(authorPubs);
    var firstYear = true;
    authorPubGroups.forEach(function (element) {
        if (!firstYear) {
            cardHtml += '</div>';
        } else {
            firstYear = false;
        }
        cardHtml += RAW_YEAR_HTML.format(element.year);
        element.pubs.forEach(function (pub) {
            cardHtml += visualizePublication(pub);
        });
    });

    $('#myCards').html(cardHtml);

    setTimeout(plotBarChart, 200)
}

function visualizePublication(publication) {
    /*
    {
    "id": "pub_101",
    "year": "2013",
    "authors": [{
        "name": "Sonja Rümelin",
        "url": "http://www.medien.ifi.lmu.de/team/sonja.ruemelin/"
    }, {
        "name": "Frederik Brudy"
    }, {
        "name": "Andreas Butz",
        "url": "http://www.medien.ifi.lmu.de/team/andreas.butz/"
    }],
    "title": {
        "url": "/forschung/publikationen/detail?pub=ruemelin2013chi",
        "name": "Up And Down And Along: How We Interact With Curvature"
    },
    "description": {
        "html": "Presented at the workshop <a href=\"http://displayworkshop.media.mit.edu/\" target=\"_blank\">'Displays Take New Shape: An Agenda for Interactive Surfaces'</a> in conjunction with the 31st ACM SIGCHI Conference on Human Factors in Computing Systems (CHI '13), Paris, France, April 27 - May 2, 2013."
    },
    "additionalLinks": ["http://displayworkshop.media.mit.edu/"],
    "bibfile": "/pubdb/publications/pub/ruemelin2013chi/ruemelin2013chi.bib",
    "downloads": ["/pubdb/publications/pub/ruemelin2013chi/ruemelin2013chi.pdf"],
    "award": false
}
    */

    if (publication.award) {
        console.log("");
    }

    return RAW_CARD_HTML.format(publication.title.name,
        publication.description ? publication.description.html : "", getAllAuthors(publication),
        publication.downloads ? MEDIEN_IFO_LINK + publication.downloads[0] : '',
        publication.award ? ' myYellowGreen ' : '');
}

function getAllAuthors(publication) {
    var allAuthors = '';
    publication.authors.forEach(function (element) {
        allAuthors += element.name + ', ';
    });
    allAuthors = allAuthors.substr(0, allAuthors.length - 2);
    return allAuthors;
}

function groupByYear(publications) {
    var groupArray = [], index = -1;
    publications.forEach(function (element) {
        if (containsYear(groupArray, element.year)) {
            groupArray[index].pubs.push(element);
        } else {
            index++;
            groupArray.push({ year: element.year, pubs: [element] });
        }
    });
    return groupArray;
}

function containsYear(array, year) {
    var result;
    array.some(function (element) {
        result = element.year == year;
        return result;
    });
    return result;
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function plotBarChart() {
    var publicationGroups = authorPubGroups;

    var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = $('#barChartArea').width() - margin.left - margin.right,
        height = $(window).height() * 0.5 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
    //.ticks(10, "%");

    d3.select('#barChartArea').selectAll('*').remove();

    var svg = d3.select("#barChartArea").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    x.domain(publicationGroups.map(function (d) { return d.year; }));
    var caLength = d3.max(publicationGroups, function (d) { return d.pubs.length; });
    y.domain([0, d3.max(publicationGroups, function (d) { return d.pubs.length; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("# of publications");

    svg.selectAll(".bar")
        .data(publicationGroups)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) { return x(d.year); })
        .attr("width", x.rangeBand())
        .attr("y", function (d) { return y(d.pubs.length); })
        .attr("height", 0)
        .on('click', function (d) {
            var section = $('#yearSection' + d.year);
            section[0].scrollIntoView();
        });

    svg.selectAll('.bar')
      .transition().duration(500)
      .attr("height", function (d) { return height - y(d.pubs.length); });
}

function type(d) {
    d.frequency = +d.frequency;
    return d;
}