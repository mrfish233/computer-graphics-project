// WebGL variables

let webgl  = null;
let WIDTH  = 600;
let HEIGHT = 600;

// mouse variables

let mouseLastX = 0;
let mouseDrag  = false;

let angleX = 0;
let angleY = 0;
let canReangle = true;

let mouseControl = {
    down: (event) => {
        let x = event.clientX;
        let y = event.clientY;
        let rect = event.target.getBoundingClientRect();

        if (rect.left <= x && x <= rect.right &&
            rect.top  <= y && y <= rect.bottom) {
            mouseDrag  = true;
            canReangle = false;
        }
    },
    up: () => {
        mouseDrag  = false;
        canReangle = true;
    },
    move: (event) => {
        if (mouseDrag) {
            let factor = 100 / HEIGHT;
            angleX = (angleX + (event.clientX - mouseLastX) * factor + 360) % 360;
            angleY = (angleY + (event.clientY - mouseLastY) * factor + 360) % 360;
        }
        mouseLastX = event.clientX;
        mouseLastY = event.clientY;
    },
    wheel: (event) => {
        if (event.deltaY > 0) {
            cameraPosition[0] += 0.1;
            cameraPosition[1] += 0.1;
            cameraPosition[2] += 0.1;
        }
        else {
            cameraPosition[0] -= 0.1;
            cameraPosition[1] -= 0.1;
            cameraPosition[2] -= 0.1;
        }
    }
};

// keyboard variables
let keyControl = {
    ' ': {
        callback: () => {
            isThirdPerson = !isThirdPerson;
            if (isThirdPerson) {
                cameraPosition = [4.0, 4.0, 4.0];
                view = {
                    eye: cameraPosition,
                    at:  [0.0, 0.0, 0.0],
                    up:  [0.0, 1.0, 0.0]
                };
            } else {
                cameraPosition = [
                    penguinPosition[0],
                    penguinPosition[1] + 0.5,
                    penguinPosition[2]
                ];
                view = {
                    eye: [
                        penguinPosition[0],
                        penguinPosition[1] + 0.5,
                        penguinPosition[2]
                    ],
                    at:  [
                        penguinPosition[0] + penguinFaceDir[0],
                        penguinPosition[1] + penguinFaceDir[1] + 0.5,
                        penguinPosition[2] + penguinFaceDir[2]
                    ],
                    up: penguinUpDir
                };
            }
        },
        interval: 0
    },
    'w': {
        callback: () => {
            if (isThirdPerson) {
                return;
            }

            if (canMoveForward() && penguinMoveDist <= 0.0) {
                console.log('Moving forward');
                penguinMoveDist += 1;
            }
        },
        interval: 0
    },
    'a': {
        callback: () => {
            if (isThirdPerson) {
                return;
            }

            
        },
        interval: 0
    },
};

// texture variables

let texture_count = 0;
let textures = {
    white: {
        src: 'assets/white.png',
        name: 'white',
    },
    blue:  {
        src: 'assets/blue.png',
        name: 'blue',
    },
    yellow: {
        src: 'assets/yellow.png',
        name: 'yellow',
    },
    green: {
        src: 'assets/green.png',
        name: 'green',
    },
    penguin: {
        src: 'assets/penguin/penguin.png',
        name: 'penguin'
    }
};

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

let startCube = null;
let endCube   = null;
let pathCubes = [];

// game variables

const CUBE_SIZE = [1.0, 1.0, 1.0];

let isThirdPerson = true;

let penguinPosition = [1.0, 1.0, 1.0];
let penguinFaceDir  = [0.0, 0.0, -1.0];
let penguinUpDir    = [0.0, 1.0, 0.0];

let startCubePos = [1.0, 0.0, 1.0];
let endCubePos   = [1.0, 0.0, -4.0];
let pathCubesPos = [
    [1.0, 0.0, 1.0],    // start
    [1.0, 0.0, 0.0],
    [1.0, 0.0, -1.0],
    [1.0, 0.0, -2.0],
    [1.0, 0.0, -3.0],
    [1.0, 0.0, -4.0]    // end
];

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

function initTextures() {
    for (let tex in textures) {
        let img = new Image();
        img.src = textures[tex].src;
        img.onload = () => {
            webgl.addTexture(img, textures[tex].name);
            texture_count++;
        }
    }
}

