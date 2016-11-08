"""This module responds to client requests for solving a 3x3 puzzle."""


import json
import os
import puzzle
from flask import Flask, Response, request

app = Flask(__name__, static_url_path='', static_folder='public')
app.add_url_rule('/', 'root', lambda: app.send_static_file('index.html'))

TREE = puzzle.SolutionTree(3, 31)
HINT_TILE_VAL = 'HINT_TILE_VAL'
MIN_MOVES_VAL = 'MIN_MOVES_VAL'
SOLUTION_ARR = 'SOLUTION_ARR'
TILES_STR = 'TILES_STR'

@app.route('/api/game', methods=['GET', 'POST'])
def request_handler():
    """Handles requests to help user solve sliding puzzle in minimum moves."""
    response = {}
    if request.method == 'POST':
        request_dict = request.form.to_dict()
        board = request_dict[TILES_STR]
        response[TILES_STR] = board
        if MIN_MOVES_VAL in request_dict:
            response[MIN_MOVES_VAL] = TREE.get_min_moves(board)
        if SOLUTION_ARR in request_dict:
            response[SOLUTION_ARR] = TREE.get_all_hint_tile_values(board)
        elif HINT_TILE_VAL in request_dict:
            response[HINT_TILE_VAL] = TREE.get_next_hint_tile_value(board)

    return Response(
        json.dumps(response),
        mimetype='application/json',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )

if __name__ == '__main__':
    app.run(port=int(os.environ.get("PORT", 3000)), debug=True)
