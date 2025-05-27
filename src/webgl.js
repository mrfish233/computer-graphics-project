class WebGL {
    constructor(canvasDiv, width, height) {
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('width', width);
        this.canvas.setAttribute('height', height);
        this.canvas.setAttribute('id', 'canvas');

        canvasDiv[0].appendChild(this.canvas);

        this.gl = this.canvas.getContext("webgl2");
        this.program = null;
        this.shadow  = null;

        this.depthBuffer = null;

        this.shadowTexture = null;
        this.shadowFrameBuffer = null;

        this.offScreenWidth  = 2048;
        this.offScreenHeight = 2048;

        this.camera     = null;
        this.light      = null;
        this.lightCoeff = null;

        this.perspective = null;
        this.view = null;

        this.shapes   = [];
        this.textures = {};

        if (!this.gl) {
            console.log("Failed to get the rendering context for WebGL");
        }
    }

    async init() {
        // compile shaders
        this.program = await this.#compileShader('src/shader/default-vertex.glsl', 'src/shader/default-fragment.glsl');
        this.shadow  = await this.#compileShader('src/shader/shadow-vertex.glsl', 'src/shader/shadow-fragment.glsl');

        if (!this.program || !this.shadow) {
            console.log("Failed to compile shaders");
            return;
        }

        // initialize depth buffer
        this.#initDepthBuffer();

        // initialize framebuffer for shadow mapping
        this.#initShadowFrameBuffer();

        // Use the compiled program
        this.gl.useProgram(this.program);
    }

    setLight(light, lightCoefficient) {
        this.light = light;
        this.lightCoeff = lightCoefficient;
    }

    setCamera(cameraPosition) {
        this.camera = cameraPosition;
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

    addModel(model) {
        if (!(model instanceof Model)) {
            console.log("Bad model\n");
            return;
        }
        else if (model.shapes.length === 0) {
            console.log("Model not initialized\n");
            return;
        }

        for (let i = 0; i < model.shapes.length; i++) {
            this.addShape(model.shapes[i]);
        }
    }

    draw() {
        if (this.shapes.length === 0) {
            console.log("No shapes to draw\n");
            return;
        }
        else if (this.light === null || this.camera === null || this.lightCoeff === null) {
            console.log("Environment not set\n");
            return;
        }
        else if (this.perspective === null || this.view === null) {
            console.log("Perspective or view not set\n");
            return;
        }

        // shadow mapping
        this.#setCurrentProgram(this.shadow, this.shadowFrameBuffer, this.offScreenWidth, this.offScreenHeight);
        this.#clear();

        for (let i = 0; i < this.shapes.length; i++) {
            this.#drawShadow(this.shapes[i]);
        }

        // object rendering
        this.#setCurrentProgram(this.program, null, this.canvas.width, this.canvas.height);
        this.#clear();

        for (let i = 0; i < this.shapes.length; i++) {
            this.#drawShape(this.shapes[i]);
        }
    }

    #drawShadow(shape) {
        let modelMatrix = new Matrix4();
        let mvpMatrix   = new Matrix4();

        modelMatrix.setIdentity();
        modelMatrix.multiply(shape.modelViewMatrix);
        modelMatrix.multiply(shape.modelPosMatrix);
        modelMatrix.multiply(shape.modelShapeMatrix);

        mvpMatrix.setPerspective(100, this.offScreenWidth/this.offScreenHeight, this.perspective.near, this.perspective.far);
        mvpMatrix.lookAt(this.light[0], this.light[1], this.light[2], 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        mvpMatrix.multiply(modelMatrix);

        shape.lightMvpMatrix = new Matrix4(mvpMatrix);

        // bind vertices
        this.#bindAttribute(this.shadow, 'a_position', 3, shape.positionBuffer);

        // bind matrices
        this.#bindUniformMatrix4(this.shadow, 'u_mvp_matrix', mvpMatrix.elements);

        // draw the shape
        this.gl.drawArrays(shape.type, 0, shape.numOfVertices);
    }

    #drawShape(shape) {
        // set up the matrices
        let matrices = this.#computeMatrices(shape);

        // bind uniforms
        this.#bindUniformFloat(this.program, 'u_light_position', this.light);
        this.#bindUniformFloat(this.program, 'u_view_position',  this.camera);
        this.#bindUniformFloat(this.program, 'u_ambient_light',  this.lightCoeff.ambient);
        this.#bindUniformFloat(this.program, 'u_diffuse_light',  this.lightCoeff.diffuse);
        this.#bindUniformFloat(this.program, 'u_specular_light', this.lightCoeff.specular);
        this.#bindUniformFloat(this.program, 'u_shininess',      this.lightCoeff.shininess);

        // bind vertices
        this.#bindAttribute(this.program, 'a_normal',   3, shape.normalBuffer);
        this.#bindAttribute(this.program, 'a_position', 3, shape.positionBuffer);
        this.#bindAttribute(this.program, 'a_texcoord', 2, shape.texcoordBuffer);

        // bind matrices
        this.#bindUniformMatrix4(this.program, 'u_model_matrix',  matrices.model.elements);
        this.#bindUniformMatrix4(this.program, 'u_mvp_matrix',    matrices.mvp.elements);
        this.#bindUniformMatrix4(this.program, 'u_normal_matrix', matrices.normal.elements);
        this.#bindUniformMatrix4(this.program, 'u_light_mvp_matrix', shape.lightMvpMatrix.elements);

        // bind texture
        this.#bindTexture(shape.texture);

        // draw the shape
        this.gl.drawArrays(shape.type, 0, shape.numOfVertices);
    }

    #computeMatrices(shape) {
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

        return {
            model:  modelMatrix,
            mvp:    mvpMatrix,
            normal: normalMatrix
        }
    }

    #setCurrentProgram(program, frameBuffer, width, height) {
        this.gl.useProgram(program);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
        this.gl.viewport(0, 0, width, height);
    }

    #clear() {
        // clear canvas
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
    }

    async #compileShader(vShader, fShader) {
        let vertexShaderSource   = await this.#loadShader(vShader);
        let fragmentShaderSource = await this.#loadShader(fShader);

        const vertexShader   = this.#initShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.#initShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        if (!vertexShader || !fragmentShader) {
            console.log("Error creating shaders");
            return null;
        }

        let program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.log("Error linking program: " + this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
        }

        return program;
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

    #initDepthBuffer() {
        let depthBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.offScreenWidth, this.offScreenHeight);

        if (!depthBuffer) {
            console.log("Failed to create depth buffer");
            return null;
        }

        this.depthBuffer = depthBuffer;
    }

    #initShadowFrameBuffer() {
        let texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.offScreenWidth, this.offScreenHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

        let frameBuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.depthBuffer);

        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.log("Error creating framebuffer: " + this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER));
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            return null;
        }

        this.shadowTexture = texture;
        this.shadowFrameBuffer = frameBuffer;
    }

    #clearBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    #bindTexture(texture) {
        // bind shadow texture
        this.#bindUniformInt(this.program, 'u_shadow_map', 0);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowTexture);

        // bind texture
        this.#bindUniformInt(this.program, 'u_texture', 1);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[texture]);
    }

    #bindAttribute(program, name, size, buffer) {
        let location = this.gl.getAttribLocation(program, name);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(location);
    }

    #bindUniformFloat(program, name, data) {
        let location = this.gl.getUniformLocation(program, name);

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

    #bindUniformInt(program, name, data) {
        let location = this.gl.getUniformLocation(program, name);
        this.gl.uniform1i(location, data);
    }

    #bindUniformMatrix4(program, name, data) {
        let location = this.gl.getUniformLocation(program, name);
        this.gl.uniformMatrix4fv(location, false, data);
    }
}