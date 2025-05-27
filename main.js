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
            perspective.fov += 1;
        }
        else {
            perspective.fov -= 1;
        }
    }
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
    soccer: {
        src: 'assets/soccer/soccer.jpg',
        name: 'soccer'
    }
};

// light and camera variables

let lightPosition    = [1.0, 3.0, 3.0];
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

let cube1 = null;
let cube2 = null;
let cube3 = null;
let soccer = null;
let mirror = null;

async function main() {
    const canvasDiv = document.getElementsByClassName('cv');
    webgl = new WebGL(canvasDiv, WIDTH, HEIGHT);
    await webgl.init();

    initTextures();
    await initShapes();
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

async function initShapes() {
    cube1 = new Cube([1.0, 1.0, 3.0], textures['blue'].name);
    cube2 = new Cube([3.0, 1.0, 1.0], textures['white'].name);
    cube3 = new Cube([1.0, 1.0, 1.0], textures['blue'].name);
    soccer = new Model('assets/soccer/soccer.obj', [textures['soccer'].name]);
    await soccer.init();

    mirror = new Cube([0.1, 8, 8], textures['white'].name);
    // mirror = new Cube([8, 8, 0.1], textures['white'].name);

    webgl.addShape(cube1);
    webgl.addShape(cube2);
    webgl.addShape(cube3);
    webgl.addModel(soccer);
    // webgl.addShape(mirror, [0, 0, 1]);
    webgl.addShape(mirror, [1, 0, 0]);
}

function draw() {
    if (texture_count < Object.keys(textures).length) {
        requestAnimationFrame(draw);
        return;
    }

    let modelViewMatrix = new Matrix4();
    modelViewMatrix.translate(2, 0, 0);
    // modelViewMatrix.rotate(angleX, 0, 1, 0);
    // modelViewMatrix.rotate(angleY, 1, 0, 0);

    webgl.setLight(lightPosition, lightCoefficient);
    webgl.setCamera(cameraPosition);
    webgl.setPerspectiveView(perspective, view);

    angleX = reangle(angleX);
    angleY = reangle(angleY);

    let cube1Pos = new Matrix4();
    cube1Pos.translate(0, 0, -2);
    cube1Pos.rotate(angleX, 0, 1, 0);

    cube1.setModelMatrices(modelViewMatrix, cube1Pos, null);

    let cube2Pos = new Matrix4();
    cube2Pos.translate(0, 0, 2);
    cube2Pos.rotate(angleX, 0, 1, 0);

    cube2.setModelMatrices(modelViewMatrix, cube2Pos, null);

    cube3.setModelMatrices(modelViewMatrix, null, null);

    let soccerPos = new Matrix4();
    soccerPos.translate(0, 0.86, 0);
    soccerPos.scale(3.0, 3.0, 3.0);

    soccer.setModelMatrices(modelViewMatrix, soccerPos, null);

    let mirrorZ   = parseFloat(document.getElementById('mirrorZ').value) / 100.0;
    let mirrorPos = new Matrix4();
    mirrorPos.translate(-0.1, 0, mirrorZ);

    mirror.setModelPosMatrix(mirrorPos);

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
