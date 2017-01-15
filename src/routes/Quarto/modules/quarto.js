// ------------------------------------
// Constants
// ------------------------------------

// done when a game starts or is (re)started.
// scene will run init={function}, if it's the first game.
export const START_GAME = 'START_GAME'
// this will probably trigger the first 'start_game' for now...
// todo: possibly change to PLAYER_NAMES_SELECTED and use PLAYERS_CHOSEN as an event?  can use as spinner while game is starting....
export const PLAYERS_CHOSEN = 'PLAYERS_CHOSEN'

export const BOARD_PIECE_PICKED = 'BOARD_PIECE_PICKED'
export const BOARD_BASE_PICKED = 'BOARD_BASE_PICKED'

// events that have occured (hence past tense here).
export const GAME_STARTED = 'GAME_STARTED'
export const PLAYER_PIECE_SELECTED = 'PLAYER_PIECE_SELECTED'
export const PLAYER_BASE_SELECTED = 'PLAYER_BASE_SELECTED'
export const GAME_WON = 'GAME_WON'

// ------------------------------------
// Actions
// ------------------------------------
export const startGame = () => ({ type: START_GAME})

export const boardPiecePicked = (piece) => ({
  type: BOARD_PIECE_PICKED,
  piece
})

export const boardBasePicked = (base) => ({
  type: BOARD_BASE_PICKED,
  base
})

export const playersChosen = (player1Name, player2Name) => ({
  type: PLAYERS_CHOSEN,
  player1Name,
  player2Name
})

export const actions = {
  startGame,
  playersChosen,
  boardPiecePicked,
  boardBasePicked
}

export const events = {
  PLAYER_PIECE_SELECTED,
  PLAYER_BASE_SELECTED,
  GAME_WON
}
// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [START_GAME]: (state, action) => {
    console.log('game start', action)

    let newState = {...state,
      started: true,
      won: false,
      player: 1,
      playerPickPiece: true,
      playerPickSquare: false
    }

    console.log('game started', newState)

    return newState
  },
  [PLAYERS_CHOSEN]: (state, action) => {
    let newState = {
      ...state,
      player1Name: action.player1Name,
      player2Name: action.player2Name,
      playersChosen: true, 
      // next 4 mimic a 'start_game'
      started: true,
      player: 1,
      playerPickPiece: true,
      playerPickBase: false
    }
    
    console.log('players chosen', newState)

    return newState
  },
  [PLAYER_PIECE_SELECTED]: (state, action) => {
    const { piece } = action

    // player changes.
    let newState = {...state,
      playerPickPiece: false,
      playerPickBase: true,
      player: ((state.player % 2) + 1)
    }

    console.log(`player ${state.player} selected piece`, newState, piece)

    return newState
  },
  [PLAYER_BASE_SELECTED]: (state, action) => {
    const { base, boardPieces, winResult } = action

    if (winResult.win) {
      // TODO: set winner name, it will be shown in React.
      console.log(`player ${state.player} won`, newState, action.base)
      return {...state,
        won: true,
        boardPieces: boardPieces
      }
    }

    let newState = {...state,
      playerPickPiece: true,
      playerPickBase: false,
      boardPieces
    }

    console.log(`player ${state.player} selected base`, newState, action.base)

    return newState
  }
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {  
  started: false,
  playersChosen: false,
  player1Name: undefined,
  player2Name: undefined,
  won: false
}

let lastState = initialState

export default function quartoReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
