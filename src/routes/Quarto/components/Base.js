import { Mesh, StandardMaterial, Color3, VertexData, ActionManager, SetValueAction } from 'babylonjs'

export default class Base extends Mesh {

  constructor (name, size, position, scene, line, col) {
    super(name, scene)

    var baseMat = new StandardMaterial('baseMat', scene)
    baseMat.diffuseColor = Color3.FromInts(187, 173, 171)
    // baseMat.specularColor = Color3.Black();

    // breaking change in 2.0 CreateCylinder only takes options:
    // 1.13 signature: height, diameterTop, diameterBottom, tessellation, subdivisions
    // { height: number, diameterTop: number, diameterBottom: number, diameter: number, tessellation: number, subdivisions: number,
    //   arc: number, faceColors: Color4[], faceUV: Vector4[], hasRings: boolean, enclose: boolean, sideOrientation: number }
    var data = VertexData.CreateCylinder({
      height: 2,
      diameterTop: size,
      diameterBottom: size,
      tessellation: 60,
      subdivisions: scene
    })

    data.applyToMesh(this, false)
    data.receiveShadows = true
    this.position = position
    this.material = baseMat
    this.receiveShadows = true

    this.line = line
    this.col = col

    this.actionManager = new ActionManager(scene)
    this.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOutTrigger, this.material, 'emissiveColor', this.material.emissiveColor))
    this.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, this.material, 'emissiveColor', Color3.FromInts(20, 20, 20)))

    this.piece = null
  }

  /**
   * Update the base color to the player color
   * @param player
   */
  setToPlayer = function (player) {
    this.material.diffuseColor = player.color
  };

  /**
   * Reset the base to its initial state
   */
  reset = function () {
    this.piece = null
  };

  setPiece = function (p) {
    this.piece = p
  }
}
