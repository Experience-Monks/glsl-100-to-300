var version = require('glsl-version-regex')

module.exports = transpile100to300
function transpile100to300 (tokens, isVertex) {
  var oldVersion = versionify(tokens)
  if (oldVersion === '300 es') {
    // already in version 300, seems OK
    return
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

function getStartIndex (tokens) {
  // determine starting index for attributes
  var start = 0
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]
    if (token.type === 'preprocessor') {
      if (/^#(extension|version)/.test(token.data)) {
        start = Math.max(start, i + 1)
      }
    }
  }
  return start
}

function insertFragOutput (tokens, name, dataType) {
  // insert it before the first "in/out/attribute/varying"
  var start = getStartIndex(tokens)
  if (tokens[start] && /\n$/.test(tokens[start].data)) {
    tokens.splice(start++, 0, { type: 'whitespace', data: '\n' })
  }
  tokens.splice(start, 0,
    // "out vec4 fragColor;"
    { type: 'keyword', data: 'out' },
    { type: 'whitespace', data: ' ' },
    { type: 'keyword', data: dataType },
    { type: 'whitespace', data: ' ' },
    { type: 'ident', data: name },
    { type: 'operator', data: ';' }
  )
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