function createLoadDeps(execlib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;

  function dodaThrow (string1, string2) {
    throw new lib.Error(string1, string2);
  }

  function getmodulename (side, modulename) {
    var ret = recognizemodule.bind(null, side, modulename);
    side = null;
    modulename = null;
    return ret;
  }

  function recognizemodule (side, modulename) {
    var r, ret;
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
    ret = r.then(onmodulename.bind(null, side, modulename));
    side = null;
    modulename = null;
    return ret;
  };

  function onAdditionalGroup (r) {
    var registry = execlib.execSuite && execlib.execSuite.additionalRegistries && execlib.execSuite.additionalRegistries.get(r.group);
    if (registry) {
      return registry.register(r.modulename);
    }
    console.error('Unable to load registry for type '+r.group);
    dodaThrow('MISSING_REGISTRY', 'Unable to load registry for type '+r.group);
  }

  function onmodulename (side, modulename, r) {
    var registry;
    try {
    if (!r || lib.isString(r)) dodaThrow('NON_ALLEX_MODULE', 'Unable to recognize '+modulename+' as Allex module');
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
    var ret;
    ret = (new qlib.PromiseExecutionMapReducerJob(modules.map(getmodulename.bind(null, side)), null, cb)).go();
    side = null;
    return qlib.promiseerror2console(ret);
  }
  return loadDependencies;
}

module.exports = createLoadDeps;
