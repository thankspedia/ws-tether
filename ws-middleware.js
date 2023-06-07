
const { WebSocketServer } = require( 'ws' );
const { parse } = require( 'url');

function createWebSocketUpgrader( on_connection ) {
  const wss = new WebSocketServer({ noServer: true });
  wss.on( 'connection', on_connection );
  return ( request, socket, head )=>{
    wss.handleUpgrade( request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  };
}
module.exports.createWebSocketUpgrader = createWebSocketUpgrader;

const createMultipleWebSocketUpgrader = ( mapper )=>{
  return async function handle_upgrade(request, socket, head) {
    const { pathname } = parse( request.url );
    console.log( 'handle_upgrade : ', pathname );
    if ( pathname in mapper ) {
      console.log( `handle_upgrade to [${pathname}]` );
      await mapper[ pathname ]( request, socket, head )
    } else {
      socket.destroy();
    }
  };
};
module.exports.createMultipleWebSocketUpgrader = createMultipleWebSocketUpgrader;

function createAsyncContextWebsocketConnectionHandler( contextFactory ) {
  return (
    async function on_connection1(ws) {
      const context = await contextFactory();
      context.ws = ws;
      ws.on('error', console.error);
      ws.on('message', async function message(data) {
        data = data.toString('utf-8');
        console.log( 'received No.1: %s', data );
        console.log( 'context.hello_world', await context.hello_world() );
        ws.send( 'shutdown immediately' );
      });
    }
  );
}
module.exports.createAsyncContextWebsocketConnectionHandler = createAsyncContextWebsocketConnectionHandler;


