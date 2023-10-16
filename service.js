
const process    = require( 'process' );
const { filenameOfSettings, asyncReadSettings } = require( 'asynchronous-context/settings' );
const { schema } = require( 'vanilla-schema-validator' );
const { typesafe_function } = require( 'runtime-typesafety' );
const { preventUndefined } = require( 'prevent-undefined' );

require( './schema' ).init( schema );
require( 'authentication-context/schema' ).init( schema );

const { startFileSytemWatchdog } = require( './fs-watchdog.js' );

function startService( __createService ) {
  const createService = typesafe_function( __createService, {
    typesafe_input : schema.compile`array()`,
    typesafe_output : schema.compile`array_of(
      object(
        start : function(),
        stop : function(),
      ),
    )`,
  });

  /*
   * THIS is very important. Don't forget to set this; otherwise you'll get
   * unexpected shutdown of the node instance that you started.
   *
   * See : https://www.google.com/search?gl=us&q=unhandledRejection
   */
  process.on( 'unhandledRejection', (reason, p) =>{
    console.error( '***Unhandled Rejection at Promise***','reason:', reason, 'promise:', p );
  });

  let serverList = [];

  const asyncRestartServices = async ()=>{
    console.log( '[asynchronous-context-rpc] a watchdog detected updating file... restarting the server.' );
    serverList.forEach( e=>e.stop() );
    serverList.length = 0;
    serverList.push( ...(await createService()) );
    serverList.forEach( e=>e.start() );
  };

  const asyncShutdownServices = async ()=>{
    console.log( '[asynchronous-context-rpc] stop the service.' );
    serverList.forEach( e=>e.stop() );
    serverList.length = 0;
  };

  const watchdog =
    startFileSytemWatchdog( asyncRestartServices, './' );

  return {
    shutdown : ()=>{
      try{
        asyncShutdownServices();
      } catch (e){
        console.error(e);
      }
      try{
        watchdog.shutdown();
      } catch (e){
        console.error(e);
      }
    },
    restart  : asyncRestartServices,
  };
}
module.exports.startService = startService;

function createServer( createApp, ports ) {
  const server_list =[];
  return {
    start: async ()=>{
      if ( server_list.length === 0 ) {
        for ( let i of ports ) {
          const app = await createApp();
          server_list.push(
            app.listen( i,
              () => {
                console.log( `[asynchronous-context-rpc] an instance of asynchronous-context-web is listening at http://localhost:${i}` );
              }
            )
          );
        }
      }
    },
    stop : ()=>{
      server_list.forEach( e=>e.close() );
    },
  };
}
module.exports.createServer = createServer;

function default_cors_origins( origin, callback ) {
  callback( null, /.*/ )
}

const validateSettings = (settings) =>{
  const result = preventUndefined( settings ,  schema.t_async_context_service_settings() );

  if ( ( result?.async_context_backend?.ports?.length ?? 0 ) < 1 ) {
    console.error( `WARNING field 'ports' is missing in the setting file '${filenameOfSettings()}' the default values are applied.` );
  }
  if ( result.async_context_backend.cors_origins === 'ALLOW_ALL' ) {
    console.error( 'WARNING : CORS SETTING WAS SPECIFIED "ALLOW_ALL". THIS CAUSES ALLOWING FOR ALL DOMAINS.' );
    result.async_context_backend.cors_origins = default_cors_origins;
  }
  return result;
};
module.exports.validateSettings = validateSettings;

