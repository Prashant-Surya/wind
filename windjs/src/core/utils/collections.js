
export function extend<T>(target, ...sources) {
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
