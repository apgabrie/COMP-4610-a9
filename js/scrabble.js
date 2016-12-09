/*
 * Andrew Gabriel, andrew_gabriel@student.uml.edu
 * COMP 4610 - 201, Assignment 9
 * This file contains the javascript for the Scrabble aspect of Assignment 9.
 */


$(document).ready(function(){
    $('#message').hide();
    
    var i;
    var j;
    var k;
    
    /* ****** Set up dictionary ****** */
    // The following dictionary code is from 
    // http://ejohn.org/blog/dictionary-lookups-in-javascript/
    
    var dict = {};

    // Fill dictionary object
    $.ajax({
        url: 'data/dictionary.txt',
        dataType: 'text',
        success: function(txt) {
            var words = txt.split('\n');
            for (i=0; i<words.length; i++) {
                dict[words[i]] = true;
            }
        }
    });
    
    /* ****** Set up the Scrabble board ****** */
    
    // Load JSON file for tile distribution and value
    // This JSON file was provided by Ramon Meza
    $.getJSON("data/pieces.json", function(data) {
        var piecesCopy = data;
        var myPieces = data;
        
        // Letter Array (This is used for word look up)
        var letterArray = [];
        
        for (i=0; i<15; i++) {
            letterArray[i] = [];
            for (j=0; j<15; j++) {
                letterArray[i][j] = '*';
            }
        }
        
        // Create Scrabble board
        $.getJSON("data/scrabbleBoard.json", function(data) {
            responseObject = data;
            
            // Use JSON file to set classes
            for (i=0; i<15; i++) {
                var $newRow = $('<tr></tr>');
                $('#scrabbleTable').append($newRow);
                for (j=0; j<15; j++) {
                    var $newCell = $('<td></td>');
                    $newCell.addClass(responseObject.boardSpaces[i].x[j].spaceName);
                    
                    $newCell.css('width', '10px');
                    
                    if (responseObject.boardSpaces[i].x[j].spaceName === 'tripleWordScore') {
                        $newCell.append($('<div></div>').text('TRIPLE WORD SCORE'));
                    } else if (responseObject.boardSpaces[i].x[j].spaceName === 'doubleLetterScore') {
                        $newCell.append($('<div></div>').text('DOUBLE LETTER SCORE'));
                    } else if (responseObject.boardSpaces[i].x[j].spaceName === 'doubleWordScore') {
                        $newCell.append($('<div></div>').text('DOUBLE WORD SCORE'));
                    } else if (responseObject.boardSpaces[i].x[j].spaceName === 'tripleLetterScore') {
                        $newCell.append($('<div></div>').text('TRIPLE LETTER SCORE'));
                    }
                    
                    if (responseObject.boardSpaces[i].x[j].spaceName === 'startSpace') {
                        $newCell.addClass('valid horizontal vertical');
                    }
                    
                    $newRow.append($newCell);
                }
            }
            
            // Make cells in the Scrabble board drop targets
            $('td').droppable({
                accept: function(ui) {
                    return $(this).hasClass('valid');
                },
                drop: function(event, ui) {
                    var curSpace = $(this);
                    var curTile = ui.draggable;
                    
                    $(this).addClass('occupied playerTileOccupied');
                    ui.draggable.addClass('placedOnTable');
                    
                    var $pos = $(this).offset();
                    ui.draggable.animate({
                        left: $pos.left,
                        top: $pos.top
                    }, 250, function() {
                        var tileId = curTile.css('background-image');
                        letterArray[curSpace.parent().index()][curSpace.index()] = tileId.charAt(tileId.length-7);
                        
                        validateSpaces(curSpace);
                    });
                }
            });
        });
    
        
        /* ****** Set up the player tiles ****** */
    
        // Initialize player tiles
        
        returnTiles(0); // Puts tiles on the rack
        
        // Make player tiles draggable
        $('.playerTile').draggable({
            start: function(event,ui) {
                $(this).removeClass('placedOnTable');
                
                // make sure that the dragged tile is rendered above the other tiles
                var $playerTiles = $('.playerTile');
                var tileId = $(this).attr('id');
                var selectedTileNum = parseInt(tileId.substring(tileId.length - 1, tileId.length));
                
                for (i=0; i<8; i++) {
                    if (i === selectedTileNum - 1) {
                        $(this).css('z-index', 1);
                    } else {
                        $playerTiles.eq(i).css('z-index', 0);
                    }
                }
                $('.ui-draggable-disabled').css('z-index', 0);
            },
            stop: function(event, ui) {
                if ($(this).hasClass('placedOnTable')) {
                    $(this).draggable('disable');
                } else {
                    // if the tile wasn't placed on the table, put it back on the rack
                    var id = $(this).attr('id');
                    var index = parseInt(id.substring(id.length - 1, id.length));
                    
                    returnTiles(500, $(this));
                }
            }
        });

        // Assign letters to player tiles
        $('.playerTile').each(function() {
            // Random letter
            var newPiece = dealTile(myPieces);
            
            if (newPiece !== 'ERROR') {
                $(this).css('background-image', ['url(image/ScrabbleLetters/Scrabble', newPiece, '.png)'].join(''));
            } else {
                $(this).hide();
                $(this).draggable('disable');
            }
            
            myPieces = updatePieces(myPieces, newPiece, -1);
            displayPieces(myPieces);
        });
        
        /* ****** Return Tiles Button ****** */
        $('#returnTilesButton').click(function() {
            
            $('#message').hide();
            
            // Return tiles
            $('.playerTile').each(function() {
                if (!$(this).hasClass('empty')) {
                    $(this).draggable('enable');
                }
                
                var id = $(this).attr('id');
                var index = parseInt(id.substring(id.length - 1, id.length));
                }
            );
            
            returnTiles(700);
            
            // Rectify Scrabble board
            $('.placedOnTable').removeClass('placedOnTable');
            $('.playerTileOccupied').each(function() {
                $(this).removeClass('occupied playerTileOccupied');
                
                // remove letters from letter array
                letterArray[$(this).parent().index()][$(this).index()] = '*';
            });
            validateSpaces();
        });
        
        /* ****** New Hand Button ****** */
        $('#newHandButton').click(function(){
            $('.playerTile:not(.placedOnTable)').each(function() {
                var newPiece = dealTile(myPieces);
                var tileId = $(this).css('background-image');
                var oldPiece = tileId.charAt(tileId.length-7);
                
                if (newPiece !== 'ERROR') {
                    $(this).css('background-image', ['url(image/ScrabbleLetters/Scrabble', newPiece, '.png)'].join(''));
                } else {
                    $(this).hide();
                    $(this).draggable('disable');
                }
                
                myPieces = updatePieces(myPieces, oldPiece, 1);
                myPieces = updatePieces(myPieces, newPiece, -1);
                displayPieces(myPieces);
            });
        });
        
        /* ****** End Turn Button ****** */
        $('#endTurnButton').click(function() {
            // If no word has been played, return
            if ($('.playerTileOccupied').length === 0) {
                $('#message').each(function() {
                    $(this).show();
                    $(this).removeClass('errorMessage').addClass('validMessage');
                    $(this).text('Please place at least one tile.');
                });
                return false;
            }
            
            /* Check words */
            var newWords = [];
            
            /* *** Check a single letter *** */
            if ($('.occupied').length === 1) {
                var theNewWord = letterArray[7][7];
                if (dict[theNewWord.toLowerCase()] !== true) {
                    // Incorrect word found so stop trying to validate
                    $('#message').each(function() {
                        $(this).show();
                        $(this).removeClass('validMessage').addClass('errorMessage');
                        $(this).text(['Sorry, I don\'t think \"', theNewWord, 
                                                 '\" is a word. Please click Return Tiles and try again.'].join(''));
                    });
                    return false;
                } else {
                    // Word is valid
                    $('#message').each(function() {
                        $(this).show();
                        $(this).removeClass('errorMessage').addClass('validMessage');
                        $(this).text(['Yes ', theNewWord, ' is a word!'].join(''));
                    });
                    
                    $('#scoreAmount').text(2);
                }
            } else {
                /* *** Check words in rows *** */
                for (i=0; i<15; i++) {
                    var temp = [];
                    var isNewWord = false;
                    var runningScore = 0;
                    var multiplier = 1;
                    for (j=0; j<=15; j++) {
                        var $curTile = $(['#scrabbleTable>tr:nth-child(', i+1, ')>td:nth-child(', j+1, ')'].join(''));
                        
                        if ($curTile.hasClass('playerTileOccupied')) {
                            isNewWord = true;
                        }
                        
                        // End of word detected
                        if (j === 15 || letterArray[i][j] === '*') {
                            var theNewWord = temp.join('');
                            if (theNewWord.length > 1 && isNewWord === true) {
                                theNewWord = correctBlanks(myPieces, theNewWord, dict);
                                
                                // Validate word
                                if (dict[theNewWord.toLowerCase()] !== true) {
                                    // Incorrect word found so stop trying to validate
                                    $('#message').each(function() {
                                        $(this).show();
                                        $(this).removeClass('validMessage').addClass('errorMessage');
                                        $(this).text(['Sorry, I don\'t think \"', theNewWord, 
                                                                 '\" is a word. Please click Return Tiles and try again.'].join(''));
                                    });
                                    return false;
                                } else {
                                    // Word is valid
                                    newWords.push(theNewWord);
                                    $('#scoreAmount').text(parseInt($('#scoreAmount').text()) + runningScore*multiplier);
                                }
                            }
    
                            temp = [];
                            isNewWord = false;
                            runningScore = 0;
                            multiplier = 1;
                        } else {
                            // Add the tile's value to the running score
                            for (k=0; k<27; k++) {
                                if (myPieces.pieces[k].letter === letterArray[i][j]) {
                                    if ($curTile.hasClass('doubleLetterScore') && $curTile.hasClass('playerTileOccupied')) {
                                        runningScore = runningScore + myPieces.pieces[k].value*2;
                                    } else if ($curTile.hasClass('tripleLetterScore') && $curTile.hasClass('playerTileOccupied')) {
                                        runningScore = runningScore + myPieces.pieces[k].value*3;
                                    } else {
                                        runningScore = runningScore + myPieces.pieces[k].value;
                                    }
                                }
                            }
                            
                            if ($curTile.hasClass('playerTileOccupied')) {
                                if ($curTile.hasClass('doubleWordScore') || $curTile.hasClass('startSpace')) {
                                       multiplier = multiplier*2;
                                } else if ($curTile.hasClass('tripleWordScore')) {
                                       multiplier = multiplier*3;
                                }
                            }
                            
                            temp.push(letterArray[i][j]);
                        }
                    }
                    
                    $('#message').each(function() {
                        $(this).show();
                        $(this).removeClass('errorMessage').addClass('validMessage');
                        if (newWords.length === 1) {
                            $(this).text(['Yes ', newWords[0], ' is a word!'].join(''));
                        } else {
                            $(this).text(['Yes ', newWords.join(', '), ' are all words!'].join(''));
                        }
                    });
                }
    
                /* *** Check words in columns *** */
                for (i=0; i<15; i++) {
                    var temp = [];
                    var isNewWord = false;
                    var runningScore = 0;
                    var multiplier = 1;
                    for (j=0; j<=15; j++) {
                        var $curTile = $(['#scrabbleTable>tr:nth-child(', j+1, ')>td:nth-child(', i+1, ')'].join(''));
                        
                        if ($curTile.hasClass('playerTileOccupied')) {
                            isNewWord = true;
                        }
                        
                        // End of word detected
                        if (j === 15 || letterArray[j][i] === '*') {
                            var theNewWord = temp.join('');
                            if (theNewWord.length > 1 && isNewWord === true) {
                                theNewWord = correctBlanks(myPieces, theNewWord, dict);
                                
                                // Validate word
                                if (dict[theNewWord.toLowerCase()] !== true) {
                                    // Incorrect word found so stop trying to validate
                                    $('#message').each(function() {
                                        $(this).show();
                                        $(this).removeClass('validMessage').addClass('errorMessage');
                                        $(this).text(['Sorry, I don\'t think \"', theNewWord, 
                                                                 '\" is a word. Please click Return Tiles and try again.'].join(''));
                                    });
                                    return false;
                                } else {
                                    // Word is valid
                                    newWords.push(theNewWord);
                                    $('#scoreAmount').text(parseInt($('#scoreAmount').text()) + runningScore*multiplier);
                                }
                            }
    
                            temp = [];
                            isNewWord = false;
                            runningScore = 0;
                            multiplier = 1;
                        } else {
                            // Add the tile's value to the running score
                            for (k=0; k<27; k++) {
                                if (myPieces.pieces[k].letter === letterArray[j][i]) {
                                    if ($curTile.hasClass('doubleLetterScore') && $curTile.hasClass('playerTileOccupied')) {
                                        runningScore = runningScore + myPieces.pieces[k].value*2;
                                    } else if ($curTile.hasClass('tripleLetterScore') && $curTile.hasClass('playerTileOccupied')) {
                                        runningScore = runningScore + myPieces.pieces[k].value*3;
                                    } else {
                                        runningScore = runningScore + myPieces.pieces[k].value;
                                    }
                                }
                            }
                            
                            if ($curTile.hasClass('playerTileOccupied')) {
                                if ($curTile.hasClass('doubleWordScore') || $curTile.hasClass('startSpace')) {
                                       multiplier = multiplier*2;
                                } else if ($curTile.hasClass('tripleWordScore')) {
                                       multiplier = multiplier*3;
                                }
                            }
                                
                            temp.push(letterArray[j][i]);
                        }
                    }
                    
                    $('#message').each(function() {
                        $(this).show();
                        $(this).removeClass('errorMessage').addClass('validMessage');
                        if (newWords.length === 1) {
                            $(this).text(['Yes ', newWords[0], ' is a word!'].join(''));
                        } else {
                            $(this).text(['Yes ', newWords.join(', '), ' are all words!'].join(''));
                        }
                    });
                }
            }
            
            // Clone tiles that are on the board, deal new tiles
            $('.playerTile.placedOnTable').each(function() {
                $(this).removeClass('placedOnTable');
                var $clone = $(this).clone();
                $clone.removeClass('playerTile ui-draggable');
                $clone.removeAttr('id');
                $clone.css({'background-image':$(this).css('background-image'), 'width':'36px', 'height':'40px'});
                $('#wrapper').append($clone);
                
                var newPiece = dealTile(myPieces);
                
                if (newPiece !== 'ERROR') {
                    $(this).css('background-image', ['url(image/ScrabbleLetters/Scrabble', newPiece, '.png)'].join(''));
                } else {
                    $(this).hide();
                    $(this).draggable('disable');
                }
                
                myPieces = updatePieces(myPieces, newPiece, -1);
                displayPieces(myPieces);
            });
            
            // Return playerTile div tags to rack
            $('.playerTile').each(function() {
                $(this).draggable('enable');
                
                returnTiles(0, $(this));
            });
            
            $('#message').each(function() {
                if ($(this).hasClass('errorMessage')) {
                    $(this).hide();
                }
            });
            $('.playerTileOccupied').removeClass('playerTileOccupied');   
            validateSpaces();
        });
        
        /* ****** New Game Button ****** */
        $('#newGameButton').click(function() {
            // Clear board
            returnTiles(0);
            $('.playerTile').draggable('enable');
            $('.ui-draggable-disabled').remove();
            $('.occupied').removeClass('occupied playerTileOccupied');
            
            // Clear messages
            $('#scoreAmount').text('0');
            $('#message').hide();
            
            // Get pieces structure again
            $.getJSON("data/pieces.json", function(data) {
                myPieces = data;
            
                $('.playerTile').each(function() {
                    var newPiece = dealTile(myPieces);
                    if (newPiece !== 'ERROR') {
                        $(this).css('background-image', ['url(image/ScrabbleLetters/Scrabble', newPiece, '.png)'].join(''));
                    } else {
                        $(this).hide();
                        $(this).draggable('disable');
                    }
                    
                    myPieces = updatePieces(myPieces, newPiece, -1);
                });
                
                displayPieces(myPieces);
            });
            
            // Clear letter array
            for (i=0; i<15; i++) {
                letterArray[i] = [];
                for (j=0; j<15; j++) {
                    letterArray[i][j] = '*';
                }
            }
            
            validateSpaces();
        });
    });
});


