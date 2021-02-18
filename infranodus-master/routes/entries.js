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
var FlowdockText = require('flowdock-text')
var validate = require('../lib/middleware/validate')
var options = require('../options')
var async = require('async')

var neo4jnew = require('neo4j-driver').v1

var uuid = require('node-uuid')

exports.list = function(req, res, next) {
    // The one who sees the statements (hello Tengo @1Q84 #Murakami)
    var receiver = ''

    // The one who made the statements (hello Fuka-Eri @1Q84 #Murakami)
    var perceiver = ''

    var receivername = null

    var perceivername = null

    var contextpublic = null

    var contextslist = []

    // We checked the context using validate.getContextPrivacy() function and got the variable for it
    if (res.locals.contextpublic) {
        contextpublic = res.locals.contextpublic
    }

    // Did we get a list of all the contexts for this user / entries list?
    if (res.locals.contextslist) {
        contextslist = res.locals.contextslist
        //  console.log(contextslist);
    }

    // If the user is logged in then we know the ID and the name of the user who is viewing
    if (res.locals.user) {
        if (!res.locals.user.publicview) {
            receiver = res.locals.user.uid
        }
        receivername = res.locals.user.name
    }

    // Is there user name in the requested URL AND we know their ID already? Then the entries of that user will be shown
    if (req.params.user && res.locals.viewuser) {
        perceiver = res.locals.viewuser
        perceivername = req.params.user
    }

    console.log('Receiver / Perceiver')
    console.log(receiver)
    console.log(perceiver)
    // Let's see what context the user wants to view if there is one

    var contexts = []
    contexts.push(req.params.context)

    // Do we want to compare it with another ?addcontext=... ?

    if (req.query.addcontext) contexts.push(req.query.addcontext)

    // Now let's arrange what users we want to see and what information

    Entry.getRange(receiver, perceiver, contexts, function(err, entries) {
        if (err) return next(err)

        // Add links to @contexts and #hashtags
        for (var i = 0; i < entries.length; ++i) {
            //entries[i].text = FlowdockText.autoLinkMentions(entries[i].text,{hashtagUrlBase:"/contexts/",hashtagClass:"app-context-link"});
            //entries[i].text = FlowdockText.autoLinkHashtags(entries[i].text,{hashtagUrlBase:"/concepts/",hashtagClass:"app-concept-link"});
            entries[i].text = validate.safe_tags(entries[i].text)
            entries[i].text = FlowdockText.autoLinkUrlsCustom(entries[i].text, {
                class: 'app-url-link',
                target: '_blank',
            })
        }

        console.log('Showing statements to user ' + receiver)
        console.log('Statements made by ' + perceiver)

        for (var s = 0; s < contexts.length; ++s) {
            if (
                contexts[s] == 'undefined' ||
                typeof contexts[s] === 'undefined'
            ) {
                contexts[s] = ''
            }
        }

        res.render('entries', {
            title:
                'InfraNodus.Com — Text Network Visualization and Discourse Analysis',
            entries: entries,
            context: contexts[0],
            addcontext: req.query.addcontext,
            perceivername: perceivername,
            receivername: receivername,
            contextpublic: contextpublic,
            contextlist: contextslist,
            showcontexts: req.query.showcontexts,
            onlygraph: req.query.onlygraph,
            maxnodes: req.query.maxnodes,
            url: req.query.url,
            urltitle: req.query.urltitle,
            speech: req.query.speech,
            midi: req.query.midi,
            walkthrough: req.query.walkthrough,
        })
    })
}

exports.form = function(req, res) {
    res.render('post', { title: 'Post' })
}

