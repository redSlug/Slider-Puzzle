# Slider Puzzle


Inspired by Evan Henley's [slider game](http://henleyedition.com/reactjs-slide-puzzle/), I re-used some of his code and created an n-puzzle slider game. Next, I added hints and auto-solving functionality. Since [finding the solution to the general N-Puzzle is NP-Complete](http://www.aaai.org/Papers/AAAI/1986/AAAI86-027.pdf), I created a solution tree for the 3x3 puzzle and stored the solutions in a dictionary allowing for constant time lookup. For the 3x3 puzzle, there are 9! puzzle configurations, but only half of them are valid, so the solution tree has 181,440 nodes. Some of the server code and instructions below came from [the react tutorial](https://github.com/reactjs/react-tutorial).

## To play

[Visit heroku](https://brad-s-slider-app.herokuapp.com/)

## To use

The server serves static files from `public/` and handles requests to `/api/game`. Start a server with the following:

### Python

```sh
pip install -r requirements.txt
python server.py
```

And visit <http://localhost:3000/>.

## Changing the port

You can change the port number by setting the `$PORT` environment variable before invoking any of the scripts above, e.g.,

```sh
PORT=3001 python server.py
```

## Ideas for the future
- Make react code conform to style guide, maybe don't use ReactClass for everything
- Remove hint movement and just keep highlighting
- Since there can be many optimal moves, consider hilighting all of them
- Have a front page or multiple tabs
- Make win more exciting with a big congrats modal overlay
- Submit solution to database upon winning, have list of folks who solved it appear at the bottom of the puzzle
- Ability so push two tiles at once
- Switch to a Node server
- Turn it into an iOS and Android app
