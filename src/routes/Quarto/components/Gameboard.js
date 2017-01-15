import { Mesh, ShadowGenerator, Vector3, Color3, StandardMaterial } from 'babylonjs'
import Base from './Base'

/**
 * The quarto gameboard
 * @param size
 * @param scene
 * @constructor
 */

export default class Gameboard extends Mesh {
    
    constructor (size, scene, lights) {
        // Mesh.call(this, "ground", scene);
        super("ground", scene)

        this.position = Vector3.Zero();

        this.bases = [];

        let shadowGenerator = new ShadowGenerator(1024 /* size of shadow map */, lights.point)
        shadowGenerator.usePoissonSampling = true // useBlurVarianceShadowMap
        shadowGenerator.setDarkness(0.2)

        this.shadows = shadowGenerator

        var space = 1;
        var baseSize = size / 4;
        var baseRadius = baseSize /2;

        // Children
        for (var l=0; l< this.LINE; l++) {
            // create a cylinder
            var col = [];
            for (var c=0; c< this.COL; c++) {

                var position = new Vector3(c*baseSize-size/2+baseRadius, 0, l*baseSize+(size/2)*(1-l)-baseRadius);
                var b = new Base("base"+l+"-"+c, baseSize-space, position, scene, l, c);
                b.parent = this;
                
                col.push(b);
            }
            this.bases.push(col);
        }

        //console.log(`bases created ${this.LINE} x ${this.COL}`)

        var objSize = 1.5 * size
        var obj = Mesh.CreateBox("obj", objSize, scene)
        obj.rotation.y = Math.PI/4
        obj.scaling.y = 0.04
        obj.position.y = -objSize*0.04/2
        obj.receiveShadows = true
        obj.parent = this
                
        var objMat = new StandardMaterial("objmat", scene);
        //objMat.diffuseTexture = new BABYLON.Texture("img/board_1024.jpg", scene);
        objMat.diffuseColor = Color3.FromInts(100, 100, 100);
        objMat.specularColor = Color3.Black() // so not blinded by reflection
        obj.material = objMat;

        // Create a material for selected pieces
        var sp = new StandardMaterial("sp", scene);
        sp.diffuseColor = Color3.FromInts(241, 216, 39);
        // sp.specularColor = Color3.FromInts(241, 216, 39);
        //sp.specularPower = 1.0
        this.selectedPieceMaterial = sp;
    };

    get LINE() { return 4 };
    get COL() { return 4 };

    addShadowRender = function(mesh) {
        this.shadows.getShadowMap().renderList.push(mesh)
    }

    getBasePosition = function(i, j) {
        return this.bases[i][j].getAbsolutePosition();
    };

    getBase = function(i, j) {
        return this.bases[i][j];
    };

    /**
     * Reset the gameboard
     */
    reset = function() {
        this.bases.forEach(function(array) {
            array.forEach(function(b) {
                b.reset();
            });
        });
    };

}