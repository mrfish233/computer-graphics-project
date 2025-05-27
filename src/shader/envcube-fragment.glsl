precision mediump float;

uniform samplerCube u_envcube_map;
uniform mat4 u_view_dir_inverse;
varying vec4 v_position;

void main() {
    vec4 t = u_view_dir_inverse * v_position;
    gl_FragColor = textureCube(u_envcube_map, normalize(t.xyz / t.w));
}
