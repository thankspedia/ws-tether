
const __WebSocket = typeof WebSocket === 'undefined' ? (await import('ws')).WebSocket : WebSocket;

// const WEBSOCKET ={
//   CONNECTING : 0,  // Socket has been created. The connection is not yet open.
//   OPEN       : 1,  // The connection is open and ready to communicate.
//   CLOSING    : 2,  // The connection is in the process of closing.
//   CLOSED     : 3,  // The connection is closed or couldn't be opened.
// };
//
// Object.assign( __WebSocket, WEBSOCKET );

/*
 * Polyfill for ws module which has no addEventHandler for some reason.
 */
if ( typeof (__WebSocket.prototype.addEventHandler) === 'undefined' ) {
  // console.warn( 'WebSocket.prototype.addEventHandler === undefined' ) ;
  __WebSocket.prototype.addEventHandler = function(...args) {
    return this.on( ...args );
  };
}

const __createWebSocket = (...args)=>new __WebSocket(...args);

export {
  __WebSocket       as WebSocket,
  __createWebSocket as createWebSocket,
};

