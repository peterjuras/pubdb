/* Initialize
-----------------------------------------------------------*/
var express = require('express');
var app = express()


/* Includes
-----------------------------------------------------------*/
var authors = require('././authors_with_ids'); /* #TODO Pfad */

app.get('/authors', function(req, res) {
	for (var i = 0; i < authors.length; i++) {
		authors[i].id = i;
	};
	res.send(authors);
})

app.get('/', function (req, res) {
	// initialize links
	var links = new Array();

	// find intersections in author-publications to get links
	// 1. loop through all authors
	for (var authorsOuterIterator = 0; authorsOuterIterator <= authors.length; authorsOuterIterator++) {
		var authorOne = authors[authorsOuterIterator];
		// 2. check for shared publications with all authors following in the array
		for (var authorsInnerIterator = authorsOuterIterator+1; authorsInnerIterator < authors.length; authorsInnerIterator++) {

			var authorTwo = authors[authorsInnerIterator];
			// 3. find intersection between the authors' publications

			// for each publication in publications[authorsOuterIterator]
			for (var i = 0; i < authorOne.publications.length; i++) {
				var publicationOne = authorOne.publications[i];
				// loop through second_author.publications[authorsInnerIterator]
				for (var j = 0; j < authorTwo.publications.length; j++) {
					var publicationTwo = authorTwo.publications[j];

					// if match
					if (publicationOne === publicationTwo) {
						// increment linkCounter
						if ( 
							(links.length == 0) 
							|| ( 
								!( 
									(links[links.length - 1].a === authorOne.id) && (links[links.length - 1].b === authorTwo.id) 
								) 
							)
							) {
							links.push({"a": authorOne.id, "b": authorTwo.id, "count": 1})
						} else {
							links[links.length - 1].count++;
						}

						// remove publication from second_author.publications
						authorTwo.publications.splice(j, 1);
						if (authorTwo.publications.length == 0)
							authors.splice(authorsInnerIterator, 1)


						// break;
					}
				};
				
			}
			
		}

	}
	res.send(links);
});


/* Server
-----------------------------------------------------------*/
var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('app listening at http://%s:%s', host, port)
})