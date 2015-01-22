/* Initialization
--------------------------------------------------------------------------------*/
/* initialize min / max values */
minPublications = 99999;
maxPublications = 0;

minYears = 2100;
maxYears = 1900;

nodes_current = [];
links_current = [];

/* Force Directed Graph */
var svg = d3.select("#visualization");
svg
	.attr("width", window.innerWidth)
	.attr("height", window.innerHeight);
var node = svg.selectAll(".node");
var link = svg.selectAll(".link");
var color = d3.scale.category20();

force = d3.layout.force()
	.charge(function (d, i) { return -d.numberOfPublications * 15 })
	// .charge(-30)
	.chargeDistance(300)
	.linkDistance(150)
	.friction(0.7)
	.size([0.9 * parseInt(svg.attr("width") - 200), 0.9 * parseInt(svg.attr("height"))]);

/* Load graph data via AJAX */
d3.json("data/graph.json", function (error, graph) {
    nodes_all = graph.nodes;
    links_all = graph.links;


    /* Refine data structure
        --------------------------------------------------------------------------------*/
    /* Load publications via AJAX */
    d3.json("data/publications.json", function (error, publications) {
        /* sort publications */
        // publications.sort(function (a, b) {
        //     return parseInt(b.year) - parseInt(a.year);
        // });

        /* for each author enter all publication data into graph JS object */
        nodes_all.forEach(function (author) {
            /* update every publication */
            var i = 0;
            author.publications.forEach(function (publication_id) {
                publications.some(function (pub) {
                    if (pub.id.indexOf(publication_id) != -1) {
                        author.publications[i] = pub;
                    }
                });
                i++;
            });
        })

        /* for each author inject publications by year [year: XX, pubs: [Publication]] */
        nodes_all.forEach(function (author) {
            author.publicationsByYear = groupByYear(author.publications);

            /* sort by years descending */
            author.publicationsByYear = author.publicationsByYear.sort(function (a, b) {
                return parseInt(b.year) - parseInt(a.year);
            });
        });

        nodes_current = nodes_all;
        links_current = links_all;

        /* D3 visual
		--------------------------------------------------------------------------------*/
        /* create logarithmic scale for text */
        for (var i = 0; i < nodes_all.length; i++) {
            var length = nodes_all[i]["publications"].length
            minPublications = (length < minPublications) ? length : minPublications;
            maxPublications = (length > maxPublications) ? length : maxPublications;
        }
        circleSizeScale = d3.scale.sqrt()
            .domain([minPublications, maxPublications])
            .range([3, 60]);

        publicationsRange = [minPublications, maxPublications];
        yearsRange = [minYears, maxYears];

        force
            .nodes(nodes_current)
            .links(links_current)
            .charge(0)
            .chargeDistance(0)
            .start();

        updateGraph();

        force.on("tick", function () {
            var q = d3.geom.quadtree(nodes_current),
                    i = 0,
                    n = nodes_current.length;

            while (++i < n) q.visit(collide(nodes_current[i]));

            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });


            //svg.selectAll('circle')
            //.attr("cx", function (d) { return d.x; })
            //.attr("cy", function (d) { return d.y; });

            node
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
                .style("visibility", function(d) {return d.name.indexOf("HASH") != -1 ? "hidden" : "visible";
                });

            //node.attr("transform", function (d) { return "translate(0px,0px)"; });
        });

        //force.start();



        node.on('click', function (d) {
            if (d3.event.defaultPrevented) return; // prevent opening link after drag-release
            window.open("../authordetail/authordetail.html?id=" + d.id, "_self")
        })




        /* Filter UI (jQuery UI)
        --------------------------------------------------------------------------------*/

        $(function () {
            $("#publications-range").slider({
                range: true,
                min: minPublications,
                max: maxPublications,
                values: [minPublications, maxPublications],
                slide: function (event, ui) {
                    publicationsRange = ui.values;
                    updateGraph();
                    $('#min-publications').text(ui.values[0]);
                    $('#max-publications').text(ui.values[1]);
                }
            });
            // Initialize Min & Max Label Values
            $('#min-publications').text(minPublications);
            $('#max-publications').text(maxPublications);

            $("#years-range").slider({
                range: true,
                min: minYears,
                max: maxYears,
                values: [minYears, maxYears],
                slide: function (event, ui) {
                    yearsRange = ui.values;
                    updateGraph();
                    // WIP
                    $('#min-years').text(ui.values[0]);
                    $('#max-years').text(ui.values[1]);
                }
            });
            // Initialize Min & Max Label Values
            $('#min-years').text(minYears);
            $('#max-years').text(maxYears);
        });
    })




});

