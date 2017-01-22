import { Mesh, Vector3, Color3, CSG, StandardMaterial, Animation } from 'babylonjs'

import Timer from './Timer'

export default class Piece extends Mesh {

  constructor (position, isTall, isBlack, isCubic, isSolidTop, scene) {
    super('piece', scene)
    this.scene = scene

    const size = isTall ? this.TALL_SIZE : this.SMALL_SIZE
    const color = isBlack ? this.BLACK_COLOR : this.WHITE_COLOR
    let meshTemplate
    let mesh

    if (isCubic) {
      // Create box
      meshTemplate = Mesh.CreateBox('box', 1, scene)
      meshTemplate.scaling = new Vector3(this.SCALING, size, this.SCALING)
      this.scaling = new Vector3(this.SCALING, size, this.SCALING)
    } else {
      meshTemplate = Mesh.CreateCylinder('cylinder', size, this.SCALING, this.SCALING, 50, scene)
    }

    if (!isSolidTop) {
      var toRemoveOnTop = Mesh.CreateSphere('toRemove', 10, this.SCALING / 1.5, scene)
      toRemoveOnTop.position.y = size / 2
      var toRemove = CSG.FromMesh(toRemoveOnTop)
      var piece = CSG.FromMesh(meshTemplate)
      var res = piece.subtract(toRemove)

      mesh = res.toMesh('piece', null, scene)

      toRemoveOnTop.dispose()
    } else {
      mesh = meshTemplate.clone()
    }

    var g = mesh._geometry
    g.applyToMesh(this)
    mesh.dispose()
    meshTemplate.dispose()

    var m = new StandardMaterial('m', scene)
    m.diffuseColor = color
    m.emmissiveColor = color
    m.specularColor = color
    this.material = m
    this.oldMaterial = m

    this.position = position.clone()
    this.position.y = size / 2

    this.isTall = isTall
    this.isBlack = isBlack
    this.isCubic = isCubic
    this.isSolidTop = isSolidTop
    this.isSelected = false
    this.isOnBoard = false
    this.initialPosition = null
    this.size = size

    // this.actionManager = new ActionManager(scene);
    // this.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOutTrigger, this.material, "emissiveColor", this.material.emissiveColor));
    // this.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, this.material, "emissiveColor", Color3.FromInts(30, 30, 30)));
    this.shake = this.shake.bind(this) // TODO: move this to the actual game, since this logic does not belong here.
    this.randomNumber = this.randomNumber.bind(this)
  };

  get TALL_SIZE () { return 20 }
  get SMALL_SIZE () { return this.TALL_SIZE / 2 }
  get SCALING () { return 10 }

  get BLACK_COLOR () { return Color3.FromInts(72, 73, 74) }
  get WHITE_COLOR () { return Color3.FromInts(245, 245, 245) }

  /**
   * Select or unselect this piece.
   * @param isSelected
   * @param material The material when this piece is selected
   */
  setSelected (isSelected, material) {
    this.isSelected = isSelected

    if (this.isSelected) {
      this.oldMaterial = this.material
      this.material = material
    } else {
      this.material = this.oldMaterial
    }
  };

  setInitialPosition (pos) {
    this.position = pos.clone()
    this.initialPosition = pos.clone()
  };

  putOnBoard (base, callback) {
    var dst = base.getAbsolutePosition()

    this.animate(dst, callback)

    base.setPiece(this)

    this.isOnBoard = true
  }

  // uses bit flags to find rows/cols with for winner.
  getCode () {
    var code = 0
    if (this.isSolidTop) {
      code += 1
    }
    if (this.isCubic) {
      code += 2
    }
    if (this.isBlack) {
      code += 4
    }
    if (this.isTall) {
      code += 8
    }
    return code
  }

  randomNumber (min, max) {
    if (min === max) {
      return (min)
    }
    var random = Math.random()
    return ((random * (max - min)) + min)
  }

  animate (dst, callback) {
    var oldY = this.position.y

    var _this = this

    // Animation from top to board
    var goDown = function () {
      var t = new Timer(250, _this.scene, function () {
        var translationToBot = new Animation(
          'translationToBot',
          'position',
          60,
          Animation.ANIMATIONTYPE_VECTOR3,
          Animation.ANIMATIONLOOPMODE_CONSTANT
        )

        var startPos = _this.position.clone()
        var endPos = dst.clone()
        endPos.y = oldY
        // Animation keys
        var keys = [
          {
            frame:0,
            value:startPos
          },
          {
            frame:100,
            value:endPos
          }
        ]
        translationToBot.setKeys(keys)
        _this.animations.push(translationToBot)
        _this.scene.beginAnimation(_this, 0, 100, false, 20, function () {
          _this.shake()
          callback()
        })
      })
      t.start()
    }

    // Animation to top
    var translationToTop = new Animation(
      'translationToTop',
      'position',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    )

    var startPos = this.position.clone()
    var endPos = dst.clone()
    endPos.y = 50
    // Animation keys
    var keys = [
      {
        frame:0,
        value:startPos
      },
      {
        frame:100,
        value:endPos
      }
    ]
    translationToTop.setKeys(keys)
    this.animations.push(translationToTop)
    _this.scene.beginAnimation(this, 0, 100, false, 10, goDown)
  }

  shake (value) {
    var shakeValue = value || 10
    let oldTarget = this.scene.activeCamera.target
    let min = -0.5
    let max = -min

    let _this = this

    this.scene.registerBeforeRender(function () {
      if (shakeValue > 0) {
        let dx = _this.randomNumber(min, max)
        let dy = _this.randomNumber(min, max)
        let dz = _this.randomNumber(min, max)
        var target = _this.scene.activeCamera.target
        var newTarget = target.add(new Vector3(dx, dy, dz))
        _this.scene.activeCamera.target = newTarget
        shakeValue--
        if (shakeValue === 0) {
          _this.scene.activeCamera.target = oldTarget
        }
      }
    })
  }

  /**
   * Reset the piece to its initial state
   */
  reset () {
    this.isSelected = false
    this.isOnBoard = false
    this.position.x = this.initialPosition.x
    this.position.y = this.initialPosition.y
    this.position.z = this.initialPosition.z
    this.resetWinner()
  }

  setWinner () {
    this.material.diffuseColor = Color3.FromInts(161, 152, 191)
  }

  resetWinner () {
    if (this.isBlack) {
      this.material.diffuseColor = this.BLACK_COLOR
    } else {
      this.material.diffuseColor = this.WHITE_COLOR
    }
  }
}
