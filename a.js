
const express    = require('express');
const WebSocket = require( 'ws' );

function create_websocket( ws_spec ) {
  if ( typeof ws_spec === 'string' ) {
    return new WebSocket( ws_spec );
  } else {
    return ws_spec;
  }
}

const sleep = (s)=>new Promise((resolve,reject)=>{
  setTimeout( resolve , s );
});

(async ()=>{
  const websocket_list = new Set();
  const connection_list = [];
  const server = express().listen(8080);
  server.on( 'connection', (c)=>{
    console.log( 'connection' );
    connection_list.push(c);
  });
  server.on( 'upgrade', ()=>{
    const wss = new WebSocket.WebSocketServer({ noServer: true });
    wss.on( 'connection', ( websocket, req )=>{
      websocket_list.add( websocket );
      return on_init_websocket( websocket, req );
    });
    return ( request, socket, head )=>{
      wss.handleUpgrade( request, socket, head, function done(websocket) {
        websocket_list.add( websocket );
        wss.emit('connection', websocket, request);
      });
    };
  });

  console.log('1');

  await sleep(1000);

  console.log('2');

  const client_socket = create_websocket( 'ws://localhost:8080' );

  console.log('3');

  await sleep(1000);

  console.log('4');

  server.close();

  await sleep(1000);

  console.log('5');

  await sleep(1000);

  for ( const i of websocket_list ) {
    console.log( 'close' );
    i.close();
  }

  await sleep(1000);

  console.log('6');

  await sleep(1000);

  for ( const i of connection_list ) {
    console.log( 'destroy' );
    i.destroy();
  }
  console.log('7');

})().then(e=>{ console.log('then',e) }).catch( e=>{ console.error('catch',e) } );;
