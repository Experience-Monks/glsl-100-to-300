var version = require('glsl-version-regex')
var inject = require('glsl-token-inject-block')

module.exports.vertex = transpile100to300.bind(null, true)
module.exports.fragment = transpile100to300.bind(null, false)

var coreGLSLExtensions = [
  'GL_OES_standard_derivatives',
  'GL_EXT_frag_depth',
  'GL_EXT_draw_buffers',
  'GL_EXT_shader_texture_lod'
]

var reservedWords = require('./lib/builtins')

function transpile100to300 (isVertex, tokens) {
  var oldVersion = versionify(tokens)
  if (oldVersion === '300 es') {
    // already in version 300, seems OK
    return tokens
  }

  var nameCache = {}
  var reservedNameCache = {}
  var fragColorName = null
  var fragDepthName = null
  var i, token
  for (i = 0; i < tokens.length; i++) {
    token = tokens[i]
    if (token.type === 'keyword') {
      if (token.data === 'attribute') token.data = 'in'
      else if (token.data === 'varying') token.data = isVertex ? 'out' : 'in'
    } else if (token.type === 'builtin' && /texture(2D|Cube)/.test(token.data)) {
      token.data = 'texture'
    } else if (token.type === 'builtin' && !isVertex) {
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
    } else if (token.type === 'ident' && reservedWords.indexOf(token.data) >= 0) {
      if (isVertex && isAttribtue(tokens, i)) {
        throw new Error('Unable to transpile GLSL 100 to 300 automatically:\n' + 
            'One of the vertex shader attributes is using a reserved 300es keyword "' + token.data + '"')
      }
      if (!(token.data in reservedNameCache)) {
        reservedNameCache[token.data] = getUniqueName(tokens, nameCache, token.data)
      }
      token.data = reservedNameCache[token.data]
    }
  }

  for (i = tokens.length - 1; i >= 0; i--) {
    token = tokens[i]
    if (token.type === 'preprocessor') {
      var match = token.data.match(/\#extension\s+(.*)\s+\:/)
      if (match && match[1] && coreGLSLExtensions.indexOf(match[1]) >= 0) {
        var nextToken = tokens[i + 1]
        var count = (nextToken && nextToken.type === 'whitespace')
          ? 2 : 1
        tokens.splice(i, count)
      }
    }
  }

  return tokens
}

function isAttribtue (tokens, index) {
  for (var i = index - 1; i >= 0; i--) {
    var token = tokens[i]
    if (token.type === 'keyword') {
      if (token.data === 'attribute' || token.data === 'in') {
        return true
      }
    } else if (token.type === 'operator' ||
        token.type === 'float' ||
        token.type === 'ident' ||
        token.type === 'builtin' ||
        token.type === 'integer') {
      // If we hit another token, assume it's not an attribute
      return false
    }
  }
  return false
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
