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
let cameraPosition   = [2.0, 2.0, 2.0];
let lightCoefficient = {
    ambient: 0.3, diffuse: 1.2, specular: 0.9, shininess: 30
};

let perspective = {
    fov: 70, aspect: 1, near: 1, far: 100
};
let view = {
    eye: [4.0, 4.0, 4.0],
    at:  [0.0, 0.0, 0.0],
    up:  [0.0, 1.0, 0.0]
};

// shapes

let cube1 = null;
let cube2 = null;
let cube3 = null;
let soccer = null;

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
    let modelViewMatrix = new Matrix4();
    modelViewMatrix.rotate(angleX, 0, 1, 0);

    cube1 = new Cube([1.0, 1.0, 3.0], textures['white'].name);
    cube2 = new Cube([3.0, 1.0, 1.0], textures['white'].name);
    cube3 = new Cube([1.0, 1.0, 1.0], textures['blue'].name);
    soccer = new Model('assets/soccer/soccer.obj', [textures['soccer'].name]);
    await soccer.init();

    webgl.addShape(cube1);
    webgl.addShape(cube2);
    webgl.addShape(cube3);
    webgl.addModel(soccer);
}

function draw() {
    if (texture_count < Object.keys(textures).length) {
        requestAnimationFrame(draw);
        return;
    }

    webgl.setEnvironment(lightPosition, cameraPosition, lightCoefficient);
    webgl.setPerspectiveView(perspective, view);

    angleX = reangle(angleX);
    angleY = reangle(angleY);

    let cube1Pos = new Matrix4();
    cube1Pos.translate(0, 0, -2);
    cube1Pos.rotate(angleX, 0, 1, 0);

    cube1.setModelPosMatrix(cube1Pos);

    let cube2Pos = new Matrix4();
    cube2Pos.translate(0, 0, 2);
    cube2Pos.rotate(angleX, 0, 1, 0);

    cube2.setModelPosMatrix(cube2Pos);

    let soccerPos = new Matrix4();
    soccerPos.translate(0, 0.86, 0);

    let soccerShape = new Matrix4();
    soccerShape.scale(3.0, 3.0, 3.0);

    soccer.setModelMatrices(null, soccerPos, soccerShape);

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
