const WebSocket = require( 'ws' );

function awaitOpenWeird( websocket, iterationCount = 100 ) {
  let ctr = iterationCount;
  return new Promise( (resolve,reject)=>{
    let ctr2=iterationCount;

    const exec = ()=>{
      console.log( 'ctr2', ctr2 );
      if ( 0 < ctr2--  ) {
        websocket.on( 'open', ()=>{
          console.log( 'ctr', ctr );
          if ( --ctr === 0 ) {
            resolve();
          }
        });
        setTimeout( exec, 100 );
        // exec();
      }
    };
    exec();
  });
}
module.exports.awaitOpenWeird = awaitOpenWeird;


function await_websocket( websocket ) {
  let flag = false;
  return new Promise( (resolve,reject)=>{
    switch ( websocket.readyState ) {
      case WebSocket.CONNECTING :
        websocket.on( 'open', ()=>{
          if ( ! flag ) {
            flag = true;
            resolve();
          }
        });
        break;
      case WebSocket.OPEN :
        resolve();
        break;
      case WebSocket.CLOSING :
      case WebSocket.CLOSED :
      default:
        reject();
        break;
    }
  });
}
module.exports.await_websocket = await_websocket;


function create_websocket( ws_spec ) {
  if ( typeof ws_spec === 'string' ) {
    return new WebSocket( ws_spec );
  } else {
    return ws_spec;
  }
}
module.exports.create_websocket = create_websocket;



async function await_sleep( t ) {
  await new Promise((resolve,reject)=>{
    setTimeout( resolve, t );
  });
  return true;
}
module.exports.await_sleep = await_sleep;
