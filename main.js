let canvas = null;
let webgl  = null;

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

function main() {
    canvas = document.getElementById('canvas');
    webgl  = new WebGL(canvas);
    webgl.init();

    draw();
}

function draw() {
    webgl.clear();
    webgl.setEnvironment(lightPosition, cameraPosition, lightCoefficient);
    webgl.setPerspectiveView(perspective, view);

    let cube = new Cube([1.0, 1.0, 1.0], [0.5, 0.5, 0.5]);
    webgl.draw(cube);

    requestAnimationFrame(draw);
}
