/**
 * InfraNodus is a lightweight interface to graph databases.
 *
 * This open source, free software is available under MIT license.
 * It is provided as is, with no guarantees and no liabilities.
 * You are very welcome to reuse this code if you keep this notice.
 *
 * Written by Dmitry Paranyushkin | Nodus Labs and hopefully you also...
 * www.noduslabs.com | info AT noduslabs DOT com
 *
 * In some parts the code from the book "Node.js in Action" is used,
 * (c) 2014 Manning Publications Co.
 *
 */

var Entry = require('../lib/entry')
var express = require('express')
const basicAuth = require('express-basic-auth');
var User = require('../lib/user')

exports.entries = function(req, res, next) {
    basicAuth(User.authenticate)

    // This is for pagination, but not currently used
    var page = req.page

    // Define user
    res.locals.user = req.user

    // Define whose graph is seen (receiver) and who sees the graph (perceiver)
    var receiver = ''
    var perceiver = ''

    // Set that by default the one who sees can only see their own graph, if logged in
    // TODO implement viewing public data of others

    // Is there user in the URL and we know their ID already? Then the receiver will see their graph...
    if (req.params.user && res.locals.viewuser) {
        perceiver = res.locals.viewuser
    }

    // Otherwise they see their own
    else {
        if (res.locals.user) {
            receiver = res.locals.user.uid
            perceiver = res.locals.user.uid
        }
    }

    var contexts = []
    contexts.push(req.params.context)

    Entry.getRange(receiver, perceiver, contexts, function(err, entries) {
        if (err) return next(err)

        if (req.query.textonly) {
            var response = ''
            for (var key in entries) {
                response += entries[key].text + '\r\n\r\n'
            }
            res.format({
                json: function() {
                    res.send(response)
                },
            })
        } else {
            res.format({
                json: function() {
                    res.send(entries)
                },
            })
        }
    })
}

exports.entriesLDA = function(req, res, next) {
    // This is for pagination, but not currently used
    var page = req.page

    // Define user
    res.locals.user = req.user

    // Define whose graph is seen (receiver) and who sees the graph (perceiver)
    var receiver = ''
    var perceiver = ''

    // Is the user logged in? Then he is the receiver but ONLY when he's NOT requesting the public user view (even for himself)
    if (res.locals.user && !req.params.user) {
        receiver = res.locals.user.uid
    }

    // Is there user in the URL and we know their ID already? Then the receiver will see their graph...
    if (req.params.user && res.locals.viewuser) {
        perceiver = res.locals.viewuser
    }

    // Otherwise they see their own
    else {
        if (res.locals.user) {
            perceiver = res.locals.user.uid
        }
    }

    if (req.user) {
        receiver = req.user.uid
    }

    var contexts = []

    contexts.push(req.params.context)

    var LDA_type = req.params.type

    Entry.getLDA(receiver, perceiver, contexts, LDA_type, function(
        err,
        entries
    ) {
        if (err) return next(err)

        res.format({
            json: function() {
                res.send(entries)
            },
        })
    })
}

exports.connectedcontexts = function(req, res, next) {
    //    express.basicAuth(User.authenticate);

    // This is for pagination, but not currently used
    var page = req.page

    // Define user
    res.locals.user = req.user

    console.log('Query for UserConnectedContexts')

    // Define whose graph is seen (receiver) and who sees the graph (perceiver)
    var receiver = ''
    var perceiver = ''

    // Is the user logged in? Then he is the receiver but ONLY when he's NOT requesting the public user view (even for himself)
    if (res.locals.user && !req.params.user) {
        receiver = res.locals.user.uid
    }

    // Is there user in the URL and we know their ID already? Then the receiver will see their graph...
    if (req.params.user && res.locals.viewuser) {
        perceiver = res.locals.viewuser
    }

    // Otherwise they see their own
    else {
        if (res.locals.user) {
            perceiver = res.locals.user.uid
        }
    }

    if (req.user) {
        receiver = req.user.uid
    }
    var keywords = []

    keywords.push(req.query)

    Entry.getConnectedContexts(receiver, perceiver, keywords, function(
        err,
        contexts
    ) {
        if (err) return next(err)

        res.format({
            json: function() {
                res.send(contexts)
            },
        })
    })
}

exports.connectedcontextsoutside = function(req, res, next) {
    // This is for pagination, but not currently used
    var page = req.page

    console.log('Query for AllConnectedContexts')
    console.log(req.query)

    // Define whose graph is seen (receiver) and who sees the graph (perceiver)
    var receiver = ''
    var perceiver = ''

    res.locals.user = req.user

    // Set that by default the one who sees can only see their own graph, if logged in
    // TODO implement viewing public data of others

    // Is the user logged in? Then he is the receiver but ONLY when he's NOT requesting the public user view (even for himself)
    if (res.locals.user && !req.params.user) {
        receiver = res.locals.user.uid
    }

    // Is there user in the URL and we know their ID already? Then the receiver will see their graph...
    if (req.params.user && res.locals.viewuser) {
        perceiver = res.locals.viewuser
    }

    // Otherwise they see their own
    else {
        if (res.locals.user) {
            perceiver = res.locals.user.uid
        }
    }

    var keywords = []

    keywords.push(req.query)

    Entry.getConnectedContextsOut(receiver, perceiver, keywords, function(
        err,
        contexts
    ) {
        if (err) return next(err)

        res.format({
            json: function() {
                res.send(contexts)
            },
        })
    })
}

exports.nodes = function(req, res, next) {
    var page = req.page

    var contexts = []

    var showcontexts = ''

    // The one who sees the statements (hello Tengo @1Q84 #Murakami)
    var receiver = ''
    // The one who made the statements (hello Fuka-Eri @1Q84 #Murakami)
    var perceiver = ''

    // TODO think of how this is bypassed when API is functional
    // Give this user a variable
    res.locals.user = req.user

    // Do we want to see graphs that include "near" 4-word gap scan?

    if (res.locals.user) {
        var fullview = res.locals.user.fullview
        if (fullview != 1) {
            fullview = null
        }
    } else {
        fullview = 1
    }

    // Let's define the contexts from URL if exist
    contexts.push(req.params.context)

    // And is there one to compare with also?
    if (req.query.addcontext) contexts.push(req.query.addcontext)

    // Is the user logged in? Then he is the receiver but ONLY when he's NOT requesting the public user view (even for himself)
    if (res.locals.user && !req.params.user) {
        receiver = res.locals.user.uid
    }

    // Is there user in the URL and we know their ID already? Then the receiver will see their graph...
    if (req.params.user && res.locals.viewuser) {
        perceiver = res.locals.viewuser
    }

    // Otherwise they see their own
    else {
        if (res.locals.user) {
            perceiver = res.locals.user.uid
        }
    }

    // Shall we modify the Nodes query, so we can see the contexts?

    if (req.query.showcontexts) {
        showcontexts = req.query.showcontexts
    }

    Entry.getNodes(
        receiver,
        perceiver,
        contexts,
        fullview,
        showcontexts,
        res,
        req,
        function(err, graph) {
            if (err) return next(err)

            // Change the result we obtained into a nice json we need

            if (req.query.gexf) {
                res.render('entries/nodes', { graph: graph })
            } else if (req.query.csv) {
                res.render('entries/csv', { graph: graph })
            } else if (req.query.csvmatrix) {
                res.render('entries/csvmatrix', { graph: graph })
            } else if (req.query.csvdata) {
                res.render('entries/csvdata', { graph: graph })
            } else {
                res.format({
                    json: function() {
                        res.send(graph)
                    },
                })
            }
        }
    )
}
