class Model {
    constructor(path, textures) {
        this.path     = path;
        this.textures = textures;
        this.shapes   = [];
    }

    async init() {
        const objectFile = await fetch(this.path);

        if (!objectFile.ok) {
            console.log("Error loading model");
            return;
        }

        let text = await objectFile.text();

        if (!text) {
            console.log("Error loading model");
            return;
        }

        const object = this.#parseObjectFile(text);

        if (object.geometries.length === 0) {
            console.log("No geometries found");
            return;
        }

        console.log(object);

        for (let i = 0; i < object.geometries.length; i++) {
            const data = object.geometries[i].data;
            const tex  = this.textures[i];

            const shape = new Shape([1,1,1], tex);
            shape.setVertices(data.normal, data.position, data.texcoord);

            this.shapes.push(shape);
        }
    }

    setModelMatrices(modelPosMatrix = null, modelShapeMatrix = null, modelViewMatrix = null) {
        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].setModelMatrices(modelPosMatrix, modelShapeMatrix, modelViewMatrix);
        }
    }

    setModelPosMatrix(modelPosMatrix) {
        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].setModelPosMatrix(modelPosMatrix);
        }
    }

    setModelShapeMatrix(modelShapeMatrix) {
        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].setModelShapeMatrix(modelShapeMatrix);
        }
    }

    setModelViewMatrix(modelViewMatrix) {
        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].setModelViewMatrix(modelViewMatrix);
        }
    }

    #parseObjectFile(text) {
        // because indices are base 1 let's just fill in the 0th data
        const objPositions = [[0, 0, 0]];
        const objTexcoords = [[0, 0]];
        const objNormals   = [[0, 0, 0]];

        // same order as `f` indices
        const objVertexData = [objPositions, objTexcoords, objNormals];

        // same order as `f` indices
        let webglVertexData = [[],[],[]];

        const materialLibs = [];
        const geometries = [];
        let geometry;
        let groups = ['default'];
        let material = 'default';
        let object = 'default';

        const noop = () => {};

        function newGeometry() {
            // If there is an existing geometry and it's not empty then start a new one
            if (geometry && geometry.data.position.length) {
                geometry = undefined;
            }
        }

        function setGeometry() {
            if (!geometry) {
                const position = [];
                const texcoord = [];
                const normal   = [];
                webglVertexData = [position, texcoord, normal];
                geometry = {
                    object,
                    groups,
                    material,
                    data: {
                        position,
                        texcoord,
                        normal,
                    },
                };
                geometries.push(geometry);
            }
        }

        function addVertex(vert) {
            const ptn = vert.split('/');
            ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
            });
        }

        const keywords = {
            v:  (parts) => objPositions.push(parts.map(parseFloat)),
            vn: (parts) => objNormals.push(parts.map(parseFloat)),
            vt: (parts) => objTexcoords.push(parts.map(parseFloat)),
            f:  (parts) => {
                setGeometry();
                const numTriangles = parts.length - 2;
                for (let tri = 0; tri < numTriangles; ++tri) {
                    addVertex(parts[0]);
                    addVertex(parts[tri + 1]);
                    addVertex(parts[tri + 2]);
                }
            },
            s: noop,    // smoothing group
            mtllib: (parts, unparsedArgs) => {
                // the spec says there can be multiple filenames here
                // but many exist with spaces in a single filename
                materialLibs.push(unparsedArgs);
            },
            usemtl: (parts, unparsedArgs) => {
                material = unparsedArgs;
                newGeometry();
            },
            g: (parts) => {
                groups = parts;
                newGeometry();
            },
            o: (parts, unparsedArgs) => {
                object = unparsedArgs;
                newGeometry();
            },
        };

        const keywordRE = /(\w*)(?: )*(.*)/;
        const lines = text.split('\n');
        for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
            const line = lines[lineNo].trim();
            if (line === '' || line.startsWith('#')) {
                continue;
            }
            const m = keywordRE.exec(line);
            if (!m) {
                continue;
            }
            const [, keyword, unparsedArgs] = m;
            const parts = line.split(/\s+/).slice(1);
            const handler = keywords[keyword];
            if (!handler) {
                console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
                continue;
            }
            handler(parts, unparsedArgs);
        }

        // remove any arrays that have no entries.
        for (const geometry of geometries) {
            geometry.data = Object.fromEntries(
                Object.entries(geometry.data).filter(([, array]) => array.length > 0));
        }

        return { geometries, materialLibs };
    }
}
