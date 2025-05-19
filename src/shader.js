var VSHADER_SOURCE = `
    attribute vec4 a_color;
    attribute vec4 a_normal;
    attribute vec4 a_position;

    uniform mat4 u_mvp_matrix;
    uniform mat4 u_model_matrix;
    uniform mat4 u_normal_matrix;

    varying vec4 v_color;
    varying vec3 v_normal;
    varying vec3 v_position;

    void main() {
        gl_Position = u_mvp_matrix * a_position;
        v_position  = (u_model_matrix * a_position).xyz;
        v_normal    = normalize((u_normal_matrix * a_normal).xyz);
        v_color     = a_color;
    }
`;

var FSHADER_SOURCE = `
    precision mediump float;

    uniform vec3 u_light_position;
    uniform vec3 u_view_position;

    uniform float u_ambient_light;
    uniform float u_diffuse_light;
    uniform float u_specular_light;
    uniform float u_shininess;

    varying vec4 v_color;
    varying vec3 v_normal;
    varying vec3 v_position;

    void main() {
        // light color
        vec3 ambient_color  = v_color.rgb;
        vec3 diffuse_color  = v_color.rgb;
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
