
{
  require( 'asynchronous-context/env' ).config();
}

const express    = require('express');
const cors       = require( 'cors' );
const {
  startService,
  createServer,
  validateSettings,
} = require('./service.js');
const { filenameOfSettings, asyncReadSettings } = require( 'asynchronous-context/settings' );
const { loadContextFactory  } = require( './context-factory-loader.js' );

const startHttpMiddlewareService = ()=>{
  const createService =
    async ()=>{
      const settings = validateSettings( await asyncReadSettings() );
      const {
        ports               = [ 2000 ],
        cors_origins        = default_cors_origins,
        context_factory     = (()=>{throw new Error('context_factory is not defined')})(),
        purge_require_cache = false,
      } = settings?.async_context_backend ?? {};

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

      return [ createServer( createApp, ports ) ];
    };

  startService( createService );
};
module.exports. startHttpMiddlewareService = startHttpMiddlewareService;

if ( require.main === module ) {
  startHttpMiddlewareService();
}
