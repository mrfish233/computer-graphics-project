const WEBGL_TRIANGLES = 4;

class Shape {
    constructor(size, texture, modelViewMatrix = null, modelPosMatrix = null, modelShapeMatrix = null) {
        this.type = WEBGL_TRIANGLES;
        this.size = size;

        // Initialize vertices for WebGL
        this.normals   = null;
        this.positions = null;
        this.texcoords = null;
        this.texture   = texture;

        this.numOfVertices = 0;

        // Initialize matrices for WebGL
        let identityMatrix = new Matrix4();
        identityMatrix.setIdentity();

        this.modelViewMatrix  = new Matrix4(modelViewMatrix  || identityMatrix);
        this.modelPosMatrix   = new Matrix4(modelPosMatrix   || identityMatrix);
        this.modelShapeMatrix = new Matrix4(modelShapeMatrix || identityMatrix);
    }

    setBuffers(normalBuffer, positionBuffer, texcoordBuffer) {
        this.normalBuffer   = normalBuffer;
        this.positionBuffer = positionBuffer;
        this.texcoordBuffer = texcoordBuffer;
    }

    getPos() {
        let mat = new Matrix4(this.modelPosMatrix);
        mat.multiply(this.modelShapeMatrix);

        let pos = mat.elements;
        return [pos[12], pos[13], pos[14]];
    }

    setVertices(normals, positions, texcoords) {
        this.setNormal(normals);
        this.setPosition(positions);
        this.setTexcoord(texcoords);
    }

    setNormal(normals) {
        this.normals = normals;
    }

    setPosition(positions) {
        this.positions = positions;
        this.numOfVertices = positions.length / 3;
    }

    setTexcoord(texcoords) {
        this.texcoords = texcoords;
    }

    transform(pos, angle, scale) {
        this.translate(pos);
        this.rotate(angle);
        this.scale(scale);
    }

    translate(pos = [0, 0, 0]) {
        this.modelShapeMatrix.translate(pos[0], pos[1], pos[2]);
    }

    rotate(angle = [0, 0, 0]) {
        this.modelShapeMatrix.rotate(angle[2], 0.0, 0.0, 1.0);
        this.modelShapeMatrix.rotate(angle[1], 0.0, 1.0, 0.0);
        this.modelShapeMatrix.rotate(angle[0], 1.0, 0.0, 0.0);
    }

    scale(scale = [1.0, 1.0, 1.0]) {
        this.modelShapeMatrix.scale(scale[0], scale[1], scale[2]);
    }
}

class Cube extends Shape {
    constructor(size = [1.0, 1.0, 1.0], texture, viewMatrix = null, posMatrix = null, shapeMatrix = null) {
        super(size, texture, viewMatrix, posMatrix, shapeMatrix);

        let cubeVertices = [];
        let cubeIndices  = [];

        let cubeTexCoords  = [];
        let cubeTexIndices = [];

        let halfWidth  = this.size[0] / 2;
        let halfHeight = this.size[1] / 2;
        let halfDepth  = this.size[2] / 2;

        cubeVertices = [
            [ halfWidth,  halfHeight,  halfDepth],  // 0: top-right-front
            [-halfWidth,  halfHeight,  halfDepth],  // 1: top-left-front
            [-halfWidth, -halfHeight,  halfDepth],  // 2: bottom-left-front
            [ halfWidth, -halfHeight,  halfDepth],  // 3: bottom-right-front
            [ halfWidth,  halfHeight, -halfDepth],  // 4: top-right-back
            [-halfWidth,  halfHeight, -halfDepth],  // 5: top-left-back
            [-halfWidth, -halfHeight, -halfDepth],  // 6: bottom-left-back
            [ halfWidth, -halfHeight, -halfDepth],  // 7: bottom-right-back
        ];

        cubeIndices = [
            0, 1, 2, 0, 2, 3,  // front
            4, 0, 3, 4, 3, 7,  // right
            4, 5, 1, 4, 1, 0,  // up
            1, 5, 6, 1, 6, 2,  // left
            3, 2, 6, 3, 6, 7,  // bottom
            5, 4, 7, 5, 7, 6   // back
        ];

        cubeTexCoords = [
            [1.0, 1.0], [0.0, 1.0], [0.0, 0.0], [1.0, 0.0]
        ];

        cubeTexIndices = [
            0, 1, 2, 0, 2, 3,  // front
            0, 1, 2, 0, 2, 3,  // right
            0, 1, 2, 0, 2, 3,  // up
            0, 1, 2, 0, 2, 3,  // left
            0, 1, 2, 0, 2, 3,  // bottom
            0, 1, 2, 0, 2, 3,  // back
        ];

        let normals   = computeNormalArray(cubeVertices, cubeIndices);
        let positions = convertVertexArray(cubeVertices, cubeIndices);
        let texcoords = convertVertexArray(cubeTexCoords, cubeTexIndices);

        this.setVertices(normals, positions, texcoords);
    }
}

