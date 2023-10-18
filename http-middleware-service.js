
{
  require( 'asynchronous-context/env' ).config();
}

const express    = require('express');
const cors       = require( 'cors' );
const {
  startService,
  validateSettings,
} = require('./service.js');
const { filenameOfSettings, asyncReadSettings } = require( 'asynchronous-context/settings' );
const { loadContextFactory  } = require( './context-factory-loader.js' );

/*
 * loadService : function(
 *   input: array(
 *     serviceSettings : object(
 *     ),
 *   )
 *   output : array_of(
 *     object(
 *       start : function(),
 *       stop  : function(),
 *     ),
 *   ),
 * )
 *
 */
const loadService = ( serviceSettings )=>{
  let {
    ports               = [ 2000 ],
    cors_origins        = default_cors_origins,
    context_factory     = (()=>{throw new Error('context_factory is not defined')})(),
    purge_require_cache = false,
  } = serviceSettings;

  console.log( `Starting a middleware service with context_factory=${context_factory}` );

  const contextFactory = loadContextFactory( context_factory, purge_require_cache );

  const createApp = ()=>{
    // Initializing the app.
    const app = express();

    // app.use(require('morgan')('dev'));
    app.use( (req,res,next)=>{
      console.log( 'req.path', req.path );
      next();
    });

    app.use( cors( { origin : cors_origins } ) );
    app.use( '/api',  require( './http-middleware' ).create( contextFactory ));
    app.use( '/blank', (req,res,next)=>{
      res.json({status:'succeeded', value:'blank' }).end();
    });

    return app;
  };

  const server_list =[];
  return [
    {
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
    }
  ];
};
module.exports.loadService = loadService;


const startHttpMiddlewareService = ()=>{
  const createService =
    async ()=>{
      const settings         = validateSettings( await asyncReadSettings() );
      const serviceSettings  = settings?.async_context_backend ?? {};
      return loadService( serviceSettings );
    };

  startService( createService );
};
module.exports.bootService                = startHttpMiddlewareService;


if ( require.main === module ) {
  startHttpMiddlewareService();
}
