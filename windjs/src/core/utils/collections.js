
export function extend(target, ...sources) {
  for (var i = 0; i < sources.length; i++) {
    var extensions = sources[i];
    for (var property in extensions) {
      if (extensions[property] && extensions[property].constructor &&
        extensions[property].constructor === Object) {
          target[property] = extend(
            target[property] || {}, extensions[property]
          );
        } else {
          target[property] = extensions[property];
        }
      }
    }
  return target;
}



export function objectApply(object, f) {
    for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            f(object[key], key, object);
        }
    }
}


export function values(object) {
    var values = [];
    objectApply(object, function(value) {
        values.push(value);
    });
    return values;
}


export function decycleObject(object){
	var objects = [],
	paths = [];

	return (function derez(value, path) {
		var i, name, nu;

		switch (typeof value) {
			case 'object':
				if (!value) {
				return null;
				}
				for (i = 0; i < objects.length; i += 1) {
					if (objects[i] === value) {
						return {$ref: paths[i]};
					}
				}

				objects.push(value);
				paths.push(path);

				if (Object.prototype.toString.apply(value) === '[object Array]') {
					nu = [];
					for (i = 0; i < value.length; i += 1) {
						nu[i] = derez(value[i], path + '[' + i + ']');
					}
					} else {
						nu = {};
						for (name in value) {
							if (Object.prototype.hasOwnProperty.call(value, name)) {
								nu[name] = derez(value[name],
								path + '[' + JSON.stringify(name) + ']');
							}
						}
					}
				return nu;
			case 'number':
			case 'string':
			case 'boolean':
			return value;
		}
	}(object, '$'));
}


export function safeJSONStringify(source){
	try {
		return JSON.stringify(source)
	} catch (e) {
		return JSON.stringify(decycleObject(source));
	}
}


export function arrayIndexOf(array, item) { // MSIE doesn't have array.indexOf
      var nativeIndexOf = Array.prototype.indexOf;
      if (array === null) {
              return -1;
            }
      if (nativeIndexOf && array.indexOf === nativeIndexOf) {
              return array.indexOf(item);
            }
      for (var i = 0, l = array.length; i < l; i++) {
              if (array[i] === item) {
                        return i;
                      }
            }
      return -1;
}

export function keys(object){
      var keys = [];
      objectApply(object, function(_, key) {
              keys.push(key);
            });
      return keys;
}


export function apply(array, f, context) {
    for (var i = 0; i < array.length; i++) {
        f.call(context || global, array[i], i, array);
    }
}

export function map(array, f) {
      var result = [];
      for (var i = 0; i < array.length; i++) {
              result.push(f(array[i], i, array, result));
            }
      return result;
}

export function all(array, test){
      for (var i = 0; i < array.length; i++) {
              if (!test(array[i], i, array)) {
                        return false;
                      }
            }
      return true;
}

export function any(array, test){
      for (var i = 0; i < array.length; i++) {
              if (test(array[i], i, array)) {
                        return true;
                      }
            }
      return false;
}
