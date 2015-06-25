var version = require('glsl-version-regex')
var inject = require('glsl-token-inject-block')

module.exports.vertex = transpile100to300.bind(null, true)
module.exports.fragment = transpile100to300.bind(null, false)

function transpile100to300 (isVertex, tokens) {
  var oldVersion = versionify(tokens)
  if (oldVersion === '300 es') {
    // already in version 300, seems OK
    return tokens
  }

  var nameCache = {}
  var fragColorName = null
  var fragDepthName = null
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]
    if (token.type === 'keyword') {
      if (token.data === 'attribute') token.data = 'in'
      else if (token.data === 'varying') token.data = isVertex ? 'out' : 'in'
    }

    if (token.type === 'builtin' && /texture(2D|Cube)/.test(token.data)) {
      token.data = 'texture'
    }

    if (token.type === 'builtin' && !isVertex) {
      if (token.data === 'gl_FragColor') {
        if (!fragColorName) {
          fragColorName = getUniqueName(tokens, nameCache, 'fragColor')
          insertFragOutput(tokens, fragColorName, 'vec4')
        }
        token.data = fragColorName
      } else if (token.data === 'gl_FragDepth') {
        if (!fragDepthName) {
          fragDepthName = getUniqueName(tokens, nameCache, 'fragDepth')
          insertFragOutput(tokens, fragDepthName, 'float')
        }
        token.data = fragDepthName
      }
    }
  }

  return tokens
}

function getUniqueName (tokens, nameCache, name, baseName) {
  baseName = baseName || name // first time around

  for (var i = 0; i < tokens.length; i++) {
    var t = tokens[i]
    if (t.type === 'ident' && t.data === name) {
      if (baseName in nameCache) {
        nameCache[baseName]++
      } else {
        nameCache[baseName] = 0
      }
      var num = nameCache[baseName]
      return getUniqueName(tokens, nameCache, baseName + '_' + num, baseName)
    }
  }
  return name
}

function insertFragOutput (tokens, name, dataType) {
  // inserts it before the first "in/out/attribute/varying"
  inject(tokens, [
    // "out vec4 fragColor;"
    { type: 'keyword', data: 'out' },
    { type: 'whitespace', data: ' ' },
    { type: 'keyword', data: dataType },
    { type: 'whitespace', data: ' ' },
    { type: 'ident', data: name },
    { type: 'operator', data: ';' }
  ])
}

function versionify (tokens) {
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]
    if (token.type === 'preprocessor') {
      var match = version.exec(token.data)
      if (match) {
        var number = match[1].replace(/\s\s+/g, ' ')
        if (number === '300 es') {
          // this shader is already in 300 es
          return number
        } else if (number === '100') {
          tokens.splice(i, 1, {
            data: '#version 300 es',
            type: 'preprocessor'
          })
          return number
        } else {
          throw new Error('unknown #version type: ' + number)
        }
      }
    }
  }

  // no version found, insert into start
  tokens.splice(0, 0, {
    data: '#version 300 es',
    type: 'preprocessor'
  }, {
    data: '\n',
    type: 'whitespace'
  })

  return null
}