/* validateSpaces():
 * 
 * This function highlights which spaces a new tile can be placed.
 * When called without parameters, it highlights every potential space. 
 * When called with a single space, it checks up, down, left, and right 
 * for open spaces to highlight.
 */

function validateSpaces(curSpace) {
    $('.valid').removeClass('valid');
    
    if (jQuery.type(curSpace) === 'undefined') {
        /* Check whole table. This functionality is used to begin a new turn. */
        $('.occupied').each(function() {
            // Validate horizontally
            $(this).prev().addClass('valid horizontal vertical');
            $(this).next().addClass('valid horizontal vertical');
            
            // Validate vertically
            $(this).parent().next().children().eq($(this).index()).addClass('valid horizontal vertical');
            $(this).parent().prev().children().eq($(this).index()).addClass('valid horizontal vertical');
        });
        
        $('.valid.occupied').removeClass('valid');
        
        if ($('.occupied').length === 0) {
            $('.startSpace').addClass('valid horizontal vertical');
        }
    } else {
        var i;
        var curRow = curSpace.parent();
        var hasHorizontal = curSpace.hasClass('horizontal');
        var hasVertical = curSpace.hasClass('vertical');

        $('.horizontal').removeClass('horizontal');
        $('.vertical').removeClass('vertical');
        
        // Validate spaces horizontally
        if (hasHorizontal) {
            // Search left
            for (i=curSpace.index(); i>=0; i--) {
                if (!curRow.children().eq(i).hasClass('occupied')) {
                    curRow.children().eq(i).addClass('valid horizontal');
                    break;
                }
            }
            
            // Search right
            for (i=curSpace.index(); i<16; i++) {
                if (!curRow.children().eq(i).hasClass('occupied')) {
                    curRow.children().eq(i).addClass('valid horizontal');
                    break;
                }
            }
        }
        
        // Validate spaces vertically
        if (hasVertical) {    
            // Search up
            for (i=curRow.index(); i>=0; i--) {
                var $theSpace = $('table').children().eq(i).children().eq(curSpace.index());
                if (!$theSpace.hasClass('occupied')) {
                    $theSpace.addClass('valid vertical');
                    break;
                }
            }
            
            // Search down
            for (i=curRow.index(); i<16; i++) {
                var $theSpace = $('table').children().eq(i).children().eq(curSpace.index());
                if (!$theSpace.hasClass('occupied')) {
                    $theSpace.addClass('valid vertical');
                    break;
                }
            }
        }
    }
}


