import React, {Component, PropTypes} from 'react'
import {Button, Panel} from 'react-bootstrap'
import classNames from 'classnames'
import { DirectionalLight, HemisphericLight, PointLight, Vector3, Color3, PhysicsEngine, OimoJSPlugin,
    StandardMaterial, Mesh, CubeTexture, ArcRotateCamera, Texture } from 'babylonjs'
import { Scene, registerHandler, removeHandler } from 'react-babylonjs'
import { Howl } from 'howler'

import classes from './Quarto.scss'

import Tutorial from './Tutorial'
import Player from './Player'
import Gameboard from './Gameboard'
import Piece from './Piece'
import Base from './Base'
import Timer from './Timer'

import PickIconImage from '../assets/pick_icon.png'
import PutIconImage from '../assets/put_icon.png'

import { START_GAME, PLAYER_PIECE_SELECTED, PLAYER_BASE_SELECTED, GAME_WON } from '../modules/quarto'

export default class Quarto extends Component {
    
  constructor(props) {
    super(props)

    // this.dispatch = createDispatcher((state) => {
    //   this.nextState = state
    //   window.requestAnimationFrame(this.handleNextState)
    // })    
    // this.dispatch = this.dispatch.bind(this)

    // own methods
    this.onPlayersChosen = this.onPlayersChosen.bind(this)
    this.onSceneMount = this.onSceneMount.bind(this)
    this.onMeshPicked = this.onMeshPicked.bind(this)
    this.onWinnerFound = this.onWinnerFound.bind(this)
    this.toggleDebug = this.toggleDebug.bind(this)

    this.initEnvironment = this.initEnvironment.bind(this)
    this.setupNewGame = this.setupNewGame.bind(this)
    this.selectedMesh = null

    console.log('Quarto props:', props)

    // reducer methods for notifying events in BabylonJs
    this.startGame = props.startGame
    this.playersChosen = props.playersChosen
    this.boardPiecePicked = props.boardPiecePicked
    this.boardBasePicked = props.boardBasePicked

    // BabylonJS actions
    console.log('debug methods', props.debugOn, props.debugOff, props)
    this.debugOn = props.debugOn
    this.debugOff = props.debugOff
    this.debugEnabled = false;

    this.sound = new Howl({
        src: ['sfx/boom1.wav']
    });
  }

  toggleDebug() {
      if (this.debugEnabled) {
          this.debugOff()
      } else {
          this.debugOn()
      }
      this.debugEnabled = !this.debugEnabled
  }

      // was 'forward' in QUARTO
  onPlayersChosen() {
      var name1 = this.player1.value || 'Player 1';
      var name2 = this.player2.value || 'Player 2';

      // console.log(`triggering redux: playersChosen(${name1}, ${name2})`)
      this.playersChosen(name1, name2)
  }

  onMeshPicked(mesh, scene) {
    // These are purely events happening on the board.  The reducer will decide if it is significant
    // and change the state accordingly.
    if (mesh instanceof Piece) {
        this.boardPiecePicked(mesh)
    }

    if (mesh instanceof Base) {
        this.boardBasePicked(mesh)
    }
  }

  onWinnerFound(winners) {
    let winningCodes = new Set()
    winners.forEach(winner => winningCodes.add(winner.code))

    // console.log('onWinnerFound', winners, winningCodes)

    this.pieces.forEach(piece => {
        if (winningCodes.has(piece.getCode())) {
            piece.setWinner();
        }
    })
    
    // Activate physics ;)  Pieces not on board get gravity.
    this.scene.enablePhysics(null, new OimoJSPlugin());

    this.board.setPhysicsState(PhysicsEngine.BoxImpostor, {
        mass: 0
    });

    var time = 0;

    OIMO.WORLD_SCALE = 10;
    OIMO.INV_SCALE = 1/10;

    this.pieces.forEach(p => {
        if (!p.isOnBoard) {
            var t = new Timer(time, this.scene, () => {
                p.setPhysicsState(PhysicsEngine.BoxImpostor, { mass: 1 });
            });
            t.start();
            time+=250;
        }
    });
  }

  setupNewGame() {
        this.board.reset();
        // Position pieces around board
        var alpha = Math.PI*1/16, r = 120;
        this.pieces.forEach(p => {
            var x = Math.cos(alpha)*r;
            var z = Math.sin(alpha)*r;
            p.setInitialPosition(new Vector3(x, p.size/2, z));
            alpha += Math.PI*2/16;

            // Reset piece
            p.reset();
        });
    
        // want to suspend pieces in mid-air until there is a winner.
        this.scene.disablePhysicsEngine();

  }

