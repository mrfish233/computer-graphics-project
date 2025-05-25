precision mediump float;

uniform vec3 u_view_position;
uniform vec3 u_color;

uniform samplerCube u_environment_map;

varying vec3 v_normal;
varying vec3 v_position;

void main() {
    // normalize the normal vector
    vec3 normal = normalize(v_normal);

    // directions
    vec3 view_dir = normalize(u_view_position - v_position);
    vec3 reflect_dir = reflect(-view_dir, normal);

    // sample the environment map
    vec3 reflect_color = textureCube(u_environment_map, reflect_dir).rgb;

    gl_FragColor = vec4(0.30 * u_color + 0.70 * reflect_color, 1.0);
}
