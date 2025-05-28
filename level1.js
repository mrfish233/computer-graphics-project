// light and camera variables

let lightPosition    = [3.0, 3.0, 3.0];
let cameraPosition   = [4.0, 4.0, 4.0];
let lightCoefficient = {
    ambient: 0.3, diffuse: 1.2, specular: 0.9, shininess: 30
};

let perspective = {
    fov: 90, aspect: 1, near: 1, far: 100
};
let view = {
    eye: cameraPosition,
    at:  [0.0, 0.0, 0.0],
    up:  [0.0, 1.0, 0.0]
};

// shapes

let envcube = null;
let penguin = null;

let staticCubes = [];

// game variables

const CUBE_SIZE = [1.0, 1.0, 1.0];

let isThirdPerson = true;

let staticCubesPos = [
    [1.0, 0.0, 1.0],
    [1.0, 0.0, 0.0],
    [1.0, 0.0, -1.0],
    [1.0, 0.0, -2.0],
    [1.0, 0.0, -3.0],
];

let penguinPosition = [
    staticCubesPos[0][0],
    staticCubesPos[0][1] + 1.0,
    staticCubesPos[0][2]
];
let penguinFaceDir  = [0.0, 0.0, -1.0];
let penguinUpDir    = [0.0, 1.0, 0.0];
let penguinAngles   = [0.0, 0.0, 0.0]; // pitch, yaw, roll

// animation variables

let penguinMoveSpeed = 0.05;
let penguinMoveDist = 0.0;

async function main() {
    const canvasDiv = document.getElementsByClassName('cv');
    webgl = new WebGL(canvasDiv, WIDTH, HEIGHT);
    await webgl.init();

    initTextures();
    initEnvCube();
    await initShapes();

    keyboardController(keyControl);
    mouseController(webgl.canvas, mouseControl);

    draw();
}

async function initShapes() {
    penguin = new Model('assets/penguin/penguin.obj', [textures['penguin'].name]);
    await penguin.init();

    webgl.addModel(penguin);

    for (let i = 0; i < staticCubesPos.length; i++) {
        let tex = i === 0 ? textures['green'] : (i === staticCubesPos.length - 1 ? textures['yellow'] : textures['white']);

        let cube = new Cube(CUBE_SIZE, tex.name);

        let posMatrix = new Matrix4();
        posMatrix.setTranslate(staticCubesPos[i][0], staticCubesPos[i][1], staticCubesPos[i][2]);
        cube.setModelPosMatrix(posMatrix);

        staticCubes.push(cube);
        webgl.addShape(cube);
    }
}

function draw() {
    if (texture_count < Object.keys(textures).length) {
        requestAnimationFrame(draw);
        return;
    }

    webgl.setLight(lightPosition, lightCoefficient);
    webgl.setCamera(cameraPosition);
    webgl.setPerspectiveView(perspective, view);

    angleX = reangle(angleX);
    angleY = reangle(angleY);

    updatePenguinPosition();

    let penguinBaseMatrix = new Matrix4();
    penguinBaseMatrix.translate(0.0, -0.4, 0.0);

    let penguinPosMatrix = new Matrix4();
    penguinPosMatrix.scale(0.95, 0.95, 0.95);
    penguinPosMatrix.translate(penguinPosition[0], penguinPosition[1], penguinPosition[2]);
    penguinPosMatrix.rotate(180, 0, 1, 0);

    penguinPosMatrix.rotate(penguinAngles[0], 1, 0, 0); // pitch
    penguinPosMatrix.rotate(penguinAngles[1], 0, 1, 0); // yaw
    penguinPosMatrix.rotate(penguinAngles[2], 0, 0, 1); // roll

    penguin.setModelMatrices(penguinBaseMatrix, penguinPosMatrix);

    webgl.draw();
    requestAnimationFrame(draw);
}
