"""This module creates a tree of puzzles with the solved puzzle at the root."""

from collections import namedtuple

TreeNode = namedtuple('TreeNode', ['pieces_str', 'parent', 'children'])

class SolutionTree(object):
    """This class holds the game states tree_height moves deep for a puzzle.
    >>> s = SolutionTree(2, 6)
    >>> s.get_min_moves('1,2,3,0')
    0
    >>> s = SolutionTree(3, 5)
    >>> s.get_min_moves('0,1,2,4,5,3,7,8,6')
    4
    >>> s.get_all_hint_tile_values('0,1,2,4,5,3,7,8,6')
    [1, 2, 3, 6]
    >>> s.get_next_hint_tile_value('1,0,2,4,5,3,7,8,6')
    2
    """
    def __init__(self, board_width, tree_height):
        self.width = board_width
        root_board = range(1, board_width**2) + [0]
        pieces_str = ','.join(str(piece) for piece in root_board)
        self.root = TreeNode(pieces_str, None, [])
        self.node_dict = {}
        self._grow_tree(tree_height)

    def get_min_moves(self, pieces_str):
        """Gets min moves needed to solve the sliding puzzle."""
        if pieces_str not in self.node_dict:
            return -1
        result = 0
        node = self.node_dict[pieces_str]
        while node.parent:
            result += 1
            node = node.parent
        return result

    def get_all_hint_tile_values(self, pieces_str):
        """Returns the sequence of values that if clicked solve the puzzle."""
        solution_values = []
        node = None
        if pieces_str in self.node_dict:
            node = self.node_dict[pieces_str]
        while node.parent:
            solution_values.append(self._get_hint_tile_value(node))
            node = node.parent
        return solution_values

    def get_next_hint_tile_value(self, pieces_str):
        """Returns next best value to click to help the puzzle."""
        if pieces_str not in self.node_dict:
            return
        return self._get_hint_tile_value(self.node_dict[pieces_str])

    @staticmethod
    def _get_hint_tile_value(node):
        pieces_str = node.pieces_str
        parent_str = node.parent.pieces_str
        return int(parent_str[pieces_str.index('0')])

    def _grow_tree(self, max_depth):
        current_depth = 0
        queue = [self.root]
        next_queue = []
        self.node_dict[self.root.pieces_str] = self.root
        while current_depth < max_depth and queue:
            node = queue.pop(0)
            puzzle = Puzzle(node.pieces_str, self.width)
            pieces_strings = puzzle.get_next_valid_pieces_strings()
            for pieces_str in pieces_strings:
                if pieces_str in self.node_dict:
                    continue
                child_node = TreeNode(pieces_str, node, [])
                self.node_dict[pieces_str] = child_node
                node.children.append(child_node)
                next_queue.append(child_node)
            if not queue:
                queue = next_queue
                next_queue = []
                current_depth += 1

Position = namedtuple('Position', ['row', 'col'])

Move = namedtuple('Move', ['y', 'x'])

class Puzzle(object):
    """This class helps the SolutionTree get the next puzzle strings.
    >>> p = Puzzle('1,2,3,4,5,0,7,8,6', 3)
    >>> p.get_next_valid_pieces_strings()
    ['1,2,3,4,0,5,7,8,6', '1,2,0,4,5,3,7,8,6', '1,2,3,4,5,6,7,8,0']
    >>> p.get_next_positions()
    [Position(row=1, col=1), Position(row=0, col=2), Position(row=2, col=2)]
    """

    def __init__(self, pieces_str, width):
        self.pieces = pieces_str.split(',')
        self.width = width
        self.blank = self._convert_index_to_position(self.pieces.index('0'))

    def get_next_valid_pieces_strings(self):
        """Returns the next possible board configurations."""
        pieces_strings = []
        for position in self.get_next_positions():
            pieces_strings.append(self._get_next_string(position))
        return pieces_strings

    def get_next_positions(self):
        """Returns the next positions on the board that could be clicked."""
        next_positions = []
        for move in [Move(0, -1), Move(0, 1), Move(-1, 0), Move(1, 0)]:
            position = Position(move.y + self.blank.row, move.x + self.blank.col)
            if self._is_in_puzzle_bounds(position.row, position.col):
                next_positions.append(position)
        return next_positions

    def _is_in_puzzle_bounds(self, row, col):
        return 0 <= row < self.width and 0 <= col < self.width

    def _get_next_string(self, position):
        # Swaps blank tile with the position and assumes it is a valid move.
        new_pieces = list(self.pieces)
        start_index = new_pieces.index('0')
        end_index = self._convert_position_to_index(position)
        new_pieces[int(start_index)] = new_pieces[end_index]
        new_pieces[end_index] = '0'
        return ','.join(new_pieces)

    def _convert_index_to_position(self, string_index):
        row, col = divmod(string_index, self.width)
        return Position(int(row), int(col))

    def _convert_position_to_index(self, position):
        return int(position.row * self.width + position.col)


if __name__ == "__main__":
    import doctest
    doctest.testmod()
