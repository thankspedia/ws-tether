
function purgeRequireCache() {
  Object.entries( require.cache ).map( ([key,value])=>{
    delete require.cache[ key ];
  });
}

function loadContextFactory( /* the package name of */ path_to_context_factory, purge_require_cache ) {
  if ( typeof path_to_context_factory  !== 'string' || path_to_context_factory.trim().length === 0 ) {
    throw new Error( `package name is invalid : the specified value '${ path_to_context_factory }' is '${typeof path_to_context_factory }'` );
  }

  if ( typeof purge_require_cache  !== 'boolean' ) {
    throw new Error( `purge_require_cache is invalid : the specified value '${ purge_require_cache }' is '${typeof purge_require_cache }'` );
  }

  if ( purge_require_cache ) {
    return (
      async function() {
        purgeRequireCache();

        // always get fresh, and the latest createContext() function
        return require( path_to_context_factory ).createContext();
      }
    );
  } else {
    return (
      async function() {
        // purgeRequireCache();

        // always get fresh, and the latest createContext() function
        return require( path_to_context_factory ).createContext();
      }
    );
  }
}
module.exports.loadContextFactory = loadContextFactory;
