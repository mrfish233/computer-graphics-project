
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
let mirror  = null;

let staticCubes = [];
let group1Cubes = [];
let group2Cubes = [];

// game variables

const CUBE_SIZE = [1.0, 1.0, 1.0];

let isThirdPerson = true;
let toggleViewTrigger = async () => {
    staticCubes = [];
    group1Cubes = [];
    group2Cubes = [];

    webgl.clearShapes();
    await initShapes();

    if (isThirdPerson) {
        return;
    }

    let group2Indices = [];

    if (mirrorZ == 4) {
        group2Indices = [0, 1];
    }
    else if (mirrorZ == 1) {
        group2Indices = [2, 3, 4];
    }

    for (let i = 0; i < group2Indices.length; i++) {
        let pos = group2CubesPos[group2Indices[i]];
        let cube = new Cube(CUBE_SIZE, textures['blue'].name);
        let posMatrix = new Matrix4();
        posMatrix.setTranslate(pos[0], pos[1], pos[2]);
        cube.setModelPosMatrix(posMatrix);
        group2Cubes.push(cube);
        webgl.addShape(cube);
    }
};

let staticCubesPos = [
    [-4.0, 0.0, 2.0],
    [-4.0, 0.0, 1.0],
    [-4.0, 0.0, -3.0],
    [-4.0, 0.0, -4.0],
];

let group1CubesPos = [
    [3.0, 0.0, 4],
    [3.0, 0.0, 3],
    [3.0, 0.0, 2],
    [3.0, 0.0, 0],
    [3.0, 0.0, -1],
    [3.0, 0.0, -2],
]

let group2CubesPos = [
    [-4.0, 0.0, 4],
    [-4.0, 0.0, 3],
    [-4.0, 0.0, 0],
    [-4.0, 0.0, -1],
    [-4.0, 0.0, -2],
]

let penguinPosition = [
    staticCubesPos[0][0],
    staticCubesPos[0][1] + 1.0,
    staticCubesPos[0][2]
];
let penguinFaceDir  = [0.0, 0.0, -1.0];
let penguinUpDir    = [0.0, 1.0, 0.0];
let penguinAngles   = [0.0, 0.0, 0.0]; // pitch, yaw, roll

let mirrorZ = 5;

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

    mirror = new Cube([0.1, 4.0, 1.8], textures['white'].name);
    webgl.addShape(mirror, [1, 0, 0]);
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

    for (let i = 0; i < group1CubesPos.length; i++) {
        let cube = new Cube(CUBE_SIZE, textures['blue'].name);
        let posMatrix = new Matrix4();
        posMatrix.setTranslate(group1CubesPos[i][0], group1CubesPos[i][1], group1CubesPos[i][2]);
        cube.setModelPosMatrix(posMatrix);

        group1Cubes.push(cube);
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

    mirrorZ = document.getElementById('mirror-z').value;
    let mirrorPos = new Matrix4();
    mirrorPos.translate(-0.6, 1, mirrorZ);
    mirror.setModelPosMatrix(mirrorPos);

    webgl.draw();
    requestAnimationFrame(draw);
}

function canMoveForward() {
    let nextPos = [
        penguinPosition[0] + penguinFaceDir[0],
        penguinPosition[1] + penguinFaceDir[1],
        penguinPosition[2] + penguinFaceDir[2]
    ];

    // check if next position has a cube below the penguin
    for (let i = 0; i < staticCubesPos.length; i++) {
        const x = staticCubesPos[i][0] + view.up[0];
        const y = staticCubesPos[i][1] + view.up[1];
        const z = staticCubesPos[i][2] + view.up[2];

        console.log("nextPos:", nextPos, "\npathCubesPos[i]:", staticCubesPos[i]);
        if (x - penguinMoveSpeed * 2 <= nextPos[0] && nextPos[0] <= x + penguinMoveSpeed * 2 &&
            y - penguinMoveSpeed * 2 <= nextPos[1] && nextPos[1] <= y + penguinMoveSpeed * 2 &&
            z - penguinMoveSpeed * 2 <= nextPos[2] && nextPos[2] <= z + penguinMoveSpeed * 2) {
            return true;
        }
    }

    for (let i = 0; i < group1Cubes.length; i++) {
        const block = group1Cubes[i].getPos();
        const x = parseFloat(block[0]) + view.up[0];
        const y = parseFloat(block[1]) + view.up[1];
        const z = parseFloat(block[2]) + view.up[2];

        console.log("nextPos:", nextPos, "\nblock: ", block, "\nxyz: ", x, y, z);
        if (x - penguinMoveSpeed * 2 <= nextPos[0] && nextPos[0] <= x + penguinMoveSpeed * 2 &&
            y - penguinMoveSpeed * 2 <= nextPos[1] && nextPos[1] <= y + penguinMoveSpeed * 2 &&
            z - penguinMoveSpeed * 2 <= nextPos[2] && nextPos[2] <= z + penguinMoveSpeed * 2) {
            return true;
        }
    }

    for (let i = 0; i < group2Cubes.length; i++) {
        const block = group2Cubes[i].getPos();
        const x = parseFloat(block[0]) + view.up[0];
        const y = parseFloat(block[1]) + view.up[1];
        const z = parseFloat(block[2]) + view.up[2];

        if (x - penguinMoveSpeed * 2 <= nextPos[0] && nextPos[0] <= x + penguinMoveSpeed * 2 &&
            y - penguinMoveSpeed * 2 <= nextPos[1] && nextPos[1] <= y + penguinMoveSpeed * 2 &&
            z - penguinMoveSpeed * 2 <= nextPos[2] && nextPos[2] <= z + penguinMoveSpeed * 2) {
            return true;
        }
    }

    return false;
}
