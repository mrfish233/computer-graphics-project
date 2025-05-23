class WebGL {
    constructor(canvasDiv, width, height) {
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('width', width);
        this.canvas.setAttribute('height', height);
        this.canvas.setAttribute('id', 'canvas');

        canvasDiv[0].appendChild(this.canvas);

        this.gl = this.canvas.getContext("webgl2");
        this.program = null;

        this.environment = null;
        this.perspective = null;
        this.view = null;

        this.shapes   = [];
        this.textures = {};

        if (!this.gl) {
            console.log("Failed to get the rendering context for WebGL");
        }
    }

    async init() {
        // load shaders
        const vertexShaderSource   = await this.#loadShader('src/shader/vertex.glsl');
        const fragmentShaderSource = await this.#loadShader('src/shader/fragment.glsl');

        const vertexShader   = this.#initShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.#initShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        if (!vertexShader || !fragmentShader) {
            console.log("Error creating shaders");
            return null;
        }

        // create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.log("Error linking program: " + this.gl.getProgramInfoLog(this.program));
            this.gl.deleteProgram(this.program);
        }

        this.gl.useProgram(this.program);
    }

    setEnvironment(lightPosition, cameraPosition, lightCoefficient) {
        this.environment = {
            lightPosition:    lightPosition,
            cameraPosition:   cameraPosition,
            lightCoefficient: lightCoefficient
        };

        // bind environment variables
        this.#bindUniformFloat('u_light_position', lightPosition);
        this.#bindUniformFloat('u_view_position',  cameraPosition);
        this.#bindUniformFloat('u_ambient_light',  lightCoefficient.ambient);
        this.#bindUniformFloat('u_diffuse_light',  lightCoefficient.diffuse);
        this.#bindUniformFloat('u_specular_light', lightCoefficient.specular);
        this.#bindUniformFloat('u_shininess',      lightCoefficient.shininess);
    }

    setPerspectiveView(perspective, view) {
        this.perspective = perspective;
        this.view = view;
    }

    addTexture(texture, name) {
        let tex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.textures[name] = tex;
    }

    addShape(shape) {
        if (!(shape instanceof Shape)) {
            console.log("Bad shape\n");
            return;
        }
        else if (shape.type === null || shape.positions === null || shape.normals === null || shape.numOfVertices === 0) {
            console.log("Shape not initialized\n");
            return;
        }
        else if (shape.texcoords === null || shape.texture === null) {
            console.log("Shape texture not initialized\n");
            return;
        }
        else if (shape.modelViewMatrix === null || shape.modelPosMatrix === null || shape.modelShapeMatrix === null) {
            console.log("Shape matrices not initialized\n");
            return;
        }

        // set up buffers
        let normalBuffer   = this.#initBuffer(shape.normals);
        let positionBuffer = this.#initBuffer(shape.positions);
        let texcoordBuffer = this.#initBuffer(shape.texcoords);

        if (!normalBuffer || !positionBuffer || !texcoordBuffer) {
            console.log("Error creating buffers");
            return;
        }

        shape.setBuffers(normalBuffer, positionBuffer, texcoordBuffer);
        this.#clearBuffer();

        this.shapes.push(shape);
    }

    draw() {
        if (this.shapes.length === 0) {
            console.log("No shapes to draw\n");
            return;
        }
        else if (this.environment === null) {
            console.log("Environment not set\n");
            return;
        }
        else if (this.perspective === null || this.view === null) {
            console.log("Perspective or view not set\n");
            return;
        }

        for (let i = 0; i < this.shapes.length; i++) {
            this.#drawOne(this.shapes[i]);
        }
    }

    #drawOne(shape) {
        // bind vertices
        this.#bindAttribute('a_normal',   3, shape.normalBuffer);
        this.#bindAttribute('a_position', 3, shape.positionBuffer);
        this.#bindAttribute('a_texcoord', 2, shape.texcoordBuffer);

        // bind texture
        this.#bindTexture(shape.texture);

        // set up the mvp matrix and normal matrix
        let modelMatrix  = new Matrix4();
        let mvpMatrix    = new Matrix4();
        let normalMatrix = new Matrix4();

        modelMatrix.setIdentity();
        modelMatrix.multiply(shape.modelViewMatrix);
        modelMatrix.multiply(shape.modelPosMatrix);
        modelMatrix.multiply(shape.modelShapeMatrix);

        mvpMatrix.setPerspective(this.perspective.fov, this.perspective.aspect, this.perspective.near, this.perspective.far);
        mvpMatrix.lookAt(this.view.eye[0], this.view.eye[1], this.view.eye[2],
                         this.view.at[0],  this.view.at[1],  this.view.at[2],
                         this.view.up[0],  this.view.up[1],  this.view.up[2]);
        mvpMatrix.multiply(modelMatrix);

        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();

        // bind matrices
        this.#bindUniformMatrix4('u_model_matrix',  modelMatrix.elements);
        this.#bindUniformMatrix4('u_mvp_matrix',    mvpMatrix.elements);
        this.#bindUniformMatrix4('u_normal_matrix', normalMatrix.elements);

        // draw the shape
        this.gl.drawArrays(shape.type, 0, shape.numOfVertices);
    }

    clear() {
        // clear canvas
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
    }

    async #loadShader(url) {
        const response = await fetch(url);
        return response.text();
    }

    #initShader(type, source) {
        const shader = this.gl.createShader(type);

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.log("Error compiling shader: " + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    #initBuffer(data) {
        let buffer = this.gl.createBuffer();

        if (!buffer) {
            console.log("Failed to create buffer");
            return null;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

        return buffer;
    }

    #clearBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    #bindAttribute(name, size, buffer) {
        let location = this.gl.getAttribLocation(this.program, name);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(location);
    }

    #bindTexture(texture) {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[texture]);
        this.#bindUniformInt('u_texture', 0);
    }

    #bindUniformFloat(name, data) {
        let location = this.gl.getUniformLocation(this.program, name);

        if (Array.isArray(data)) {
            if (data.length === 4) {
                this.gl.uniform4f(location, data[0], data[1], data[2], data[3]);
            }
            else if (data.length === 3) {
                this.gl.uniform3f(location, data[0], data[1], data[2]);
            }
            else if (data.length === 2) {
                this.gl.uniform2f(location, data[0], data[1]);
            }
            else {
                this.gl.uniform1f(location, data[0]);
            }
        }
        else {
            this.gl.uniform1f(location, data);
        }
    }

    #bindUniformInt(name, data) {
        let location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform1i(location, data);
    }

    #bindUniformMatrix4(name, data) {
        let location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniformMatrix4fv(location, false, data);
    }
}