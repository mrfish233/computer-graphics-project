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
            rect.top  <= y && y <= rect.bottom &&
            isThirdPerson) {
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
        callback: async () => {
            isThirdPerson = !isThirdPerson;
            mouseDrag  = false;
            canReangle = true;

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

            await toggleViewTrigger();
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

            console.log(penguinUpDir);

            // turn angles based on the penguin's up direction
            if (penguinUpDir[0] == 1) {
                penguinAngles[0] -= 90;

                if (penguinFaceDir[1] == -1) {
                    penguinFaceDir = [0.0, 0.0, -1.0];
                }
                else if (penguinFaceDir[1] == 1) {
                    penguinFaceDir = [0.0, 0.0, 1.0];
                }
                else if (penguinFaceDir[2] == -1) {
                    penguinFaceDir = [-1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[2] == 1) {
                    penguinFaceDir = [1.0, 0.0, 0.0];
                }
            }
            else if (penguinUpDir[0] == -1) {
                penguinAngles[0] += 90;

                if (penguinFaceDir[1] == -1) {
                    penguinFaceDir = [0.0, 0.0, 1.0];
                }
                else if (penguinFaceDir[1] == 1) {
                    penguinFaceDir = [0.0, 0.0, -1.0];
                }
                else if (penguinFaceDir[2] == -1) {
                    penguinFaceDir = [1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[2] == 1) {
                    penguinFaceDir = [-1.0, 0.0, 0.0];
                }
            }
            else if (penguinUpDir[1] == 1) {
                penguinAngles[1] += 90;

                if (penguinFaceDir[2] == -1) {
                    penguinFaceDir = [-1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[2] == 1) {
                    penguinFaceDir = [1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[0] == -1) {
                    penguinFaceDir = [0.0, 0.0, 1.0];
                }
                else if (penguinFaceDir[0] == 1) {
                    penguinFaceDir = [0.0, 0.0, -1.0];
                }
            }
            else if (penguinUpDir[1] == -1) {
                penguinAngles[1] -= 90;

                if (penguinFaceDir[2] == -1) {
                    penguinFaceDir = [1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[2] == 1) {
                    penguinFaceDir = [-1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[0] == -1) {
                    penguinFaceDir = [0.0, 0.0, -1.0];
                }
                else if (penguinFaceDir[0] == 1) {
                    penguinFaceDir = [0.0, 0.0, 1.0];
                }
            }
            else if (penguinUpDir[2] == 1) {
                penguinAngles[2] -= 90;

                if (penguinFaceDir[1] == -1) {
                    penguinFaceDir = [-1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[1] == 1) {
                    penguinFaceDir = [1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[0] == -1) {
                    penguinFaceDir = [0.0, 0.0, -1.0];
                }
                else if (penguinFaceDir[0] == 1) {
                    penguinFaceDir = [0.0, 0.0, 1.0];
                }
            }
            else if (penguinUpDir[2] == -1) {
                penguinAngles[2] += 90;

                if (penguinFaceDir[1] == -1) {
                    penguinFaceDir = [1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[1] == 1) {
                    penguinFaceDir = [-1.0, 0.0, 0.0];
                }
                else if (penguinFaceDir[0] == -1) {
                    penguinFaceDir = [0.0, 0.0, 1.0];
                }
                else if (penguinFaceDir[0] == 1) {
                    penguinFaceDir = [0.0, 0.0, -1.0];
                }
            }

            view.at = [
                penguinPosition[0] + penguinFaceDir[0],
                penguinPosition[1] + penguinFaceDir[1] + 0.5,
                penguinPosition[2] + penguinFaceDir[2]
            ];

            webgl.setPerspectiveView(perspective, view);
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

function checkHasBlock(pos, block) {
    const x = block[0] + view.up[0];
    const y = block[1] + view.up[1];
    const z = block[2] + view.up[2];

    return (x - penguinMoveSpeed * 2 <= pos[0] && pos[0] <= x + penguinMoveSpeed * 2 &&
            y - penguinMoveSpeed * 2 <= pos[1] && pos[1] <= y + penguinMoveSpeed * 2 &&
            z - penguinMoveSpeed * 2 <= pos[2] && pos[2] <= z + penguinMoveSpeed * 2);
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
