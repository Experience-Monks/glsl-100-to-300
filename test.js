var transpile = require('./')
var tokenize = require('glsl-tokenizer')
var test = require('tape')
var stringify = require('glsl-token-string')

test('transpiles GLSL tokens from v100 to v300 es', function (t) {
  t.throws(function () {
    transpile.vertex(tokenize('#version 300\nvoid main(){}'))
  }, 'cannot handle non-es version')
  
  t.throws(function () {
    transpile.vertex(tokenize('attribute vec3 texture;\nvoid main(){}'))
  }, 'cannot transpile reserved words in attribuets')
  
  t.doesNotThrow(function () {
    transpile.vertex(tokenize('attribute vec3 foo;\nvoid main(){ float texture = 1.0; }'))
  }, 'support reserved word in vert shader when not attribute')

  var shader, result
  shader = tokenize([
    '#version 100',
    '#extension GL_OES_standard_derivatives : enable',
    '#extension GL_EXT_draw_buffers : enable',
    '#extension GL_EXT_fancy_dancy : enable',
    'void main() {}'
  ].join('\n'))
  result = stringify(transpile.vertex(shader))
  t.equal(result, [
    '#version 300 es',
    '#extension GL_EXT_fancy_dancy : enable',
    'void main() {}'
  ].join('\n'), 'removes core extensions')
  
  shader = tokenize([
    '#version 100',
    'varying vec3 sample;',
    'void main() {',
      'float centroid = 1.0;',
      'gl_FragColor = vec4(sample, centroid);',
    '}'
  ].join('\n'))
  result = stringify(transpile.fragment(shader))
  t.equal(result, [
    '#version 300 es',
    'out vec4 fragColor;',
    'in vec3 sample_0;',
    'void main() {',
      'float centroid_0 = 1.0;',
      'fragColor = vec4(sample_0, centroid_0);',
    '}'
  ].join('\n'), 'handles 300es keywords')
  
  shader = tokenize([
    '#version 100',
    '#define FOO',
    'attribute vec4 position;',
    'attribute vec3 texcoords;',
    'varying vec2 vUv;',
    'void main() {',
    'gl_Position = position;',
    '}'
  ].join('\n'))
  result = stringify(transpile.vertex(shader))
  t.equal(result, [
    '#version 300 es',
    '#define FOO',
    'in vec4 position;',
    'in vec3 texcoords;',
    'out vec2 vUv;',
    'void main() {',
    'gl_Position = position;',
    '}'
  ].join('\n'), 'vertex shader')

  shader = tokenize([
    '#version 100',
    'precision mediump float;',
    'precision mediump int;',
    'void main() {',
    'gl_FragColor = vec4(1.0);',
    '}'
  ].join('\n'))
  result = stringify(transpile.fragment(shader))
  t.equal(result, [
    '#version 300 es',
    'precision mediump float;',
    'precision mediump int;',
    'out vec4 fragColor;',
    'void main() {',
    'fragColor = vec4(1.0);',
    '}'
  ].join('\n'), 'handles precision nicely')

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

  result = stringify(transpile.fragment(shader))
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