function collide(node) {
    var r = circleSizeScale(node["publications"].length) + 200,// node.radius + 16,
    //var r = node.childNodes[0].r.baseVal.value + 250,// node.radius + 16,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return function (quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
            var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = circleSizeScale(node["publications"].length) + circleSizeScale(quad.point["publications"].length); //node.radius + quad.point.radius;

            if (l < r) {
                l = (l - r) / l * .5;
                node.x -= x *= l;
                node.y -= y *= l;
                quad.point.x += x;
                quad.point.y += y;
            }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
}

/* Filtering
--------------------------------------------------------------------------------*/

function updateGraph() {
    /* update data */
    // var nodes_filtered = filterAuthors.byNumberOfPublications(nodes, 100, 100000);
    nodes_current = filterAuthors.byNumberOfPublicationsBetweenYears(nodes_all, publicationsRange[0], publicationsRange[1], yearsRange[0], yearsRange[1]);
    links_current = filterLinks.byPublications(links_all, nodes_current);


    /* Update links */

    link = link.data(links_current, function (d) { return d.source.id + "-" + d.target.id });

    link.exit().remove();
    // link.remove();
    // link.append("line")
    //    	.attr("class", "link")
    //    	.style("stroke-width", function(d) { return d.count; })

    link.enter().append("line")
    	.attr("class", "link")
    	.style("stroke-width", function (d) { return d.count; })

    /* Update nodes */

    node = node.data(nodes_current, function (d) { return String(d.id); });

    node.select("circle")
	    .attr("r", function (d) {
	        var numberOfPublications = 0;
	        d.publicationsByYear.forEach(function (element) {
	            numberOfPublications += element.pubs.length;
	        })
	        return circleSizeScale(d.numberOfPublications);
	    })
	    .style("fill", function(d) { return color(Math.floor(Math.random() * (20 - 1 + 1)) + 1); });

    node.exit().remove();

    var g = node.enter()
		.append("g")
		.call(force.drag);

    g.append("circle")
		.attr("r", function (d) {
		    var numberOfPublications = 0;
		    d.publicationsByYear.forEach(function (element) {
		        numberOfPublications += element.pubs.length;
		    });
		    return circleSizeScale(d.numberOfPublications);
		})
		.style("fill", function(d) { return color(Math.floor(Math.random() * (20 - 1 + 1)) + 1); });

    g.append("text")
		.attr("dx", 12)
		.attr("dy", ".35em")
		.text(function (d) { return d.name });

    force.start();
}

var filterAuthors = {
    byNumberOfPublications: function (authors, threshold_min, threshold_max) {
        return authors.filter(function (node) {
            return (node.publications.length >= threshold_min) && (node.publications.length <= threshold_max)
        })
    },
    byNumberOfPublicationsBetweenYears: function (authors, amount_min, amount_max, year_min, year_max) {
        // return authors.filter(function(author) {
        // 	var i = 0;
        // 	var numberOfPublications = 0;
        // 	/* publicationsByYear is ordered by year DESC */
        // 	while ((i < author.publicationsByYear.length) && (parseInt(author.publicationsByYear[i].year) >= year_min)) {
        // 		if (parseInt(author.publicationsByYear[i].year) <= year_max)
        // 			numberOfPublications += author.publicationsByYear[i].pubs.length;
        // 		i++;
        // 	}
        // 	return (numberOfPublications >= amount_min) && (numberOfPublications <= amount_max)
        // })

        var newAuthors = [];
        authors.forEach(function (author) {
            var i = 0;
            var numberOfPublications = 0;

            /* publicationsByYear is ordered by year DESC */
            while ((i < author.publicationsByYear.length) && (parseInt(author.publicationsByYear[i].year) >= year_min)) {
                if (parseInt(author.publicationsByYear[i].year) <= year_max) {
                    numberOfPublications += author.publicationsByYear[i].pubs.length;
                }
                i++;
            }
            author.numberOfPublications = numberOfPublications;
            if ((numberOfPublications >= amount_min) && (numberOfPublications <= amount_max)) {
                newAuthors.push(author);
            }
        })
        return newAuthors;
    }
}

var filterLinks = {
    byPublications: function (links, publications) {
        return links.filter(function (link) {
            return ((publications.indexOf(link.source) > -1) && (publications.indexOf(link.target) > -1));
        })
    }
}

/* Helper functions
--------------------------------------------------------------------------------*/
function groupByYear(publications) {
    var groupArray = [], index = -1;
    publications.forEach(function (element) {
        if (parseInt(element.year) < minYears)
            minYears = parseInt(element.year);
        if (parseInt(element.year) > maxYears)
            maxYears = parseInt(element.year);
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
