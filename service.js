
const fs         = require( 'fs' );
const path       = require( 'path' );
const process    = require( 'process' );
const express = require('express');
const cors       = require( 'cors' );
const { settingFile, asyncReadSettings } = require( 'asynchronous-context/settings' );
const { schema } = require( 'vanilla-schema-validator' );
require( './schema' ).init( schema );
require( 'authentication-context/schema' ).init( schema );

const DEBUG = false;

function purgeRequireCache() {
  Object.entries( require.cache ).map( ([key,value])=>{
    delete require.cache[ key ];
  });
}

function createContextFactory( /* the package name of */ context_factory, purge_require_cache ) {
  if ( typeof context_factory  !== 'string' || context_factory.trim().length === 0 ) {
    throw new Error( `package name is invalid : the specified value '${ context_factory }' is '${typeof context_factory }'` );
  }

  if ( typeof purge_require_cache  !== 'boolean' ) {
    throw new Error( `purge_require_cache is invalid : the specified value '${ purge_require_cache }' is '${typeof purge_require_cache }'` );
  }

  if ( purge_require_cache ) {
    return (
      async function() {
        purgeRequireCache();

        // always get fresh, and the latest createContext() function
        return require( context_factory ).createContext();
      }
    );
  } else {
    return (
      async function() {
        // purgeRequireCache();

        // always get fresh, and the latest createContext() function
        return require( context_factory ).createContext();
      }
    );
  }
}
module.exports.createContextFactory = createContextFactory;

function createContextFactoryFromSettings( settings ) {
  const context_factory     = settings?.async_context_backend?.context_factory ?? null;
  const purge_require_cache = settings?.async_context_backend?.purge_require_cache ?? false;

  // console.log( 'context_factory : ', context_factory );

  return createContextFactory( context_factory, purge_require_cache );
}
module.exports.createContextFactoryFromSettings = createContextFactoryFromSettings;


function default_cors_origins( origin, callback ) {
  console.error( 'WARNING : NO CORS SETTING FILE WAS SPECIFIED. THIS CAUSES ALLOWING FOR ALL DOMAINS.' );
  callback( null, /.*/ )
}

function createService( settings ) {
  if( DEBUG ) console.log( 'settings', settings );

  const {
    static_paths    = [ require.main.path + '/public' ],
    ports           = [ 2000 ],
    cors_origins    = default_cors_origins,
  } = settings?.async_context_backend ?? {};


  // Initializing the app.
  const app = express();

  // app.use(require('morgan')('dev'));
  app.use( (req,res,next)=>{
    if(DEBUG)console.log( 'req.path', req.path );
    next();
  });

  app.use( cors( { origin : cors_origins } ) );

  app.use( '/api',  require( './middleware' ).create( createContextFactoryFromSettings( settings )));
  app.use( '/blank', (req,res,next)=>{
    res.json({status:'succeeded', value:'blank' }).end();
  });

  for ( let i of static_paths  ) {
    app.use( express.static( i ) );
  }

  const servers=[];

  for ( let i of ports ) {
    servers.push( app.listen(i, () => {
      console.log( `[asynchronous-context-backend] an instance of asynchronous-context-web is listening at http://localhost:${i}` );
    }));
  }

  return {
    servers : servers,
    shutdown : ()=>{
      servers.forEach( e=>e.close() );
    },
  };
}
module.exports.createService = createService;



function startFileSytemWatchdog( /*either async and non-async */ onDetected, watchingFile  = './' ) {
  let modifiedTime = new Date().getTime();
  let processed    = true;
  let __filename = '';

  // throttling the file change events.
  {
    console.log(`[asynchronous-context-backend] watching for file changes on ${path.resolve( watchingFile)}`);

    fs.watch( watchingFile, (event, filename)=>{
      // console.log({ event, filename } );
      if (filename && event ==='change') {
        // console.log(`[asynchronous-context-backend] ${filename} file Changed`);
        __filename = filename;
        modifiedTime = new Date();
        processed = true;
      }
    })
  }

  {
    setInterval( async ()=>{
      try {
        const now = new Date().getTime();
        if ( processed && ( 101 < (now - modifiedTime) ) ) {
          console.log(`[asynchronous-context-backend] ${__filename} file Changed`);
          processed = false;
          // `onDetected` function can be either async or non-async.
          await onDetected();
        }
      } catch (e) {
        console.error( '[asynchronous-context-backend] could not start specified services : ',e);
      }
    },100);
  }
}

function startService( asyncReadSettings = asyncReadBackendSettings ) {
  process.on( 'unhandledRejection', (reason, p) =>{
    console.error( '***Unhandled Rejection at Promise***','reason:', reason, 'promise:', p);
  });

  let serviceHandleStack = [];

  const asyncRestartServices = async ()=>{
    console.log( '[asynchronous-context-backend] a watchdog detected updating file... restarting the server.' );
    serviceHandleStack.forEach( e=>e.shutdown() );
    serviceHandleStack.length = 0;

    // `purgeRequireCache()` WAS DISABLED ON (Thu, 12 Jan 2023 13:44:41 +0900)
    // Now it was re-enabled, then now the caller of the function is disabled here.
    // >>> COMMENTED OUT (Wed, 24 May 2023 11:40:54 +0900)
    // purgeRequireCache();
    // <<< COMMENTED OUT (Wed, 24 May 2023 11:40:54 +0900)

    serviceHandleStack.push(
      createService( await asyncReadSettings() )
    );
  };

  startFileSytemWatchdog( asyncRestartServices, './' );
}
module.exports.startService = startService;


async function asyncReadBackendSettings() {
  const settings = (await asyncReadSettings( schema.t_async_context_service_settings() )) ?? {};
  if ( ( settings?.async_context_backend?.ports?.length ?? 0) < 1 ) {
    console.error( `WARNING field 'ports' is missing in the setting file '${settingFile}' the default values are applied.` );
  }
  return settings;

  // return (
  //   {
  //     context_factory  : settings?.async_context_backend?.context_factory,
  //     ports            : settings?.async_context_backend?.ports,
  //     static_paths     : settings?.async_context_backend?.static_paths,
  //     cors_origins     : settings?.async_context_backend?.cors_origins,
  //   }
  // );
}
module.exports.asyncReadBackendSettings = asyncReadBackendSettings;

if ( require.main === module ) {
  startService( asyncReadBackendSettings );
}


