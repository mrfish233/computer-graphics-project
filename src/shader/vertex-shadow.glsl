attribute vec4 a_position;
uniform   mat4 u_mvp_matrix;

void main() {
    gl_Position = u_mvp_matrix * a_position;
}