/* returnTiles():
 * 
 * This function returns the player tiles to the rack.
 * It takes the ease value for the animation, and has the option of taking a tile.
 * If a tile is given, it only returns that tile to the rack. 
 * Otherwise it returns all tiles to the rack.
 */

function returnTiles(ease, tile) {
    var rackPos = $('#scrabbleRack').offset();
    if (jQuery.type(tile) === 'undefined') {
        $('.playerTile').each(function(){
            var myId = $(this).attr('id');
            var index = myId.substring(myId.length-1, myId.length);
            $(this).animate({
                left: rackPos.left - 15  + 40*index,
                top: rackPos.top + 8
            }, ease, function() {});
        });
    } else {
        var myId = tile.attr('id');
        var index = myId.substring(myId.length-1, myId.length);
        tile.animate({
            left: rackPos.left - 15  + 40*index,
            top: rackPos.top + 8
        }, ease, function() {});
    }
}


/* dealTile():
 * 
 * This function takes a pieces object and deals one random tile from it.
 * It returns the dealt tile's letter property.
 */

function dealTile(myPieces) {
    var index = Math.floor(Math.random() * 27);
    var allZero = true;
    var i;
    
    for (i=0; i<27; i++) {
        if (!(myPieces.pieces[i].amount === 0)) {
            allZero = false;
        }
    }
    if (allZero) {
        return 'ERROR';
    }
    
    while (myPieces.pieces[index].amount === 0) {
        index = Math.floor(Math.random() * 27);
    }
    
    return myPieces.pieces[index].letter;
}


