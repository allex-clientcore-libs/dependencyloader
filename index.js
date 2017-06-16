function createLoadDeps(execlib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;

  function dodaThrow (lib, string1, string2) {
    throw new lib.Error(string1, string2);
  }

  function getmodulename (side, modulename) {
    return recognizemodule.bind(null, side, modulename);
  }

  function recognizemodule (side, modulename) {
    var r;
    switch (modulename) {
      case '.':
        r = q({
          modulename: '.',
          group: 'services'
        });
        break;
      case '.authentication':
        r = q({
          modulename: '.authentication',
          group: 'services'
        });
        break;
      default: 
        r = lib.moduleRecognition(modulename);
        break;
    }
    return r.then(onmodulename.bind(null, side, modulename));
  };

  function onAdditionalGroup (r) {
    var registry = execlib.execSuite && execlib.execSuite.additionalRegistries && execlib.execSuite.additionalRegistries.get(r.group);
    if (registry) {
      return registry.register(r.modulename);
    }
    console.error('Unable to load registry for type '+r.group);
    dodaThrow(lib, 'MISSING_REGISTRY', 'Unable to load registry for type '+r.group);
  }

  function onmodulename (side, modulename, r) {
    var registry;
    try {
    if (!r || lib.isString(r)) dodaThrow(lib, 'NON_ALLEX_MODULE', 'Unable to recognize '+modulename+' as Allex module');
    switch (r.group) {
      case 'services':
        registry = execlib.execSuite.registry;
        if (side === 'server') {
          return registry.registerServerSide(r.modulename);
        }
        if (side === 'client') {
          return registry.registerClientSide(r.modulename);
        }
        throw lib.Error('INVALID_LOAD_DEPENDENCIES_SIDE', side);
        break;
      case 'libs':
        return execlib.execSuite.libRegistry.register(r.modulename);
      default:
        return onAdditionalGroup(r);
    }
    } catch(e) {
      console.error(e.stack);
      console.error(e);
    }
  }

  function loadDependencies (side, modules, cb){
    var s = side, ret;
    ret = (new qlib.PromiseExecutionMapReducerJob(modules.map (getmodulename.bind(null, s)), null, cb)).go();
    s = null;
    return ret;
  }
  return loadDependencies;
}

module.exports = createLoadDeps;
