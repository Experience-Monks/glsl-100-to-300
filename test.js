var transpile = require('./')
var tokenize = require('glsl-tokenizer')
var test = require('tape')
var stringify = require('glsl-token-string')

test('transpiles GLSL tokens from v100 to v300 es', function (t) {
  t.throws(function () {
    transpile(tokenize('#version 300\nvoid main(){}'))
  }, 'cannot handle non-es version')

  var shader
  shader = tokenize([
    '#version 100',
    '#define FOO',
    'attribute vec4 position;',
    'attribute vec3 texture;',
    'varying vec2 vUv;',
    'void main() {',
    'gl_Position = position;',
    '}'
  ].join('\n'))
  var result = stringify(transpile(shader, true))
  t.equal(result, [
    '#version 300 es',
    '#define FOO',
    'in vec4 position;',
    'in vec3 texture;',
    'out vec2 vUv;',
    'void main() {',
    'gl_Position = position;',
    '}'
  ].join('\n'), 'vertex shader')

  shader = tokenize([
    '#version 100',
    '#define FOO',
    '#extension GL_BLAH_BLAH : enable',
    'vec4 foo (in vec3 blah) { return vec4(1.0); }',
    'varying vec4 vUv;',
    'uniform float fragColor;',
    'uniform float fragColor_0;',
    'uniform float fragColor_3;',
    'void main() {',
    'vec4 fragColor_1 = vec4(1.0);',
    'gl_FragColor.x *= gl_FragColor.g;',
    'gl_FragColor = texture2D(tex, uv);',
    'gl_FragColor = textureCube(tex, uv);',
    'gl_FragDepth = 2.0;',
    '}'
  ].join('\n'))

  result = stringify(transpile(shader, false))
  t.equal(result, [
    '#version 300 es',
    '#define FOO',
    '#extension GL_BLAH_BLAH : enable',
    'out float fragDepth;',
    'out vec4 fragColor_2;',
    'vec4 foo (in vec3 blah) { return vec4(1.0); }',
    'in vec4 vUv;',
    'uniform float fragColor;',
    'uniform float fragColor_0;',
    'uniform float fragColor_3;',
    'void main() {',
    'vec4 fragColor_1 = vec4(1.0);',
    'fragColor_2.x *= fragColor_2.g;',
    'fragColor_2 = texture(tex, uv);',
    'fragColor_2 = texture(tex, uv);',
    'fragDepth = 2.0;',
    '}'
  ].join('\n'), 'fragment shader')
  t.end()
})