function initEnvCube() {
    const quad = new Float32Array([
        -1, -1, 1,  1, -1, 1,
        -1,  1, 1, -1,  1, 1,
        1,  -1, 1,  1,  1, 1
    ]);

    envcube = new Shape();
    envcube.setVertices(quad, quad, quad);

    const images = [
        'assets/environment/posx.jpg',
        'assets/environment/negx.jpg',
        'assets/environment/negy.jpg',
        'assets/environment/posy.jpg',
        'assets/environment/posz.jpg',
        'assets/environment/negz.jpg'
    ];

    webgl.addEnvironmentCube(envcube, images, 2048, 2048);
}

async function initShapes() {
    penguin = new Model('assets/penguin/penguin.obj', [textures['penguin'].name]);
    await penguin.init();

    startCube = new Cube(CUBE_SIZE, textures['green'].name);
    endCube   = new Cube(CUBE_SIZE, textures['yellow'].name);

    webgl.addModel(penguin);
    webgl.addShape(startCube);
    webgl.addShape(endCube);

    // skip the first and last cube
    for (let i = 1; i < pathCubesPos.length - 1; i++) {
        let cube = new Cube(CUBE_SIZE, textures['white'].name);

        let posMatrix = new Matrix4();
        posMatrix.setTranslate(pathCubesPos[i][0], pathCubesPos[i][1], pathCubesPos[i][2]);
        cube.setModelPosMatrix(posMatrix);

        pathCubes.push(cube);
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

    penguin.setModelMatrices(penguinBaseMatrix, penguinPosMatrix);

    drawFixed();
    webgl.draw();
    requestAnimationFrame(draw);
}

function drawFixed() {
    let startCubePosMatrix = new Matrix4();
    startCubePosMatrix.setTranslate(startCubePos[0], startCubePos[1], startCubePos[2]);

    let endCubePosMatrix = new Matrix4();
    endCubePosMatrix.setTranslate(endCubePos[0], endCubePos[1], endCubePos[2]);

    startCube.setModelPosMatrix(startCubePosMatrix);
    endCube.setModelPosMatrix(endCubePosMatrix);
}

function canMoveForward() {
    let nextPos = [
        penguinPosition[0] + penguinFaceDir[0],
        penguinPosition[1] + penguinFaceDir[1],
        penguinPosition[2] + penguinFaceDir[2]
    ];

    // check if next position has a cube below the penguin
    for (let i = 0; i < pathCubesPos.length; i++) {
        const x = pathCubesPos[i][0] + view.up[0];
        const y = pathCubesPos[i][1] + view.up[1];
        const z = pathCubesPos[i][2] + view.up[2];

        if (x - penguinMoveSpeed * 2 <= nextPos[0] && nextPos[0] <= x + penguinMoveSpeed * 2 &&
            y - penguinMoveSpeed * 2 <= nextPos[1] && nextPos[1] <= y + penguinMoveSpeed * 2 &&
            z - penguinMoveSpeed * 2 <= nextPos[2] && nextPos[2] <= z + penguinMoveSpeed * 2) {
            console.log("nextPos:", nextPos, "\npathCubesPos[i]:", pathCubesPos[i]);
            return true;
        }
    }

    return false;
}

function updatePenguinPosition() {
    if (penguinMoveDist > 0.0) {
        penguinMoveDist -= penguinMoveSpeed;

        if (penguinMoveDist < 0.0) {
            penguinMoveDist = 0.0;
        }

        penguinPosition[0] += penguinFaceDir[0] * penguinMoveSpeed;
        penguinPosition[1] += penguinFaceDir[1] * penguinMoveSpeed;
        penguinPosition[2] += penguinFaceDir[2] * penguinMoveSpeed;

        view.eye = [
            penguinPosition[0],
            penguinPosition[1] + 0.5,
            penguinPosition[2]
        ];
        view.at = [
            penguinPosition[0] + penguinFaceDir[0],
            penguinPosition[1] + penguinFaceDir[1] + 0.5,
            penguinPosition[2] + penguinFaceDir[2]
        ];
    }
}

function reangle(angle) {
    if (!canReangle) {
        return angle;
    }

    let step = 1;
    let angles = [0, 90, 180, 270];

    for (let i = 0; i < angles.length; i++) {
        if (Math.abs((angle % 360) - angles[i]) < step * 2) {
            return angles[i];
        }
    }

    if ((45  <= angle && angle < 90)  || (135 <= angle && angle < 180) ||
        (225 <= angle && angle < 270) || (315 <= angle && angle < 360)) {
        return angle + step;
    }
    else {
        return angle - step;
    }
}
