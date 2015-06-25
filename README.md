# glsl-token-transpile-300

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Transpile GLSL source tokens from version `"100"` (WebGL1) to `"300 es"` (WebGL2).

## Example

Source:

```js
var transpile = require('glsl-token-transpile-300')
var tokenize = require('glsl-tokenizer')
var stringify = require('glsl-token-string')

var tokens = transpile.fragment(tokenize(inputShader))
console.log(stringify(tokens))
```

Input fragment shader:

```glsl
#version 100
varying vec2 vUv;
uniform sampler2D iChannel0;

void main() {
  vec4 fragColor = vec4(0.5);
  gl_FragColor = texture2D(iChannel0, vUv);
}
```

The resulting WebGL2 shader:

```glsl
#version 300 es
in vec2 vUv;
out vec4 fragColor_1;
uniform sampler2D iChannel0;

void main() {
  vec4 fragColor = vec4(0.5);
  fragColor_1 = texture(iChannel0, vUv);
}
```

## Usage

[![NPM](https://nodei.co/npm/glsl-token-transpile-300.png)](https://www.npmjs.com/package/glsl-token-transpile-300)

Operates on [GLSL tokens](https://www.npmjs.com/package/glsl-tokenizer), but ignoring `column`, `position` and `line`.

#### `transpile.vertex(tokens)`

Transpiles the `tokens` array from a vertex shader and modifies them in place, to allow the code to run in a WebGL2 context.

In this case, `varying` will be converted to `out`.

Returns the `tokens` array.

#### `transpile.fragment(tokens)`

Same as above, but handles fragment shaders, where `varying` will be converted to `in`.

## Limitations

Currently, if you have variable names that are using WebGL2 builtins, e.g. `texture` or `transpose`, your shader will not run.

## License

MIT, see [LICENSE.md](http://github.com/Jam3/glsl-token-transpile-300/blob/master/LICENSE.md) for details.
