import watchQuarto from './quartoGameLogic'

import { fork } from 'redux-saga/effects'

export default function* root() {
  yield [
    fork(watchQuarto)
    //fork(watchDemoEvents), // ie: hide/show debug layer
  ]
}