/* updatePieces():
 * 
 * This function takes a pieces object, a letter, and the increment number.
 * It returns a pieces object with the amount property of the given letter
 * incremented by the proper amount.
 */

function updatePieces(myPieces, myLetter, inc) {
    var i;
    for (i=0; i<myPieces.pieces.length; i++) {
        if (myLetter === myPieces.pieces[i].letter) {
            myPieces.pieces[i].amount += inc;
        }
    }
    return myPieces;
}


/* displayPieces():
 * 
 * This function takes a pieces object and displays its piece amounts
 * in the letter distribution box.
 */

function displayPieces(myPieces) {
    var i = 0;
    $('li > span').each(function() {
        $(this).text([myPieces.pieces[i].amount].join(''));
        i++;
    });
}


/* correctBlanks()
 * 
 * This function takes a word, and the dictionary in order to fix
 * blank tiles in the word. It goes through each possible word, using
 * the pieces object to go through each letter in the alphabet.
 * If a proper word is found, that word is returned. If not, the
 * original word iis returned.
 */

function correctBlanks(myPieces, theNewWord, dict) {
    var i;
    var j;

    var numUnderscores = (theNewWord.match(/_/g) || []).length;
    
    if (numUnderscores === 0) {
        return theNewWord;
    }
    
    if (numUnderscores === 1) {
        for (i=0; i<26; i++) {
            var temp = theNewWord.replace('_', myPieces.pieces[i].letter);
            
            if (dict[temp.toLowerCase()]) {
                return temp;
            }
        }
    }
    
    if (numUnderscores === 2) {
        for (i=0; i<26; i++) {
            var temp1 = theNewWord.replace('_', myPieces.pieces[i].letter);
            for (j=0; j<26; j++) {
                var temp2 = temp1.replace('_', myPieces.pieces[j].letter);
                if (dict[temp2.toLowerCase()]) {
                    return temp2;
                }
            }
        }
    }
    
    return theNewWord;
}



