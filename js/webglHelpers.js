GLHelpers = function() {

const bytesPerFloat = 4;
const bytesPerShort = 2;

var log = function(_msg) {
  if (window.console && window.console.log) 
  {
    window.console.log(_msg);
  }
};

var error = function(_msg) {
  if (window.console && window.console.error) 
  {
    window.console.error(_msg);
  } 
  else 
  {
    log(_msg);
  }
};

var floatBytes = function(_numElements)
{
  return bytesPerFloat * _numElements;
};

var unsignedShortBytes = function(_numElements)
{
  return bytesPerShort * _numElements;
};

var createProgram = (function() {
  var program = null;
  var uniforms = {};

  function loadShader(_gl, _shaderId, _shaderType)
  {
    var shaderElement = document.getElementById(_shaderId);
    if (!shaderElement)
    {
      error("Could not find shader " + _shaderId + "!");
      return null;
    }

    var shader = _gl.createShader(_shaderType);
    _gl.shaderSource(shader, shaderElement.text);
    _gl.compileShader(shader);
    if (!_gl.getShaderParameter(shader, _gl.COMPILE_STATUS) && !_gl.isContextLost())
    {
      error("Error compiling shader " + _shaderId + ": " + _gl.getShaderInfoLog(shader))
      _gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  return function createProgram(_gl, _vertexShaderId, _fragmentShaderId, _attributes)
  {
    var vertexShader = loadShader(_gl, _vertexShaderId, _gl.VERTEX_SHADER);
    var fragmentShader = loadShader(_gl, _fragmentShaderId, _gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader)
    {
      return null;
    }

    program = _gl.createProgram();
    _gl.attachShader(program, vertexShader);
    _gl.attachShader(program, fragmentShader);

    _gl.deleteShader(vertexShader);
    _gl.deleteShader(fragmentShader);

    for (var i = 0; i < _attributes.length; ++i)
    {
      _gl.bindAttribLocation(program, i, _attributes[i]);
    }

    _gl.linkProgram(program);
    if (!_gl.getProgramParameter(program, _gl.LINK_STATUS) && !_gl.isContextLost())
    {
      error("Error linking program: " + _gl.getProgramInfoLog(program));
      _gl.deleteProgram(program);
      return null;
    }

    var numUniforms = _gl.getProgramParameter(program, _gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < numUniforms; ++i)
    {
      var uniformInfo = _gl.getActiveUniform(program, i);
      uniforms[uniformInfo.name] = _gl.getUniformLocation(program, uniformInfo.name);
    }

    var returnObject = {glName: program};
    returnObject.use = function(_gl)
    {
      _gl.useProgram(program);
    };

    returnObject.getUniformLocation = function(_name)
    {
      return uniforms[_name];
    };

    return Object.freeze(returnObject);
  };
})();

var makeCube = (function() {
  var arrayBuffer = null;
  var indexBuffer = null;
  var numIndicies = 0;
  var objXform = mat4.create();
  var modelView = mat4.create();

  return function makeCube(_gl, _width, _height, _depth)
  {
    var halfWidth = _width * 0.5;
    var halfHeight = _height * 0.5;
    var halfDepth = _depth * 0.5;

    var verts = new Float32Array(
        /*    x           y            z        u   v   Nx  Ny  Nz   */
        [ // Front face
          -halfWidth, -halfHeight, +halfDepth,  0,  0,  +0, +0, +1,
          +halfWidth, -halfHeight, +halfDepth,  1,  0,  +0, +0, +1,
          +halfWidth, +halfHeight, +halfDepth,  1,  1,  +0, +0, +1,
          -halfWidth, +halfHeight, +halfDepth,  0,  1,  +0, +0, +1,

          // Back face
          +halfWidth, -halfHeight, -halfDepth,  0,  0,  +0, +0, -1,
          -halfWidth, -halfHeight, -halfDepth,  1,  0,  +0, +0, -1,
          -halfWidth, +halfHeight, -halfDepth,  1,  1,  +0, +0, -1,
          +halfWidth, +halfHeight, -halfDepth,  0,  1,  +0, +0, -1,

          // Right face
          +halfWidth, -halfHeight, +halfDepth,  0,  0,  +1, +0, +0,
          +halfWidth, -halfHeight, -halfDepth,  1,  0,  +1, +0, +0,
          +halfWidth, +halfHeight, -halfDepth,  1,  1,  +1, +0, +0,
          +halfWidth, +halfHeight, +halfDepth,  0,  1,  +1, +0, +0,

          // Left face
          -halfWidth, -halfHeight, +halfDepth,  1,  0,  -1, +0, +0,
          -halfWidth, -halfHeight, -halfDepth,  0,  0,  -1, +0, +0,
          -halfWidth, +halfHeight, -halfDepth,  0,  1,  -1, +0, +0,
          -halfWidth, +halfHeight, +halfDepth,  1,  1,  -1, +0, +0,

          // Top face
          -halfWidth, +halfHeight, +halfDepth,  0,  0,  +0, +1, +0,
          +halfWidth, +halfHeight, +halfDepth,  1,  0,  +0, +1, +0,
          +halfWidth, +halfHeight, -halfDepth,  1,  1,  +0, +1, +0,
          -halfWidth, +halfHeight, -halfDepth,  0,  1,  +0, +1, +0,

          // Bottom face
          +halfWidth, -halfHeight, -halfDepth,  0,  0,  +0, -1, +0,
          -halfWidth, -halfHeight, -halfDepth,  1,  0,  +0, -1, +0,
          -halfWidth, -halfHeight, +halfDepth,  1,  1,  +0, -1, +0,
          +halfWidth, -halfHeight, +halfDepth,  0,  1,  +0, -1, +0,
        ]);

    var indicies = new Uint8Array(
        [ 0, 1, 2, 0, 2, 3, // Front face
          6, 7, 4, 4, 5, 6, // Back face
          8, 9, 10, 8, 10, 11, // Right face
          12, 15, 14, 14, 13, 12, // Left face
          19, 16, 17, 18, 19, 17, // Top face
          20, 23, 22, 22, 21, 20, // Bottom face
        ]);

    arrayBuffer = _gl.createBuffer();
    _gl.bindBuffer(_gl.ARRAY_BUFFER, arrayBuffer);
    _gl.bufferData(_gl.ARRAY_BUFFER, verts, _gl.STATIC_DRAW);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
    
    indexBuffer = _gl.createBuffer();
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, indicies, _gl.STATIC_DRAW);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, null);

    numIndicies = indicies.length;

    return Object.freeze({width: _width, height: _height, depth: _depth, xform: objXform,
        draw: function(_gl, _viewMatrix, _program)
        {
            mat4.multiply(modelView, objXform, _viewMatrix);
            _gl.uniformMatrix4fv(_program.getUniformLocation("uMVMatrix"), false, modelView);

            _gl.bindBuffer(_gl.ARRAY_BUFFER, arrayBuffer);
            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

            // Position
            _gl.enableVertexAttribArray(0);
            _gl.vertexAttribPointer(0, 3, _gl.FLOAT, false, floatBytes(8), 0);

            // UV
            _gl.enableVertexAttribArray(1);
            _gl.vertexAttribPointer(1, 2, _gl.FLOAT, false, floatBytes(8), floatBytes(3));

            // Normal
            _gl.enableVertexAttribArray(2);
            _gl.vertexAttribPointer(2, 3, _gl.FLOAT, false, floatBytes(8), floatBytes(5));

            _gl.drawElements(_gl.TRIANGLES, numIndicies, _gl.UNSIGNED_BYTE, 0);
        }
    });
  };
})();

var loadTexture = (function()
{
  image = new Image();
  glName = null;

  function needsMipmaps(_gl, _filter)
  {
    switch (_filter)
    {
      case _gl.NEAREST_MIPMAP_NEAREST:
      case _gl.NEAREST_MIPMAP_LINEAR:
      case _gl.LINEAR_MIPMAP_NEAREST:
      case _gl.LINEAR_MIPMAP_LINEAR:
        return true;
        break;
      default:
        break;
    }

    return false;
  }

  function onLoad(_gl, _format, _magFilter, _minFilter)
  {
    glName = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, glName);
    _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
    _gl.texImage2D(_gl.TEXTURE_2D, 0, _format, _format, _gl.UNSIGNED_BYTE, image);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _magFilter);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _minFilter);
    if (needsMipmaps(_minFilter))
    {
      _gl.generateMipmap(_gl.TEXTURE_2D);
    }
    _gl.bindTexture(_gl.TEXTURE_2D, null);
    image = null;
  }

  function bindToUnit(_gl, _unit)
  {
    _gl.activeTexture(_unit);
    _gl.bindTexture(_gl.TEXTURE_2D, glName);
  }

  return function loadTexture(_gl, _path, _format, _magFilter, _minFilter)
  {
    image.onload = function()
    {
      onLoad(_gl, _format, _magFilter, _minFilter);
    };
    image.src = _path;

    return Object.freeze(
      {bindToUnit: bindToUnit});
  };
})();

return Object.freeze(
  { error: error,
    log: log,
    createProgram: createProgram,
    loadTexture: loadTexture,
    makeCube: makeCube,
    floatBytes: floatBytes,
    unsignedShortBytes: unsignedShortBytes
  });
}();
