function convertVertexArray(vertices, indices) {
    let elements = [];

    for (let i = 0; i < indices.length; i++) {
        elements.push(...vertices[indices[i]]);
    }

    return elements;
}

function computeNormalArray(vertices, indices) {
    let normals = [];

    for (let i = 0; i < indices.length; i += 3) {
        let v0 = vertices[indices[i]];
        let v1 = vertices[indices[i + 1]];
        let v2 = vertices[indices[i + 2]];

        // Compute the normal vector using cross product
        let u = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        let v = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

        let normal = [
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]
        ];

        // Normalize the normal vector
        let length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
        normal = normal.map(n => n / length);

        normals.push(...normal);
        normals.push(...normal);
        normals.push(...normal);
    }

    return normals;
}

function getEulerAngles(matrix) {
    if (!matrix instanceof Matrix4) {
        throw new Error("Input must be a Matrix4 instance");
    }

    let m = matrix.elements;
    let sy = Math.sqrt(m[0] * m[0] + m[1] * m[1]);
    let singular = sy < 1e-6; // If sy is close to zero, we have a singularity
    let x, y, z;

    if (!singular) {
        x = Math.atan2(m[6], m[10]);
        y = Math.atan2(-m[2], sy);
        z = Math.atan2(m[1], m[0]);
    } else {
        x = Math.atan2(-m[9], m[5]);
        y = Math.atan2(-m[2], sy);
        z = 0;
    }

    // Convert radians to degrees
    x = x * (180 / Math.PI);
    y = y * (180 / Math.PI);
    z = z * (180 / Math.PI);

    return [x, y, z];
}
