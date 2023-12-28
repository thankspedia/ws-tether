

// import UtilWebSocket from "ws";

// const UtilWebSocket = ( typeof WebSocket !== 'undefined' ? WebSocket  :  await import( "ws" ) )

// const UtilWebSocket = await (async()=> typeof WebSocket !== 'undefined' ? WebSocket : await import('ws') )();
import { WebSocket } from "asynchronous-context-rpc/ws";

const WEBSOCKET = {
  CONNECTING : 0,  // Socket has been created. The connection is not yet open.
  OPEN       : 1,  // The connection is open and ready to communicate.
  CLOSING    : 2,  // The connection is in the process of closing.
  CLOSED     : 3,  // The connection is closed or couldn't be opened.
}

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
export { awaitOpenWeird as awaitOpenWeird };


function await_websocket( websocket ) {
  let flag = false;
  return new Promise( (resolve,reject)=>{
    switch ( websocket.readyState ) {
      case WebSocket.CONNECTING :
        // websocket.on
        websocket.addEventListener( 'open', ()=>{
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
        reject('the specified WebSocket is already closed');
        break;
    }
  });
}
export { await_websocket as await_websocket };


function create_websocket( ws_spec ) {
  if ( typeof ws_spec === 'string' ) {
    return new WebSocket( ws_spec );
  } else {
    return ws_spec;
  }
}
export { create_websocket as create_websocket };


async function await_sleep( t ) {
  await new Promise((resolve,reject)=>{
    setTimeout( resolve, t );
  });
  return true;
}
export { await_sleep as await_sleep  } ;

