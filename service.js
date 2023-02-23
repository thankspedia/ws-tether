
const fs         = require( 'fs' );
const path       = require( 'path' );
const process    = require( 'process' );
const express = require('express');
const cors       = require( 'cors' );
const { settingFile, asyncReadSettings } = require( 'async-context/settings' );
const { schema } = require( 'vanilla-schema-validator' );
require( './schema' ).init( schema );
require( 'authentication-context/schema' ).init( schema );

const DEBUG = false;

function purgeRequireCache() {
  // BE AWARE!!!
  // DISABLED (Thu, 12 Jan 2023 13:44:41 +0900)
  // BE AWARE!!!
  return ;

  Object.entries( require.cache ).map( ([key,value])=>{
    delete require.cache[ key ];
  });
}

function default_cors_origins( origin, callback ) {
  console.error( 'WARNING : NO CORS SETTING FILE WAS SPECIFIED. THIS CAUSES ALLOWING FOR ALL DOMAINS.' );
  callback( null, /.*/ )
}

function createContextFactory( packageName, doPurgeRequireCache = false ) {
  if ( typeof packageName  !== 'string' || packageName.trim().length === 0 ) {
    throw new Error( `package name was not specified : '$( packageName )' which type is '$(typeof packageName )'` );
  }

  if ( doPurgeRequireCache ) {
    return (
      async function() {
        purgeRequireCache();
        return require( packageName ).createContext();
      }
    );
  } else { 
    return (
      async function() {
        // purgeRequireCache();
        return require( packageName ).createContext();
      }
    );
  }
}



function createService( serviceSettings ) {
  if( DEBUG ) console.log( 'serviceSettings', serviceSettings );
  const {
    context_factory = (()=>{ throw new ReferenceError( "`contextFactory` must be specified" )})(),
    static_paths    = [ require.main.path+'/public' ],
    ports           = [2000],
    cors_origins    = default_cors_origins,
  } = serviceSettings;

  if (DEBUG) console.log( 'context_factory', context_factory );


  // Initializing the app.
  const app = express();

  // app.use(require('morgan')('dev'));
  app.use( (req,res,next)=>{
    if(DEBUG)console.log( 'req.path', req.path );
    next();
  });

  app.use( cors( { origin : cors_origins } ) );

  app.use( '/api',  require( './middleware' ).create( createContextFactory( context_factory, false ))); 
  app.use( '/blank', (req,res,next)=>{
    res.json({status:'succeeded', value:'blank' }).end();
  }); 

  for ( let i of static_paths  ) {
    app.use( express.static( i ) );
  }

  const servers=[];

  for ( let i of ports ) {
    servers.push( app.listen(i, () => {
      console.log( `[async-context-backend] an instance of async-context-web is listening at http://localhost:${i}` );
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
    console.log(`[async-context-backend] watching for file changes on ${path.resolve( watchingFile)}`);

    fs.watch( watchingFile, (event, filename)=>{
      // console.log({ event, filename } );
      if (filename && event ==='change') {
        // console.log(`[async-context-backend] ${filename} file Changed`);
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
          console.log(`[async-context-backend] ${__filename} file Changed`);
          processed = false;
          // `onDetected` function can be either async or non-async.
          await onDetected();
        }
      } catch (e) {
        console.error( '[async-context-backend] could not start specified services : ',e);
      }
    },100);
  }
}

function startService( serviceSettings = readServiceSettings ) {
  process.on( 'unhandledRejection', (reason, p) =>{
    console.error( '***Unhandled Rejection at Promise***','reason:', reason, 'promise:', p);
  });

  const __serviceSettings = (()=>{
    if ( typeof serviceSettings === 'function' ) {
      return serviceSettings;
    } else if ( typeof serviceSettings === 'string' ) {
      try {
        const serviceSettingsJSON = JSON.parse( serviceSettings );
        return async ()=>serviceSettingsJSON;
      } catch ( e ) {
        throw new TypeError( 'serviceSettings must be either a JSON string, a function or an object', {cause : e } );
      }
    } else if ( typeof serviceSettings === 'object' ) {
      return async ()=>serviceSettings;
    } else {
      throw new TypeError( 'serviceSettings must be either a JSON string, a function or an object' );
    }
  })();


  let serviceHandleStack = [];

  const restartService = async ()=>{
    console.log( '[async-context-backend] a watchdog detected updating file... restarting the server.' );
    serviceHandleStack.forEach( e=>e.shutdown() );
    serviceHandleStack.length = 0;

    purgeRequireCache();

    serviceHandleStack.push(
      createService( await __serviceSettings() )
    );
  };

  startFileSytemWatchdog( restartService, './' );
}
module.exports.startService = startService;

async function __readServiceSettings() {
  const json = (await asyncReadSettings( schema.t_async_context_service_settings() )).async_context_backend;
  if ( json.ports.length < 1 ) {
    console.error( `WARNING field 'ports' is missing in the setting file '${settingFile}' the default values are applied.` );
  }
  return json;
}

async function readServiceSettings() {
  try {
    const json = await __readServiceSettings();
    return (
      {
        context_factory  : json.context_factory,
        ports            : json.ports,
        static_paths     : json.static_paths,
        cors_origins     : json.cors_origins,
      }
    );
  } catch (err) {
    throw err;
  }
}

if ( require.main === module ) {
  startService( readServiceSettings );
}


