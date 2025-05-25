attribute vec4 a_normal;
attribute vec4 a_position;

uniform mat4 u_mvp_matrix;
uniform mat4 u_model_matrix;
uniform mat4 u_normal_matrix;

varying vec3 v_normal;
varying vec3 v_position;

void main() {
    gl_Position = u_mvp_matrix * a_position;
    v_normal    = normalize((u_normal_matrix * a_normal).xyz);
    v_position  = (u_model_matrix * a_position).xyz;
}
