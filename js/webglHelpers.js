GLHelpers = function() {

const bytesPerFloat = 4;
const bytesPerShort = 2;

/*********** Unexported helper functions *****************/
var floatBytes = function(_numElements)
{
  return bytesPerFloat * _numElements;
};

var unsignedShortBytes = function(_numElements)
{
  return bytesPerShort * _numElements;
};

var extensionSupported = function(_gl, _name)
{
  return _gl.getSupportedExtensions().indexOf(_name) !== -1;
}

/*********** Exported helper functions ******************/
var requireExtensions = function(_gl, _extensions)
{
  var applyExtension = function(_prevValue, _entry, _idx) 
  {
    if (!extensionSupported(_gl, _entry))
    {
      error("Missing required extension \"" + _entry + "\"");
      return false;
    }

    _gl.getExtension(_entry);

    return _prevValue;
  };

  if (!_extensions.reduce(applyExtension, true))
  {
    throw "Missing one or more required WebGL extensions!";
  }
}

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

/**************** Exported Classes ******************/

// Program
function Program(_gl, _vertexShaderId, _fragmentShaderId, _attributes)
{
  function loadShader(_gl, _shaderId, _shaderType)
  {
    var shaderElement = document.getElementById(_shaderId);
    if (!shaderElement)
    {
      throw ("Could not find shader " + _shaderId + "!");
    }

    var shader = _gl.createShader(_shaderType);
    _gl.shaderSource(shader, shaderElement.text);
    _gl.compileShader(shader);
    if (!_gl.getShaderParameter(shader, _gl.COMPILE_STATUS) && !_gl.isContextLost())
    {
      var compileLog = _gl.getShaderInfoLog(shader);
      _gl.deleteShader(shader);
      throw ("Error compiling shader " + _shaderId + ": " + compileLog)
    }

    return shader;
  }

  this.program = null;
  this.uniforms = {};
  this._gl = _gl;

  var vertexShader = loadShader(_gl, _vertexShaderId, _gl.VERTEX_SHADER);
  var fragmentShader = loadShader(_gl, _fragmentShaderId, _gl.FRAGMENT_SHADER);

  this.program = _gl.createProgram();
  _gl.attachShader(this.program, vertexShader);
  _gl.attachShader(this.program, fragmentShader);

  _gl.deleteShader(vertexShader);
  _gl.deleteShader(fragmentShader);

  for (var i = 0; i < _attributes.length; ++i)
  {
    _gl.bindAttribLocation(this.program, i, _attributes[i]);
  }

  _gl.linkProgram(this.program);
  if (!_gl.getProgramParameter(this.program, _gl.LINK_STATUS) && !_gl.isContextLost())
  {
    var linkLog = _gl.getProgramInfoLog(this.program);
    _gl.deleteProgram(this.program);
    throw ("Error linking program: " + linkLog);
  }

  var numUniforms = _gl.getProgramParameter(this.program, _gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < numUniforms; ++i)
  {
    var uniformInfo = _gl.getActiveUniform(this.program, i);
    this.uniforms[uniformInfo.name] = _gl.getUniformLocation(this.program, uniformInfo.name);
  }
};

Program.prototype.use = function()
{
  this._gl.useProgram(this.program);
};

Program.prototype.getUniformLocation = function(_name)
{
  return this.uniforms[_name];
};


// Cube
function Cube(_gl, _width, _height, _depth)
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

  this._arrayBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, this._arrayBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, verts, _gl.STATIC_DRAW);
  _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
  
  this._indexBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
  _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, indicies, _gl.STATIC_DRAW);
  _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, null);

  this._numIndicies = indicies.length;
  this._modelView = mat4.create();
  this._gl = _gl;

  this.xform = mat4.create();
  this.width = _width;
  this.height = _height;
  this.depth = _depth;
};

