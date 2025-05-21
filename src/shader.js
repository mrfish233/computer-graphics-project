const VSHADER_SOURCE = `
    attribute vec4 a_normal;
    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_mvp_matrix;
    uniform mat4 u_model_matrix;
    uniform mat4 u_normal_matrix;

    varying vec3 v_normal;
    varying vec3 v_position;
    varying vec2 v_texcoord;

    void main() {
        gl_Position = u_mvp_matrix * a_position;
        v_normal    = normalize((u_normal_matrix * a_normal).xyz);
        v_position  = (u_model_matrix * a_position).xyz;
        v_texcoord  = a_texcoord;
    }
`;

const FSHADER_SOURCE = `
    precision mediump float;

    uniform vec3 u_light_position;
    uniform vec3 u_view_position;

    uniform float u_ambient_light;
    uniform float u_diffuse_light;
    uniform float u_specular_light;
    uniform float u_shininess;

    uniform sampler2D u_texture;

    varying vec3 v_normal;
    varying vec3 v_position;
    varying vec2 v_texcoord;

    void main() {
        // texture color
        vec3 texture_color = texture2D(u_texture, v_texcoord).rgb;

        // light colors
        vec3 ambient_color  = texture_color;
        vec3 diffuse_color  = texture_color;
        vec3 specular_color = vec3(1.0, 1.0, 1.0);

        // normalize the normal vector
        vec3 normal = normalize(v_normal);

        // directions
        vec3 light_dir   = normalize(u_light_position - v_position);
        vec3 view_dir    = normalize(u_view_position - v_position);
        vec3 reflect_dir = reflect(-light_dir, normal);

        // dot product of normal and light direction
        float normal_dot_light = max(dot(light_dir, normal), 0.0);

        // lights
        vec3 ambient_light  = ambient_color * u_ambient_light;
        vec3 diffuse_light  = diffuse_color * u_diffuse_light * normal_dot_light;
        vec3 specular_light = vec3(0.0, 0.0, 0.0);

        if (normal_dot_light > 0.0) {
            float specular_angle = clamp(dot(reflect_dir, view_dir), 0.0, 1.0);
            specular_light = specular_color * u_specular_light * pow(specular_angle, u_shininess);
        }

        // final fragment color
        gl_FragColor = vec4(ambient_light + diffuse_light + specular_light, 1.0);
    }
`;
