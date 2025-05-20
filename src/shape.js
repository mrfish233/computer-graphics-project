const WEBGL_TRIANGLES = 4;

class Shape {
    constructor(size, color, modelViewMatrix = null, modelPosMatrix = null, modelShapeMatrix = null) {
        this.type  = WEBGL_TRIANGLES;
        this.size  = size;
        this.color = color;
        this.modelViewMatrix  = new Matrix4();
        this.modelPosMatrix   = new Matrix4();
        this.modelShapeMatrix = new Matrix4();

        this.modelViewMatrix.setIdentity();
        this.modelPosMatrix.setIdentity();
        this.modelShapeMatrix.setIdentity();

        if (modelViewMatrix !== null) {
            this.modelViewMatrix.set(modelViewMatrix);
        }

        if (modelPosMatrix !== null) {
            this.modelPosMatrix.set(modelPosMatrix);
        }

        if (modelShapeMatrix !== null) {
            this.modelShapeMatrix.set(modelShapeMatrix);
        }

        // Initialize positions, colors, and normals for webGL
        this.positions = null;
        this.colors    = null;
        this.normals   = null;

        // Initialize number of vertices
        this.numOfVertices = 0;
    }

    getPos() {
        let mat = new Matrix4(this.modelPosMatrix);
        mat.multiply(this.modelShapeMatrix);

        let pos = mat.elements;
        return [pos[12], pos[13], pos[14]];
    }

    setPosition(positions) {
        this.positions = positions;
        this.numOfVertices = positions.length / 3;
    }

    setColor(colors) {
        this.colors = colors;
    }

    setNormal(normals) {
        this.normals = normals;
    }

    setVertices(positions, colors, normals) {
        this.setPosition(positions);
        this.setColor(colors);
        this.setNormal(normals);
    }

    setPositionByIndices(vertexList, indices) {
        let positions = convertVertexArray(vertexList, indices);
        this.setPosition(positions);
    }

    setColorByIndices(colorList, indices) {
        let colors = convertVertexArray(colorList, indices);
        this.setColor(colors);
    }

    setNormalByIndices(vertexList, indices) {
        let normals = computeNormalArray(vertexList, indices);
        this.setNormal(normals);
    }

    setVerticesByIndices(vertexList, colorList, indices) {
        this.setPositionByIndices(vertexList, indices);
        this.setColorByIndices(colorList, indices);
        this.setNormalByIndices(vertexList, indices);
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

    transform(pos, angle, scale) {
        this.translate(pos);
        this.rotate(angle);
        this.scale(scale);
    }
}

class Cube extends Shape {
    constructor(size = [1.0, 1.0, 1.0], color = [0.5, 0.5, 0.5], viewMatrix = null, posMatrix = null, shapeMatrix = null) {
        super(size, color, viewMatrix, posMatrix, shapeMatrix);

        let cubeVertices = [];
        let cubeColors   = [];
        let cubeIndices  = [];

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

        for (let i = 0; i < 8; i++) {
            cubeColors.push(Array.isArray(this.color) ? this.color : [1.0, 0.5, 0.5]);
        }

        cubeIndices = [
            0, 1, 2, 0, 2, 3,  // front
            0, 3, 4, 4, 3, 7,  // right
            0, 5, 1, 0, 4, 5,  // up
            5, 6, 1, 1, 6, 2,  // left
            3, 2, 6, 3, 6, 7,  // bottom
            4, 7, 6, 4, 6, 5   // back
        ];

        this.setVerticesByIndices(cubeVertices, cubeColors, cubeIndices);
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