exports.submit = function(req, res, next) {
    // Retrieve the context where user was in when submitting the statement
    var default_context = req.body.context

    // Pass on the context IDs from the DB
    var contextids = req.contextids

    

    // Some parameter settings
    var max_length = options.settings.max_text_length
    var max_total_length = options.settings.max_total_text_length
    var max_file_length = options.settings.max_file_length
    var min_length = options.settings.min_text_length
    var maxhash = options.settings.max_hashtags

    var currenttextlength = 0

    // Generate new timestamp and multiply it by 10000 to be able to track the sequence the nodes were created in
    var timestamp = new Date().getTime() * 10000

    if (req.body.timestamp) {
        timestamp = parseInt(req.body.timestamp)
    }

    var splitStatements = []
    var fullstatement = ''
    var goodStatements = []
    var prepStatements = []

    // Retrieve the statement
    // Is the body of the statement an Array (usually sent from import)
    if (req.multiple) {
        for (var key in req.body.entry.body) {
            if (req.body.entry.body.hasOwnProperty(key)) {
                splitStatements.push(
                    req.body.entry.body[key].substr(0, max_length)
                )
                // Let's count how many symbols the whole set has
                currenttextlength += req.body.entry.body[key].substr(
                    0,
                    max_length
                ).length
            }
        }
    }
    // Not an array?
    else {
        // What's the text submitted?
        fullstatement = req.body.entry.body
        // How long is the text?
        currenttextlength = fullstatement.length
        // Split statements into the shorter ones
        splitStatements = validate.splitStatement(fullstatement, max_length)
    }

    var totalcount = splitStatements.length

    // TODO move to settings
    var maxtransactions = 1

    var requestiterations = 0

    var cypherQueries = []

    var neo4jtimes = 0

    var entryName = ''

    var neo4jdriver = neo4jnew.driver(
        options.neo4jhost,
        neo4jnew.auth.basic(options.neo4juser, options.neo4jpass)
    )

    // A series of checks before the statement is submitted
    async.waterfall(
        [
            function(callback) {
                // Perform async Waterfall for as many times as there are statements
                if (currenttextlength > max_file_length) {
                    callback(
                        'The text you entered was more than ' +
                            max_file_length +
                            ' characters, please, cut it or contact us to process it.'
                    )
                } else {
                    if (splitStatements.length > 0) {
                        for (var k = 0; k < splitStatements.length; k++) {
                            if (!splitStatements[k] && currenttextlength == 0) {
                                callback('Please, enter a statement')
                            } else if (
                                splitStatements[k].length <= min_length &&
                                currenttextlength <= min_length
                            ) {
                                callback(
                                    'A statement must have more than ' +
                                        min_length +
                                        ' characters'
                                )
                            } else if (splitStatements[k].length > max_length) {
                                callback(
                                    'Try to make it less than ' +
                                        max_length +
                                        ' characters, please...'
                                )
                            } else {
                                splitStatements[k] = validate.sanitize(
                                    splitStatements[k]
                                )
                                goodStatements.push(splitStatements[k])
                            }
                        }

                        if (goodStatements.length > 0) {
                            callback(null, goodStatements)
                        }
                    } else {
                        callback(
                            'Please, enter a longer text to visualize it as a graph...'
                        )
                    }
                }
            },
            function(goodStatements, callback) {
                var error

                for (var s = 0; s < goodStatements.length; s++) {
                    var hashtags = validate.getHashtags(goodStatements[s], res)

                    if (req.onlymentions) {
                        hashtags = ''
                    }

                    var mentions = validate.getMentions(goodStatements[s])

                    if (req.excludementions) {
                        mentions = ''
                    }

                    if (!hashtags && mentions.length < 1) {
                        error =
                            'There should be at least one word, #hashtag or @mention.'
                    } else {
                        var statementName = ''
                        var newtimestamp = timestamp + s * 2
                        var st_uid = uuid.v1()

                                           
                        if (hashtags) {
                            if (hashtags.length >= maxhash) {
                                error =
                                    'Please, try to use less than ' +
                                    maxhash +
                                    ' #hashtags'
                            } else {
                                for (var i = 0; i < hashtags.length; i++) {
                                    statementName += '#' + hashtags[i] + ' '
                                }
                                for (var i = 0; i < mentions.length; i++) {
                                    statementName += '@' + mentions[i] + ' '
                                }
                                prepStatements.push({
                                    text: goodStatements[s],
                                    concepts: hashtags,
                                    mentions: mentions,
                                    timestamp: newtimestamp,
                                    name: statementName,
                                    uid: st_uid,
                                })
                                entryName = statementName

                                
                            }
                        } else {
                            for (var i = 0; i < mentions.length; i++) {
                                statementName += '@' + mentions[i] + ' '
                            }
                            prepStatements.push({
                                text: goodStatements[s],
                                concepts: hashtags,
                                mentions: mentions,
                                timestamp: newtimestamp,
                                name: statementName,
                                uid: st_uid,
                            })
                        }
                    }
                }

                // Successfully executed the above?

                if (prepStatements.length > 0) {
                    callback(null, prepStatements)
                } else {
                    callback(error)
                }
            },
            function(prepStatements, callback) {
                // Put all the contexts that came with the statement into a new variable

                var contexts = []

                if (contextids.length > 0) {
                    for (var i = 0; i < contextids.length; i++) {
                        contexts.push(contextids[i])
                    }
                    callback(null, prepStatements, contexts)
                } else {
                    callback('Please, select a context for this statement')
                }
            },
            function(prepStatements, contexts, callback) {
                // Then we ascribe the data that the Entry object needs in order to survive
                // We create various fields and values for that object and initialize it

                // Create a new entry object, so we can perform actions on it

                let submitStatements = [];
                let total_st_length = 0;

                for (var st = 0; st < prepStatements.length; st++) {
                    submitStatements.push(prepStatements[st]);
                    total_st_length += prepStatements[st].text.length;
                    if (total_st_length > max_total_length) {
                        submitEntry();
                        submitStatements = [];
                        total_st_length = 0;
                    }
                    
                }
                if (total_st_length > 0 && total_st_length <= max_total_length) {
                    submitEntry();
                }

                function submitEntry() {

                      var entry = new Entry({
                        by_uid: res.locals.user.uid,
                        by_id: res.locals.user.uid,
                        by_name: res.locals.user.name,
                        contexts: contexts,
                        statements: prepStatements,
                        fullscan: res.locals.user.fullscan,
                        addmentions: res.locals.user.mentions,
                    })
    
                    callback(null, entry, prepStatements)
                }
               
            },
        ],
        function(err, entry, prepStatements) {
            if (err) {
                console.log('errordetected')
                console.log(err)

                if (!req.internal) {
                    res.send({ errormsg: err })
                    // res.redirect('back');
                } else {
                    res.send({ errormsg: err })
                    // res.redirect('back');
                }
            } else {
                entry.savetrans(function(cypherQuery) {
                    var firstanswer = {
                        data: [],
                    }
                    var jsonfirstanswer = ''

                    var session = neo4jdriver.session()
                    session
                        .run(cypherQuery.query, cypherQuery.params)
                        .then(function(result) {
                            result.records.forEach(function(record) {
                                // Change that so we can add multiple statements at once without reloading the page
                                firstanswer.data = record.get('s.uid')
                                jsonfirstanswer = JSON.stringify(firstanswer)
                            })
                            session.close()

                            if (req.remoteUser) {
                                res.json({ message: 'Entry added.' })
                            } else if (req.internal) {
                                // next();

                                // This was some import or multiple statements add feature and we just reload the page with results
                                neo4jdriver.close();

                                // This is a bit of a workaround, it shows a newly added graph on top of the previous one highlighting the difference
                                // Happens in case of Google search for example
                                if (default_context.indexOf('add_') == 0) {
                                    let redirect_url = res.locals.user.name +
                                                        '/' +
                                                        default_context.substring(4) +
                                                        '/edit' + 
                                                        '?addcontext=' + 
                                                        default_context + 
                                                        '&highlight=0';

                                    if (req.walkthrough) {
                                        redirect_url += '&walkthrough=' + req.walkthrough;
                                        // This is for the case where we have Walkthrough SEO defined
                                        if (req.walkthrough == 'seo') {
                                            redirect_url = res.locals.user.name +
                                            '/' +
                                            default_context +
                                            '/edit' + 
                                            '?addcontext=' + 
                                            default_context.substring(4) + 
                                            '&highlight=0&missing=1' + 
                                            '&walkthrough=' + req.walkthrough;
                                        }
                                    }

                                    res.redirect(redirect_url);
                                }
                                
                                else if (req.excludestopwords) {
                                    res.redirect(
                                        res.locals.user.name +
                                            '/' +
                                            default_context +
                                            '/edit?stopwords=' + 
                                            req.excludestopwords.join('+')
                                    )
                                }    
                                else {
                                    res.redirect(
                                        res.locals.user.name +
                                            '/' +
                                            default_context +
                                            '/edit'
                                    )
                                }
                            } else {
                                // Here is where the file import goes

                                // Here we deleted a statement or edited it, or deleted the whole context
                                if (
                                    req.body.delete == 'delete' ||
                                    req.body.btnSubmit == 'edit' ||
                                    req.body.delete == 'delete context'
                                ) {
                                    if (
                                        default_context == 'undefined' ||
                                        typeof default_context ===
                                            'undefined' ||
                                        default_context == ''
                                    ) {
                                        res.redirect(
                                            '/' + res.locals.user.name + '/edit'
                                        )
                                    }
                                  
                                
                                    else {
                                        res.redirect(
                                            res.locals.user.name +
                                                '/' +
                                                default_context +
                                                '/edit'
                                        )
                                    }
                                } else {
                                    // The statement fit within our maxlength limits and is only one

                                    // TODO eventually could be several statements
                                    if (splitStatements.length == 1) {
                                        var receiver = res.locals.user.uid
                                        var perceiver = res.locals.user.uid
                                        var showcontexts =
                                            req.query.showcontexts
                                        var fullview = res.locals.user.fullview
                                        var contexts = []
                                        contexts.push(default_context)
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
                                                // TODO eventually could be several statements sent this way so no need to reload the graph
                                                neo4jdriver.close()
                                                res.send({
                                                    entryuid: jsonfirstanswer,
                                                    entryname: entryName,
                                                    entrytext:
                                                        splitStatements[0],
                                                    graph: graph,
                                                })
                                                
                                            }
                                        )
                                    }

                                    // The statement consists of several statements and we completed all the iterations.
                                    else {
                                        console.log('reached the end')
                                        neo4jdriver.close()
                                        res.send({
                                            entryuid: 'multiple',
                                            entrycontent: fullstatement,
                                            successmsg:
                                                'Please, reload this page after a few seconds to see the full graph.',
                                        })
                                    }
                                }
                            }
                        })
                        .catch(function(error) {
                            if (req.internal) {
                                // TODO Error treatment?
                            } else {
                                return next(error)
                            }
                            console.log(error)
                        })
                    // End of FOR cycle

                    // End of KEEP THIS BELOW TRANSACTION QUERY IF condition
                    // }

                    // savetrans ends here
                })
            }
            // end of Waterfall is below
        }
    )
}