  onSceneMount(e) {
      const { canvas, scene, engine} = e
      this.scene = scene

      let lights = this.initEnvironment(canvas, scene)

      // Game
        this.board = new Gameboard(100, scene, lights);
        this.pieces = [];

        // Create pieces
        var count = 0;
        for (var i=0; i < this.board.LINE; i++) {
            for (var j=0; j < this.board.COL; j++) {
                var isTall, isBlack, isCubic, isSolidTop;
                isSolidTop = ((count & 1) == 1);
                isCubic = ((count & 2) == 2);
                isBlack = ((count & 4) == 4);
                isTall = ((count & 8) == 8);
                count ++;
                var p = new Piece(this.board.getBasePosition(i, j), isTall, isBlack, isCubic, isSolidTop, scene);
                
                this.pieces.push(p);  
                this.board.addShadowRender(p)
            }
        }

        this.setupNewGame()

        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });
  }

  initEnvironment(canvas, scene){
    // Update the scene background color
    scene.clearColor=new Color3(0.8,0.8,0.8)

    // Hemispheric light to light the scene (Hemispheric mimics sunlight)
    var light = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene)
    // light.intensity = 0.7;

    // this light generates shadows.
    var light2 = new PointLight("Omni", new Vector3(200, 400, 400), scene)
    light2.intensity = 0.5
    
    let lights = {
        main: light,
        point: light2
        //directional: dl
    }

    // Skydome with no images
    // var skybox = Mesh.CreateSphere("skyBox", 20, 2000, scene)
    // var shader = new BABYLON.ShaderMaterial("gradient", scene, "gradient", {})
    // shader.setFloat("offset", 200)
    // shader.setColor3("topColor", Color3.FromInts(0, 119, 255))
    // shader.setColor3("bottomColor", Color3.FromInts(240, 240, 255))
    // shader.backFaceCulling = false;
    // skybox.material = shader;

    // Skybox with images
    var skybox = Mesh.CreateBox("skyBox", 1000.0, scene);
    var skyboxMaterial = new StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new CubeTexture("skybox/TropicalSunnyDay", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // Camera attached to the canvas
    // Parameters : name, alpha, beta, radius, target, scene
    var camera = new ArcRotateCamera("Camera", 0, 1.05, 280, Vector3.Zero(), scene)
    //    camera.lowerAlphaLimit = -0.0001;
    //    camera.upperAlphaLimit = 0.0001;
    camera.lowerRadiusLimit = 150
    camera.upperRadiusLimit = 350
    camera.upperBetaLimit = Math.PI/2
    camera.attachControl(canvas)
    camera.maxZ = 2000 // Skydome

    return lights
  };

  componentDidMount () {
    let handlers = {
        [START_GAME]: (action) => {
            // console.log('START_GAME handler called in Quarto', action)
            this.setupNewGame()
            return true
        },
        [PLAYER_PIECE_SELECTED]: (action) => {
            // console.log('PLAYER_PIECE_SELECTED handler called in Quarto')
            // Unselect all pieces
            this.pieces.forEach(p => {
                p.setSelected(false);
            });
            // Set this Piece as selected (change colour)
            action.piece.setSelected(true, this.scene.getMaterialByID("sp"));
            return true
        },
        [PLAYER_BASE_SELECTED]: (action) => {
            let { piece, base } = action

            piece.setSelected(false);
            piece.putOnBoard(base, () => {
                // after animation completes
                this.sound.play()
            });

            return true
        },
        [GAME_WON]: (action) => {
            let { winResult } = action
            
            this.onWinnerFound(winResult.winners)
            return true
        }
    }

    this.actionHandler = (action) => {
        let handler = handlers[action.type]
        if (handler == undefined) {
            console.log(`no handler defined in babylonJS scene for ${action.type}`)
        } else {
            return handler(action)
        }
    }

    registerHandler(this.actionHandler)
  }

  componentWillUnmount() {
      this.scene = null
    removeHandler(this.actionHandler)
  }

  render() {
 
    const { quartoState, startGame } = this.props

    console.log('quarto gameState', quartoState)
    console.log('quarto classes', classes)

    return (
      <div>
        <Panel>          
          <div className={classNames({
            'loginWrapper': true,
            'loginWrapperShown': quartoState.playersChosen !== true,
            'loginWrapperHidden': quartoState.playersChosen === true,
          })}>
            <div className="login">
                <h1>QUARTO</h1>

                <div className="form">
                    <input type="text" placeholder="Player 1 name" ref={c => this.player1 = c} />
                    <input type="text" placeholder="Player 2 name" ref={c => this.player2 = c} />
                    <input type="submit" value="PLAY !" onClick={this.onPlayersChosen} />
                </div>
            </div>
          </div>

          <div id="game">
              <div className={classNames({
                'player': true,
                'player1' : true,
                'playerShown': quartoState.playersChosen === true,
                'playerHidden': quartoState.playersChosen !== true,
                'activePlayer': quartoState.player === 1
              })}>
                  <div className="playerName">{quartoState.player1Name}</div>
                  <div className="actions" id="actionLeft">
                      <img id="p1Put" className={classNames({
                        'action': true,
                        'currentAction': (quartoState.player === 1 && quartoState.playerPickBase)})
                      } src={PutIconImage} />
                      <img id="p1Pick" className={classNames({
                        'action': true,
                        'currentAction': (quartoState.player === 1 && quartoState.playerPickPiece)})
                      } src={PickIconImage} />
                  </div>
              </div>
              
              
              <div className={classNames({
                'player': true,
                'player2' : true,
                'playerShown': quartoState.playersChosen === true,
                'playerHidden': quartoState.playersChosen !== true,
                'activePlayer': quartoState.player === 2
              })}>
                  <div className="playerName">{quartoState.player2Name}</div>
                  <div className="actions" id="actionRight">
                      <img id="p2Put" className={classNames({
                        'action': true,
                        'currentAction': (quartoState.player === 2 && quartoState.playerPickBase)
                      })} src={PutIconImage} />
                      <img id="p2Pick" className={classNames({
                        'action': true,
                        'currentAction': (quartoState.player === 2 && quartoState.playerPickPiece)
                      })} src={PickIconImage} />
                  </div>
              </div>
              
              {quartoState.playersChosen &&
                <div>
                    Player  {quartoState.player} choosing {(quartoState.playerPickPiece ? 'piece' : '')}{(quartoState.playerPickBase ? 'base' : '')}
                </div>
              }
              <Scene
                quartoState={quartoState}
                onSceneMount={this.onSceneMount} 
                onMeshPicked={this.onMeshPicked}
                shadersRepository={'/shaders/'}
                visible={quartoState.started === true} />
              <div id="title">
                  <div id="titleText">
                      QUARTO                
                  </div>
              </div>
          </div>

          <div className={classNames({
                'win': true,
                'winShown': quartoState.won === true,
                'winHidden': quartoState.won !== true
              })}>
              <h1>QUARTO</h1>
              <span className="winnerName">
                  {quartoState.player === 1 ? quartoState.player1Name : quartoState.player2Name}
              </span>
              <span className="winText">
                  WON !!
              </span>

              <div className="replayButton" onClick={this.startGame}>
                  New game ?
              </div>
          </div>

          {false &&
            <div className="startingTutorial">
                <h1>QUARTO</h1>
                <p>
                    Do you know how to play ?
                </p>
                <table style={{width:'80%', margin:'50px auto'}}>
                    <tbody>
                        <tr>
                            <td className="tutoButton" id="startingTutorialYes">YES</td>
                            <td className="tutoButton" id="startingTutorialNo">NO</td>
                        </tr>
                    </tbody>
                </table>
            </div>
          }

          <div id="tutorial">
              <h3>RULES</h3>
          </div>

          <div className="tutorial" id="step1">
              <div>
                  In Quarto, there are 16 unique pieces, each of which is either:
                  <ul>
                      <li>Tall or short</li>
                      <li>Black or white</li>
                      <li>Square or circular</li>
                      <li>Hollow-top or solid-top</li>
                  </ul>
              </div>

              <table style={{width:'80%', margin:'30px auto'}}>
              <tbody>
                  <tr>
                      <td className="tutoButton deactivate"> &lt; Prev</td>
                      <td className="tutoButton" id="toStep2">Next &gt; </td>
                  </tr>
              </tbody>
              </table>
          </div>

          <div className="tutorial tutorialBig" id="step2">
              <p>
                  A player wins by doing a <span className="quarto">QUARTO</span>. <br/><br/>
                  A <span className="quarto">QUARTO</span> can be done by placing on the board four pieces with a common attribute in a line or in a row.<br/><br/>
                  In this example, these 4 pieces have a hollow-top: it's a <span className="quarto">QUARTO</span>!
              </p>

              <table style={{width:'80%', margin:'50px auto'}}>
              <tbody>
                  <tr>
                      <td className="tutoButton" id="backStep1"> &lt; Prev</td>
                      <td className="tutoButton" id="toStep3">Next &gt; </td>
                  </tr>
              </tbody>
              </table>
          </div>


          <div className="tutorial tutorialBig" id="step3">
              <p>
                  At the beginning of his turn, a player places on the board the piece selected by his opponent. <br/><br/>
                  If a <span className="quarto">QUARTO</span> is done, the current player won. If not, he selects a piece for his opponent, and his turn is over.<br/><br/>
                  The first player to do a <span className="quarto">QUARTO</span> wins the game!
              </p>

              <table style={{width:'80%', margin:'40px auto'}}>
              <tbody>
                  <tr>
                      <td className="tutoButton" id="backStep2"> &lt; Prev</td>
                      <td className="tutoButton" id="finish">Finish </td>
                  </tr>
              </tbody>
              </table>
          </div>
        </Panel>
        <Button onClick={this.toggleDebug}>show/hide debug window</Button>
      </div>
    )
  }
}
