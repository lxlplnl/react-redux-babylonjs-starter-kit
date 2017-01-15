import { delay } from 'redux-saga'
import { takeEvery, take, put, select } from 'redux-saga/effects'

import {
  START_GAME,
  PLAYERS_CHOSEN,
  BOARD_PIECE_PICKED,
  BOARD_BASE_PICKED,
  PLAYER_PIECE_SELECTED,
  PLAYER_BASE_SELECTED,
  GAME_WON
} from '../routes/Quarto/modules/quarto'

Array.matrix = function(numrows, numcols, initial) {
    var arr = [];
    for (var i = 0; i < numrows; ++i) {
        var columns = [];
        for (var j = 0; j < numcols; ++j) {
            columns[j] = initial;
        }
        arr[i] = columns;
    }
    return arr;
}

let lastSelectedPiece = null
let boardPieces = Array.matrix(4, 4, null);

export function* onGameStart(action) {
    
    console.log('saga resetting game state')
    lastSelectedPiece = null
    boardPieces = Array.matrix(4, 4, null);

    // try {
    //   console.log(`in saga - game start received:${action.type} putting: 'GAME_STARTED'`)
    //   yield put({
    //      type: 'GAME_STARTED',
    //      triggerAction: action // not used
    //   })
    // } catch (error) {
    //   console.error('error in quartoEventsGenerator', error)
    // }
}

const currentGameState = (state) => {
  return state.quarto
}

export function* onBoardPiecePicked(action) {
    const currentState = yield select(currentGameState)
    
    console.log('piece pick allowed', currentState.started, currentState.playerPickPiece)

    if (currentState.started && currentState.playerPickPiece) {
      const { piece } = action
      console.log(`pick result name ${piece.name} isOnBoard: ${piece.isOnBoard}`)

      if (piece.isOnBoard) {
        console.log('chose a piece already on the board (ignored)')
      } else {
        lastSelectedPiece = piece
        yield put({
          type: PLAYER_PIECE_SELECTED,
          piece
        })
      }
    }
}

const arrayContainsQuarto = (pieces) => {
    var codeAnd = 15; // 1111
    var codeNotAnd = 15; // 1111
    pieces.forEach(piece => {
        if (piece !== null) {
            codeAnd &= piece.code;
            codeNotAnd &= ~piece.code;
        } else {
            codeAnd &= 0;
            codeNotAnd &= 0;
        }
    });

    return (codeAnd>0)?codeAnd:codeNotAnd;
}

const matrixContainsQuarto = (matrix) => {
  let isWin = false

  let arrayWinner

  // check lines
  for(let rowNum of [0,1,2,3]) {
      let code = arrayContainsQuarto(matrix[rowNum]);
      if (code > 0) {
          return {
            win: true,
            type: 'row',
            winners: matrix[rowNum],
            number: rowNum
          }
      }
  }

  for(let col of [0,1,2,3]) {
    let array = []
    for(let row of matrix) {
      array.push(row[col])
    }
    let code = arrayContainsQuarto(array);
    if (code > 0) {
      return {
          win: true,
          type: 'column',
          winners: array,
          number: col
        }
    }
  }

  return {
    win: false
  }
}

export function* onBoardBasePicked(action) {
    const currentState = yield select(currentGameState)
    
    console.log('piece base allowed', currentState.started, currentState.playerPickBase)

    if (currentState.started && currentState.playerPickBase) {
      const { base } = action
      console.log(`pick result name ${base.name} piece: ${base.piece}`)

      let pieceToMove = lastSelectedPiece

      if (base.piece) {
        console.log('chosen base already has a piece (ignored)')
      } else if (pieceToMove === null) {
        console.log('race condition on lastPiece (ignored)')
      } else {

        let pieceData = {
          isTall: pieceToMove.isTall,
          isBlack: pieceToMove.isBlack,
          isCubic: pieceToMove.isCubic,
          isSolidTop: pieceToMove.isSolidTop,
          code: pieceToMove.getCode()
        }
        
        console.log(`putting piece at ${base.col} x ${base.line}`)

        boardPieces[base.col][base.line] = pieceData

        const winResult = matrixContainsQuarto(boardPieces)

        console.log('win result', winResult)

        yield put({
          type: PLAYER_BASE_SELECTED,
          piece : pieceToMove,
          base,
          boardPieces,
          winResult
        })

        lastSelectedPiece = null

        if (winResult.win) {
          console.log('putting WON', winResult)
          yield put({
            type: GAME_WON,
            winResult
          })
          // TODO: reset board array - or wait for reset?
        }
      }
    }
}

export function* everything(action) {
    console.log('quarto Event generator skipping action type:${action.type}')
    // TODO: see if game_win state is already set by order of reducers... would be too easy
}

export default function* watchQuarto() {
  while (true) {
    console.log('quartoEventsGenerator waiting...')
    yield [
      takeEvery(BOARD_PIECE_PICKED, onBoardPiecePicked),
      takeEvery(BOARD_BASE_PICKED, onBoardBasePicked),
      takeEvery([PLAYERS_CHOSEN, START_GAME], onGameStart), // need to also listen for START_GAME for restarts...
      take('*', everything)
    ]
  }
}
