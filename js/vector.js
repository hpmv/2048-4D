function Vector(dim, values) {
  if (!values) {
    values = [];
    for (var i = 0; i < dim; i++) {
      values.push(0);
    }
  } else {
    values = values.slice(0);
  }
  values.dim = dim;
  values.copy = function () {
    return Vector(dim, values);
  };
  values.add = function (other) {
    if (other.dim != dim) {
      throw "Cannot add vectors with unequal length";
    }
    var result = values.copy();
    for (var i = 0; i < dim; i++) {
      result[i] += other[i];
    }
    return result;
  };
  values.equals = function (other) {
    if (dim != other.dim) return false;
    for (var i = 0; i < dim; i++) {
      if (values[i] != other[i]) return false;
    }
    return true;
  };
  return values;
}

function uniformVector(dim, value) {
  var result = Vector(dim);
  for (var i = 0; i < dim; i++) {
    result[i] = value;
  }
  return result;
}
