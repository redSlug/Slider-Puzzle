# Slider Puzzle


Inspired by Evan Henley's [slider game](http://henleyedition.com/reactjs-slide-puzzle/), I created a n-puzzle slider game and added hint capabilities and auto-solving to the 3x3 version. I recommend checking out [his code](https://github.com/echenley/reactjs-slide-puzzle/). Some of the server code and instructions below came from [the react tutorial] (https://github.com/reactjs/react-tutorial), which you may want to check out as well.

## To use

The server serves static files from `public/` and handles requests to `/api/game`. Start a server with the following:

### Python

```sh
pip install -r requirements.txt
python server.py
```

And visit <http://localhost:3000/>. Try opening multiple tabs!

## Changing the port

You can change the port number by setting the `$PORT` environment variable before invoking any of the scripts above, e.g.,

```sh
PORT=3001 node server.js
```

## Ideas for the future
- Make react code conform to style guide, maybe don't use ReactClass for everything.
- Remove hint movement and just keep highlighting
- Maybe make it work with no server
- Have a front page or multiple tabs
- Make win more exciting with a big congrats modal overlay
- Submit solution to database upon winning, have list of folks who solved it
- Ability so push two tiles at once
- Switch to a Node server
- Turn it into an iOS and Android app


