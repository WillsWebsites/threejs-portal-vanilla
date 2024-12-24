void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05;
    float alpha = (strength / distanceToCenter) - strength * 2.0;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}