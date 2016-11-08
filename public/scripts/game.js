// Author:     bdettmer@gmail.com

// Constants
const HINT_TILE_VAL = 'HINT_TILE_VAL';
const MIN_MOVES_VAL = 'MIN_MOVES_VAL';
const SOLUTION_ARR = 'SOLUTION_ARR';
const TILES_STR = 'TILES_STR';

const PUZZLE_WIDTH_ARRAY = [3, 4, 5];
const DEFAULT_BOARD_WIDTH = 3;

const SERVER_ERROR_MESSAGE = 'Server error. No hints or giving up.';


const Game = React.createClass({
    /**
     * @param {Array} array - The tiles represented by integers. The blank tile
     *  is represented by '' to make rendering and animation straightforward.
     * */
    shuffle: function(array) {
        /**
         * Switches the first two non-empty tiles.
         * @param {Array} array - The tiles represented by integers and ''.
         * */
        function switchTiles(array) {
            let i = 0;
            while (!array[i] || !array[i + 1]) i++;
            let tmp = array[i];
            array[i] = array[i + 1];
            array[i + 1] = tmp;
        }

        /**
         * Counts inversions in the array. This method came from echenley@.
         * @param {Array} array - The tiles represented by integers and ''.
         * @return {int} inversions - The amount of inversions in the array.
         * */
        function countInversions(array) {
            let invArray = array.map(function (num, i) {
                let inversions = 0;
                for (let j = i + 1; j < array.length; j++) {
                    if (array[j] && array[j] < num) {
                        inversions += 1;
                    }
                }
                return inversions;
            });
            return invArray.reduce(function (a, b) {
                return a + b;
            });
        }

        /**
         * Shuffles the array in linear time using Durstenfeld's algorithm.
         * @param {Array} array - The tiles represented by integers and ''.
         * */
        function shuffleTiles(array) {
            for (let i = array.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                let temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        }

        // Shuffle array and make solvable.
        shuffleTiles(array);
        if (countInversions(array) % 2 !== 0) {
            switchTiles(array);
        }
    },
    /**
     * Provides the initial state needed to start the game. If there is no
     *  previous width state, DEFAULT_BOARD_WIDTH is used. All other state
     *  fields are generated from scratch. Optimal move count is set as a side
     *  effect if the server has it.
     * @param {int} width - The number of rows as well as columns in the board.
     * @return {State} A new state including newly shuffled tiles and a copy
     *  called initialTiles in case the user wants to re-start with the same
     *  board.
     * */
    getInitialState: function (width) {
        if (PUZZLE_WIDTH_ARRAY.indexOf(width) == -1) {
            width = DEFAULT_BOARD_WIDTH;
        }

        // Get new board and shuffle.
        let board = [];
        for (let i = 1; i < width * width; i++) {
            board.push(i);
        }
        board.push('');
        this.shuffle(board);

        this.getOptimalMoveCountString(this.getTilesString(board));
        return {
            tiles: board,
            initialTiles: board.slice(),
            width: width,
            movesTaken: 0,
            hintsTaken: 0,
            gameOver: false,
        };
    },
    /**
     * Checks the order of the tiles and returns true if the puzzle is solved.
     * @return {boolean} Whether board is in the solved state.
     * */
    boardIsSolved: function () {
        let tiles = this.state.tiles;
        for (let i = 0; i < tiles.length - 1; i++) {
            if (tiles[i] !== i + 1) return false;
        }
        return true;
    },
    /**
     * Performs animation and board update associated with a tile if possible.
     * @param {Element} srcElement - The source tile.
     * @param {int} srcElementIndex - The valid source index in the tiles array.
     * @param {boolean} hintUsed - Whether origin is hint or click event.
     * @return {boolean} Whether the moveRequest resulted in a board update.
     * */
    moveRequest: function (srcElement, srcElementIndex, hintUsed) {
        let tiles = this.state.tiles;
        let width = this.state.width;
        let srcElementValue = parseInt(srcElement.innerText);
        let targetElement = document.getElementById('tile0');
        let targetElementIndex = tiles.indexOf('');
        let sourcePosition = getPositionFromIndex(srcElementIndex);
        let targetPosition = getPositionFromIndex(targetElementIndex);


        /**
         * Converts an array index into a row and column position on the board.
         * @param {int} tileIndex - A valid index in the array of tiles.
         * @return {Array} Row and column of the element [row,col].
         * */
        function getPositionFromIndex(tileIndex) {
            return [parseInt(tileIndex / width), tileIndex % width];
        }

        /**
         * Indicates whether the source tile is adjacent to the target tile.
         * @return {boolean} Whether the tiles are one space apart.
         * */
        function isValidMove() {
            let verticalDist = sourcePosition[0] - targetPosition[0];
            let horizontalDist = sourcePosition[1] - targetPosition[1];
            return Math.abs(verticalDist) + Math.abs(horizontalDist) == 1;
        }

        /**
         * Retrieves the direction for the css style given target and source
         *  positions.
         * Assumes positions are one right, left, down or up move apart.
         * @return {String} One of four directions, right, left, down or up.
         * */
        function getDirection() {
            // If source and target are the same row, we check column.
            if (sourcePosition[0] == targetPosition[0]) {
                if (sourcePosition[1] + 1 == targetPosition[1]) return 'right';
                if (sourcePosition[1] - 1 == targetPosition[1]) return 'left';
            }
            if (sourcePosition[0] + 1 == targetPosition[0]) return 'down';
            if (sourcePosition[0] - 1 == targetPosition[0]) return 'up';
        }

        /**
         * Animates the switching of srcElement and targetElement tiles.
         * @param {String} direction - Style string used to accentuate animation
         *  of switching tiles.
         * */
        function animateTiles(direction) {
            srcElement.classList.add('move-' + direction);
            setTimeout(function () {
                // Timeout and css animations align.
                targetElement.classList.add('highlight');
                srcElement.classList.remove('move-' + direction);
                setTimeout(function () {
                    targetElement.classList.remove('highlight');
                }, 400);
            }, 200);
        }

        /**
         * Sets state, updates movesTaken and hintsTaken, and updates the tiles
         *  array.
         * */
        function afterAnimate() {
            tiles[srcElementIndex] = '';
            tiles[targetElementIndex] = srcElementValue;
            let gameOver = this.boardIsSolved();
            let newState = {
                movesTaken: this.state.movesTaken + 1,
                tiles: tiles,
                gameOver: gameOver,
            };
            if (hintUsed) {
                newState['hintsTaken'] = this.state.hintsTaken + 1;
            }
            if (gameOver) {
                newState['animatingSolution'] = false;
            }
            this.setState(newState);
        }

        if (isValidMove() && !this.state.gameOver) {
            animateTiles(getDirection());
            setTimeout(afterAnimate.bind(this), 200);
            return true;
        }
        return false;
    },
    /**
     * Checks that the data from the server is not stale and that key is in the
     *  data. If the data is not good, the user is notified of a server error.
     * @param {Response} data - Data from the server.
     * @param {String} key - Key in the data being verified.
     * @return {boolean} Whether the data is good.
     * */
    serverDataIsGood: function(data, key) {
        let tiles = this.state.tiles;
        let tilesStr = this.getTilesString(tiles);
        let error = !(TILES_STR in data) || data[TILES_STR] != tilesStr;
        if (error || !(key in data)) {
            this.notifyError();
            return false;
        }
        return true;
    },
    /**
     * Uses data from the server to provide a hint to the user. The hint is the
     *  number on the tile needed to be clicked in order to solve the puzzle.
     * @param {Response} data - Data from the server with hint value populated.
     * */
    giveUserHint: function (data) {
        if (!this.serverDataIsGood(data, HINT_TILE_VAL)) return;

        let tiles = this.state.tiles;
        let moveRequest = this.moveRequest;
        let value = data[HINT_TILE_VAL];
        let tileToMove = document.getElementById('tile' + value);
        let positionIndex = tiles.indexOf(value);
        moveRequest(tileToMove, positionIndex, true);
    },
    /**
     * Uses data from the server to animate the solution of the puzzle.
     * @param {Response} data - Data from the server with sequence of numbers
     *  that if clicked will solve the puzzle.
     * */
    giveSolution: function (data) {
        if (!this.serverDataIsGood(data, SOLUTION_ARR)) return;

        let solutionArray = data[SOLUTION_ARR];
        if (solutionArray.length == 0) {
            this.notifyError();
            return;
        }

        let moveRequestFn = this.moveRequest;

        this.setState({'animatingSolution': true});

        let i = 0;

        /**
         * Animates the switching of position of the srcElement and
         * targetElement tiles continuously until the puzzle is solved.
         * */
        function animateSolution() {
            let valueString = solutionArray[i];
            let tileToClick = document.getElementById('tile' + valueString);
            let value = parseInt(valueString);
            let index = tiles.indexOf(value);
            let clicked = moveRequestFn(tileToClick, index, true);
            if (i++ < solutionArray.length - 1 && clicked) {
                setTimeout(animateSolution, 600);
            }
        }

        animateSolution();
    },
    /**
     * Uses data from the server to set bottomMessage string state.
     * @param {Response} data - Data from the server with a string including
     *  the optimal move count or 'unknown'.
     * */
    setBottomMessage: function (data) {
        let bottomMessage;

        if (!(MIN_MOVES_VAL in data)) {
            bottomMessage = SERVER_ERROR_MESSAGE;
        } else {
            let minMoves = data[MIN_MOVES_VAL];
            if (minMoves == -1) {
                bottomMessage = 'Solve this puzzle.';
            } else {
                bottomMessage = 'Best move count: ' + minMoves;
            }
        }
        this.setState({'bottomMessage': bottomMessage});
    },
    /** Notifies the user of a server error by setting text below game. */
    notifyError: function () {
        this.setState({'bottomMessage': SERVER_ERROR_MESSAGE});
    },
    /**
     * Sends a request to the server, gets data back and executes a callback
     *  with the data sent through as a parameter.
     * @param {Request} request - A hash populated depending on the type of
     *  request.
     * @param {Object} responseAction - Method to be called upon success.
     * */
    serverRequest: function (request, responseAction) {
        if (!(TILES_STR in request)) {
            request[TILES_STR] = this.getTilesString(this.state.tiles);
        }

        $.ajax({
            url: this.props.url,
            dataType: 'json',
            type: 'POST',
            data: request,
            success: function (data) {
                responseAction(data);
            },
            error: function (xhr, status, err) {
                this.notifyError();
                console.error(this.props.url, status, err.toString());
            }.bind(this),
        });
    },
    /** Sends a server request to get the next hint tile value. */
    getHint: function () {
        if (!this.state.bottomMessage) {
            this.notifyError();
        }
        this.serverRequest({HINT_TILE_VAL: true}, this.giveUserHint);
    },
    /** Sends a server request to solve the puzzle. */
    giveUp: function () {
        if (!this.state.bottomMessage) {
            this.notifyError();
        }
        this.serverRequest({SOLUTION_ARR: true}, this.giveSolution);
    },
    /**
     * Sends a server request for optimal move count needed to solve puzzle.
     * @param {String} tilesStr - Comma delimited representation of the board.
     * */
    getOptimalMoveCountString: function (tilesStr) {
        this.serverRequest(
            {MIN_MOVES_VAL: true, TILES_STR: tilesStr},
            this.setBottomMessage
        );
    },
    /**
     * Converts the array of tiles into the string format expected by the
     *  server. The empty string is replaced with 0.
     * @param {Array} tiles - The tiles represented by integers and ''.
     * @return {String} The tiles represented by a comma delimited string.
     * */
    getTilesString: function (tiles) {
        let gameTiles = tiles.slice();
        gameTiles[gameTiles.indexOf('')] = 0;
        return gameTiles.toString();
    },
    /**
     * Re-sizes the puzzle.
     * @param {int} width - The new width of the puzzle.
     * */
    resizePuzzle: function (width) {
        this.setState(this.getInitialState(width));
    },
    /** Replaces the tiles with initial tiles and resets some state fields. */
    startOver: function () {
        this.setState({
            tiles: this.state.initialTiles.slice(), // make a copy
            movesTaken: 0,
            gameOver: false,
        });
    },
    /** Generates a name puzzle of same width and resets state fields. */
    newGame: function () {
        this.setState(this.getInitialState(this.state.width));
    },
    render: function () {
        let noMoves = this.state.movesTaken == 0;
        let gameOver = this.state.gameOver;
        let animating = this.state.animatingSolution;
        let tileClass = animating || gameOver ? 'dumb-tile' : 'tile';
        let width = this.state.width;
        let noHelp = width !== 3 || gameOver || animating;
        let helpClass = noHelp ? 'hidden' : 'button';

        // This is a hacky way to reward the user for winning.
        let showRainbow = gameOver && !animating && this.state.hintsTaken < 10;
        if (showRainbow) {
            document.body.classList.add('win');
        } else {
            document.body.classList.remove('win');
        }


        return (
            <div>
                <h1>Sliding Puzzle</h1>
                <div id="game-board" className={'game-' + width + 'x' + width}>
                    {this.state.tiles.map(function (value, position) {
                        return (
                            <Tile
                                key={position}
                                value={value}
                                position={position}
                                animating={animating}
                                tileClass={tileClass}
                                moveRequest={this.moveRequest}
                            />
                        );
                    }, this)}
                </div>
                <Menu
                    newGameClass={animating ? 'hidden' : 'button'}
                    startOverClass={animating || noMoves ? 'hidden' : 'button'}
                    helpClass={helpClass}
                    newGame={this.newGame}
                    startOver={this.startOver}
                    getHint={this.getHint}
                    giveUp={this.giveUp}
                    resizePuzzleClass={animating ? 'hidden' : 'button'}
                    resizePuzzle={this.resizePuzzle}
                    puzzleSizeValue={width}
                />
                <MessageBox
                    hintCount={this.state.hintsTaken}
                    moveCount={this.state.movesTaken}
                    gameOver={gameOver}
                    animating={animating}
                    bottomMessage={this.state.bottomMessage}
                />
            </div>
        );
    },
});

const Tile = React.createClass({
    clickHandler: function (e) {
        // Prevent clicks during animation
        if (this.props.animating) return;

        this.props.moveRequest(e.target, this.props.position, false);
    },
    render: function () {
        return (
            <div
                className={this.props.tileClass}
                id={'tile' + (this.props.value ? this.props.value : '0')}
                onClick={this.clickHandler}>
                {this.props.value}
            </div>
        );
    },
});

const MessageBox = React.createClass({
    render: function () {
        let moves = this.props.moveCount;
        let hints = this.props.hintCount;
        let wait = this.props.animating;
        let done = this.props.gameOver;
        let bottomMessage = this.props.bottomMessage;

        let metricsMessage = moves + ' move(s), ' + hints + ' hint(s)';
        let gameMessage = 'You can do this!';
        if (done) gameMessage = 'Nice Try!';
        if (hints <= 15 && done) gameMessage = 'You Won! Try using less hints.';
        if (hints <= 10 && done) gameMessage = 'You are SUPER Awesome!';
        if (hints == 0 && done) gameMessage = 'You are SUPER SUPER Awesome!';
        if (moves == 0) gameMessage = 'Put the tiles in order.';
        if (wait) gameMessage = 'Enjoy watching the solution.';
        return (
            <div>
                <h3>{gameMessage}</h3>
                <h3>{metricsMessage}</h3>
                <h3>{bottomMessage}</h3>
            </div>
        );
    },
});

const Menu = React.createClass({
    getHint: function () {
        let button = document.getElementById('hint-button');
        if (button.disabled) return;
        this.props.getHint();
        // Add delay for animation.
        button.disabled = true;
        setTimeout(function () {
            button.disabled = false;
        }, 600);
    },
    sizeChangeHandler: function (e) {
        this.props.resizePuzzle(parseInt(e.target.value));
    },
    render: function () {
        let sizeOptions = PUZZLE_WIDTH_ARRAY.map(function (item, index) {
            return (
                <option key={index} value={item}>{item + ' x ' + item}</option>
            );
        });
        return (
            <div id="menu">
                <a
                    className={this.props.newGameClass}
                    onClick={this.props.newGame}>New Game
                </a>
                <a
                    id="hint-button"
                    className={this.props.helpClass}
                    onClick={this.getHint}>Hint
                </a>
                <a
                    className={this.props.helpClass}
                    onClick={this.props.giveUp}>Give up
                </a>
                <br />
                <a
                    className={this.props.startOverClass}
                    onClick={this.props.startOver}>Start over
                </a>
                <select
                    className={this.props.resizePuzzleClass}
                    onChange={this.sizeChangeHandler}
                    value={this.props.value}>{sizeOptions}
                </select>
            </div>
        );
    },
});


ReactDOM.render(
    <Game url="/api/game"/>,
    document.getElementById('game-container')
);