Cube.prototype.draw = function(_viewMatrix, _program)
{
    mat4.multiply(this._modelView, this.xform, _viewMatrix);
    this._gl.uniformMatrix4fv(_program.getUniformLocation("uMVMatrix"), false, this._modelView);

    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._arrayBuffer);
    this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

    // Position
    this._gl.enableVertexAttribArray(0);
    this._gl.vertexAttribPointer(0, 3, this._gl.FLOAT, false, floatBytes(8), 0);

    // UV
    this._gl.enableVertexAttribArray(1);
    this._gl.vertexAttribPointer(1, 2, this._gl.FLOAT, false, floatBytes(8), floatBytes(3));

    // Normal
    this._gl.enableVertexAttribArray(2);
    this._gl.vertexAttribPointer(2, 3, this._gl.FLOAT, false, floatBytes(8), floatBytes(5));

    this._gl.drawElements(this._gl.TRIANGLES, this._numIndicies, this._gl.UNSIGNED_BYTE, 0);
};


// Texture
function Texture(_gl, _format, _magFilter, _minFilter, _path, _type, _wrapMode, _width, _height)
{
  function needsMipmaps(_filter)
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

  function setupGLTexture(_srcImage, _type)
  {
    var glName = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, glName);

    if (_srcImage)
    {
      _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
      _gl.texImage2D(_gl.TEXTURE_2D, 0, _format, _format, _type, _srcImage);
    }
    else
    {
      if (!_type || !_width || !_height)
      {
        throw "Must provide type, width and height";
      }

      _gl.texImage2D(_gl.TEXTURE_2D, 0, _format, _width, _height, 0, _format, _type, null);
    }

    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _magFilter);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _minFilter);

    if (_wrapMode)
    {
      _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _wrapMode);
      _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _wrapMode);
    }

    if (needsMipmaps(_minFilter))
    {
      _gl.generateMipmap(_gl.TEXTURE_2D);
    }

    _gl.bindTexture(_gl.TEXTURE_2D, null);
    return glName;
  }

  this._gl = _gl;
  if (_path)
  {
    this._image = new Image();
    this._image.onload = (function(_texture) 
    {
      return function()
      {
        _texture._texture = setupGLTexture(_texture._image, _gl.UNSIGNED_BYTE); 
        _texture._image = null; 
      };
    })(this);
    this._image.src = _path;
  }
  else
  {
    this._image = null;
    this._texture = setupGLTexture(null, _type);
  }
};

Texture.prototype.bindToUnit = function(_unit)
{
  this._gl.activeTexture(_unit);
  this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
};

Texture.prototype.attachToFBO = function(_fbo, _attachmentPoint)
{
  _fbo.bind();
  this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, _attachmentPoint, 
    this._gl.TEXTURE_2D, this._texture, 0);
};


// Framebuffer
function Framebuffer(_gl)
{
  this._gl = _gl;
  this._fbo = _gl.createFramebuffer();
};

Framebuffer.prototype.bind = function()
{
  this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._fbo);
};


// ShadowMap
function ShadowMap(_gl, _width, _height)
{
  this._gl = _gl;
  this._texture = new Texture(_gl, _gl.DEPTH_COMPONENT, _gl.LINEAR, _gl.LINEAR, 
    null, _gl.UNSIGNED_INT, _gl.CLAMP_TO_EDGE, _width, _height);
  this.viewProjMatrix = mat4.create();
};

ShadowMap.prototype.bindToUnit = function(_unit)
{
  this._texture.bindToUnit(_unit);
};

ShadowMap.prototype.attachToFBO = function(_fbo)
{
  this._texture.attachToFBO(_fbo, this._gl.DEPTH_ATTACHMENT);
};

return Object.freeze(
  { error: error,
    log: log,
    requireExtensions: requireExtensions,
    Program: Program,
    Cube: Cube,
    Texture: Texture,
    Framebuffer: Framebuffer,
    ShadowMap: ShadowMap,
  });
}();
