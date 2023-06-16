
const express    = require('express');
const cors       = require( 'cors' );
const {
  startService,
  asyncReadBackendSettings,
} = require('./service.js');
const { loadContextFactory  } = require( './context-factory-loader.js' );

const {
  create_websocket_upgrader,
  create_multi_path_upgrade_handler,
  on_init_websocket_of_ws_backend,
} = require( './ws-backend-respapi.js' );

const { typecast, schema  } = require( 'vanilla-schema-validator' );
const { typesafe_function } = require( 'runtime-typesafety' );

const create_service_factory = ( create_app, ports, handle_upgrade )=>{
  create_app = typesafe_function( create_app, {
    typesafe_input : schema.compile`array()`,
    typesafe_output : schema.compile`array_of(
      any(),
    )`,
  });

  function wrap(server) {
    return server;
  }

  return (
    async ()=>{
      const services = [];
      const sockets = new Set();
      return ports.map(
        port=>(
          {
            start() {
              services.push(
                ...(
                  create_app().map(
                    e=>{
                      const server = e.listen(
                        port,
                        (e)=>{
                          console.log( 'ws-server opened', 'C3FXWHjYwU0' );
                        }
                      );

                      server.on( 'error', (e)=>{
                        console.error( 'server-error', e );
                      })

                      server.on( 'connection', (socket)=>{
                        console.log( 'sZYTMC4A0I', 'connection');

                        sockets.add( socket );

                        socket.on( 'close', ()=>{
                          console.log( 'sZYTMC4A0I', 'socket.close()' );
                        })

                        socket.on( 'data', ()=>{
                          console.log( 'sZYTMC4A0I', 'socket.data()' );
                        })
                      });
                      server.on( 'upgrade', handle_upgrade );
                      return wrap(server);
                    }
                  )
                )
              );
              console.log('nTPf8R8RExE', {services} );
            },

            stop() {
              services.forEach( e=>e.close(
                (e)=>{
                  if ( e ) {
                    console.error( 'ws-server closed(with error)', e, 'C3FXWHjYwU0' );
                  } else {
                    console.log( 'ws-server closed', 'C3FXWHjYwU0' );
                  }
                }
              ));
              services.length = 0;
              console.log('nTPf8R8RExE', {services} );

              console.log( 'ws-server closed 2', 'C3FXWHjYwU0' );
              for ( const i of sockets.values() ) {
                i.destroy();
              }
            },
          }
        )
      );
    }
  );
};
module.exports.create_service_factory = create_service_factory;

schema.define`
  t_start_service_for_ws_backend : object(
    create_context : function(),
    event_handlers  : any(),
    path  : string(),
    ports : array_of(
      number()
    ),
  ),
`;
const start_service_for_ws_backend = (nargs)=>{
  const {
    create_context,
    event_handlers,
    ports,
    path
  } = typecast( schema.t_start_service_for_ws_backend(), nargs );

  const create_app = ()=>{
    // Initializing the app.
    const app = express();
    // app.use( cors( { origin : cors_origins } ) );
    // app.use(require('morgan')('dev'));
    app.use( (req,res,next)=>{
      console.log( 'req.path', req.path );
      next();
    });
    return [app];
  };

  return startService(
    create_service_factory(
      create_app,
      ports,
      create_multi_path_upgrade_handler(
        {
          [path] : (
            create_websocket_upgrader(
              async function on_init_websocket( websocket, req ) {
                on_init_websocket_of_ws_backend({ create_context, event_handlers, websocket, req });
              }
            )
          ),
        }
      )
    )
  );
};
module.exports.start_service_for_ws_backend = start_service_for_ws_backend;

if ( require.main === module ) {

  (async ()=>{
    const settings = await asyncReadBackendSettings();
    const {
      ports               = [ 2000 ],
      cors_origins        = default_cors_origins,
      context_factory     = ((name)=>{throw new Error( `${name} is not defined` )})('context_factory'),
      path                = ((name)=>{throw new Error( `${name} is not defined` )})('path'),
      purge_require_cache = false,
    } = settings?.async_context_websocket_backend ?? {};

    const event_handlers = {};

    const create_context = loadContextFactory( context_factory, purge_require_cache );

    start_service_for_ws_backend({
      create_context,
      event_handlers,
      path  ,
      ports ,
    });
  })();
}




