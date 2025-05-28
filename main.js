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
                view.eye = cameraPosition;
            } else {
                cameraPosition = penguinPosition;
                view.eye = penguinPosition;
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
    penguin: {
        src: 'assets/penguin/penguin.png',
        name: 'penguin'
    }
};

// light and camera variables

let lightPosition    = [2.0, 3.0, 3.0];
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

// game variables

let isThirdPerson = true;
let penguinPosition = [1.0, 0.0, 1.0];

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

    webgl.addModel(penguin);
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

    let penguinPosMatrix = new Matrix4();
    penguinPosMatrix.setTranslate(penguinPosition[0], penguinPosition[1], penguinPosition[2]);
    penguinPosMatrix.rotate(180, 0, 1, 0);

    penguin.setModelPosMatrix(penguinPosMatrix);

    webgl.draw();
    requestAnimationFrame(draw);
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
