
const express    = require('express');
const cors       = require( 'cors' );
const {
  startService,
  createServer,
  asyncReadBackendSettings,
} = require('./service.js');
const { loadContextFactory  } = require( './context-factory-loader.js' );

const {
  createWebSocketUpgrader,
  createMultipleWebSocketUpgrader,
  createAsyncContextWebsocketConnectionHandler,
} = require( './ws-middleware' );



function on_connection1(ws) {
  ws.on('error', console.error);
  ws.on('message', function message(data) {
    console.log( 'received No.1: %s', data );
    ws.send('shutdown immediately');
  });
}

function on_connection2(ws) {
  ws.on('error', console.error);
  ws.on('message', function message(data) {
    console.log( 'received No.2: %s', data );
  });
}


if ( require.main === module ) {
  const createSocketUpgrader = async ()=>{
    const settings = await asyncReadBackendSettings();
    const {
      ports               = [ 3000 ],
      cors_origins        = default_cors_origins,
      context_factory     = (()=>{throw new Error('context_factory is not defined')})(),
      purge_require_cache = false,
    } = settings?.async_context_websocket_backend ?? {};

    const contextFactory = loadContextFactory( context_factory, purge_require_cache );

    return createMultipleWebSocketUpgrader({
      '/foo' :
      createWebSocketUpgrader(
        createAsyncContextWebsocketConnectionHandler(
          contextFactory )),
    });
  };

  const createServiceFactory = ( handle_upgrade )=>{
    return (
      async ()=>{

        const createApp = ()=>{
          // Initializing the app.
          const app = express();
          // app.use( cors( { origin : cors_origins } ) );
          // app.use(require('morgan')('dev'));
          app.use( (req,res,next)=>{
            console.log( 'req.path', req.path );
            next();
          });
          return app;
        };

        const servers  = [ createApp() ];
        const services = [ ];
        return [{
          start() {
            services.push(
              ...(
                servers.map(
                  e=>{
                    const server = e.listen(
                      3952,
                      ()=>{
                        console.log( 'ws-server opened' );
                      }
                    );
                    server.on('upgrade', handle_upgrade );
                    return server;
                  }
                )
              )
            );
          },

          stop() {
            services.forEach( e=>e.close(()=>{
              console.log( 'ws server closed' );
            }));
            services.length = 0;
          },
        }];
      }
    );
  };

  (async()=>{
    startService( createServiceFactory( await createSocketUpgrader() ) );
  })();
}

