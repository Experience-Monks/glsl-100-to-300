# glsl-100-to-300

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Transpile GLSL source tokens from version `"100"` (WebGL1) to `"300 es"` (WebGL2).

## Example

Source:

```js
var transpile = require('glsl-100-to-300')
var tokenize = require('glsl-tokenizer')
var stringify = require('glsl-token-string')

var tokens = transpile.fragment(tokenize(inputShader))
console.log(stringify(tokens))
```

Input fragment shader:

```glsl
#version 100
#extension GL_OES_standard_derivatives : enable
varying vec2 vUv;
uniform sampler2D iChannel0;

void main() {
  float sample = 1.0;
  vec4 fragColor = vec4(sample);
  gl_FragColor = texture2D(iChannel0, vUv);
}
```

The resulting WebGL2 shader.

```glsl
#version 300 es
out vec4 fragColor_1;
in vec2 vUv;
uniform sampler2D iChannel0;

void main() {
  float sample_0 = 1.0;
  vec4 fragColor = vec4(sample_0);
  fragColor_1 = texture(iChannel0, vUv);
}
```

`sample` is a reserved word in 300es so it must be renamed, and `GL_OES_standard_derivatives` has been promoted to core so it should no longer be included in GLSL.

## Usage

[![NPM](https://nodei.co/npm/glsl-100-to-300.png)](https://www.npmjs.com/package/glsl-100-to-300)

Operates on [GLSL tokens](https://www.npmjs.com/package/glsl-tokenizer), but ignoring `column`, `position` and `line`.

#### `transpile.vertex(tokens)`

Transpiles the `tokens` array from a vertex shader and modifies them in place, to allow the code to run in a WebGL2 context.

In this case, `varying` will be converted to `out`.

Returns the `tokens` array.

#### `transpile.fragment(tokens)`

Same as above, but handles fragment shaders, where `varying` will be converted to `in`.

## Limitations

If any of your attributes conflict with a new builtin function or keyword like `texture` or `sample`, this method will throw an error.

## License

MIT, see [LICENSE.md](http://github.com/Jam3/glsl-100-to-300/blob/master/LICENSE.md) for details.