class Sphere extends Shape {
    constructor(size = [1.0, 1.0, 1.0], color = [0.5, 0.5, 0.5], detail = 20, viewMatrix = null, posMatrix = null, shapeMatrix = null) {
        super(size, color, viewMatrix, posMatrix, shapeMatrix);

        let sphereVertices = [];
        let sphereColors   = [];
        let sphereIndices  = [];

        for (let latNumber = 0; latNumber <= detail; latNumber++) {
            let theta = latNumber * Math.PI / detail;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= detail; longNumber++) {
                let phi = longNumber * 2 * Math.PI / detail;
                let sinPhi = Math.sin(phi);
                let cosPhi = Math.cos(phi);

                // Position
                let x = cosPhi * sinTheta;
                let y = cosTheta;
                let z = sinPhi * sinTheta;

                // Add vertex
                sphereVertices.push([size[0] * x, size[1] * y, size[2] * z]);

                // Add color
                if (Array.isArray(color)) {
                    sphereColors.push(color);
                } else {
                    sphereColors.push([1.0, 0.5, 0.5]);
                }
            }
        }

        // Generate indices
        for (let latNumber = 0; latNumber < detail; latNumber++) {
            for (let longNumber = 0; longNumber < detail; longNumber++) {
                let first  = (latNumber * (detail + 1)) + longNumber;
                let second = first + detail + 1;

                // First triangle
                sphereIndices.push(first + 1);
                sphereIndices.push(second);
                sphereIndices.push(first);

                // Second triangle
                sphereIndices.push(first + 1);
                sphereIndices.push(second + 1);
                sphereIndices.push(second);
            }
        }

        this.setVerticesByIndices(sphereVertices, sphereColors, sphereIndices);
    }
}

class Cylinder extends Shape {
    constructor(size = [1.0, 1.0, 1.0], color = [0.5, 0.5, 0.5], detail = 20, viewMatrix = null, posMatrix = null, shapeMatrix = null) {
        super(size, color, viewMatrix, posMatrix, shapeMatrix);

        let cylinderVertices = [];
        let cylinderColors   = [];
        let cylinderIndices  = [];

        let radiusX = this.size[0] / 2;
        let radiusZ = this.size[2] / 2;
        let height  = this.size[1];

        for (let i = 0; i <= detail; i++) {
            let theta = i * 2 * Math.PI / detail;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            // Top rim
            cylinderVertices.push([radiusX * cosTheta, -height / 2, radiusZ * sinTheta]);
            cylinderColors.push(Array.isArray(this.color) ? this.color : [1.0, 0.5, 0.5]);

            // Bottom rim
            cylinderVertices.push([radiusX * cosTheta, height / 2, radiusZ * sinTheta]);
            cylinderColors.push(Array.isArray(this.color) ? this.color : [1.0, 0.5, 0.5]);
        }

        // Generate indices
        for (let i = 0; i < detail; i++) {
            // Top face triangles
            cylinderIndices.push(0); // Center point
            cylinderIndices.push(2 + (i * 2)); // Current top rim point
            cylinderIndices.push(2 + ((i + 1) % detail * 2)); // Next top rim point

            // Bottom face triangles
            cylinderIndices.push(1); // Center point
            cylinderIndices.push(3 + ((i + 1) % detail * 2)); // Next bottom rim point
            cylinderIndices.push(3 + (i * 2)); // Current bottom rim point

            // Side faces (rectangles made of two triangles)
            let topCurrent    = 2 + (i * 2);
            let bottomCurrent = 3 + (i * 2);
            let topNext       = 2 + ((i + 1) % detail * 2);
            let bottomNext    = 3 + ((i + 1) % detail * 2);

            // Triangle 1
            cylinderIndices.push(topCurrent);
            cylinderIndices.push(bottomCurrent);
            cylinderIndices.push(topNext);

            // Triangle 2
            cylinderIndices.push(topNext);
            cylinderIndices.push(bottomCurrent);
            cylinderIndices.push(bottomNext);
        }

        this.setVerticesByIndices(cylinderVertices, cylinderColors, cylinderIndices);
    }
}
