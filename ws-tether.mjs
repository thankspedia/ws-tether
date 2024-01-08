
const WS_TETHER = '[ws-tether]';
const WS_MANAGER = '[ws-manager]';

//
// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
//

const CONNECTING =  0; // Socket has been created. The connection is not yet open.
const OPEN       =  1; // The connection is open and ready to communicate.
const CLOSING    =  2; // The connection is in the process of closing.
const CLOSED     =  3; // The connection is closed or couldn't be opened.

const READY      = -1;
const DONE       =  5;

function createTimer( proc ) {
  function set( proc, interval ){
    return setTimeout(async ()=>{
      try {
        // BE AWARE! : proc could be an async function. (Tue, 26 Dec 2023 15:56:48 +0900)
        await proc();
      } catch (e) {
        console.error( 'createTimer', e );
      }
      if ( __running ) {
        set( proc, interval );
      }
    }, interval );
  }
  function reset( handle ) {
    clearTimeout( handle );
  }
  //------------

  let __running = false;
  let __handle =null;
  return {
    id : Math.trunc( Math.random() * 65536),
    get running() {
      return __running;
    },
    start( interval ) {
      if ( ! __running ) {
        __running = true;
        __handle = set( proc, interval );
      }
    },
    stop() {
      if ( __running ) {
        __running = false;
        reset( __handle );
        __handle = null;
      }
    }
  };
}

class WebSocketManager {
  id                 = null;
  tether             = null;
  webSocketFactory   = null;
  currentWebSocket   = null;
  currentThrownError = null;
  currentError       = null;
  currentOpen        = null;
  currentClosed      = null;

  __on_open    = function (e) {
    this.currentOpen = true;
    console.log( WS_MANAGER, 'on_open',    this.tether?.id ?? '[already disabled]' );
    try {
      this.tether?.__on_open(e);
    } catch (e){
      console.error(e);
    }
  }.bind(this);

  __on_close   = function (e) {
    this.currentClosed = true;
    console.log( WS_MANAGER, 'on_close',   this.tether?.id ?? '[already disabled]' );
    try {
      this.tether?.__on_close(e);
    } catch (e){
      console.error(e);
    }
  }.bind(this);

  __on_error   = function (e) {
    this.currentError = true;
    console.log( WS_MANAGER, 'on_error',   this.tether?.id ?? '[already disabled]' );
    try {
      this.tether?.__on_error(e);
    } catch(e){
      console.error(e);
    }
  }.bind(this);

  __on_message = function (e) {
    console.log( WS_MANAGER, 'on_message', this.tether?.id ?? '[already disabled]' );
    try {
      this.tether?.__on_message(e);
    } catch (e){
      console.error(e);
    }
  }.bind(this);

  constructor({ tether, webSocketFactory }) {
    this.tether           = tether;
    this.webSocketFactory = webSocketFactory;
  }

  enable() {
    try {
      this.currentWebSocket   = null;
      this.currentThrownError = false;
      this.currentError       = false;
      this.currentOpen        = false;
      this.currentClosed      = false;
    } catch (e) {
      console.error( WS_TETHER, 'enable()' , this.id, e );
    }

    try {
      this.currentWebSocket = this.webSocketFactory();
      // If it reaches to here, open/error event should be fired.
    } catch (e) {
      this.currentThrownError = true;
      console.error( WS_TETHER, 'enable() create' , this.id, e );
    }

    if ( ! this.currentThrownError ) {
      try {
        this.currentWebSocket.addEventListener( 'open', this.__on_open );
      } catch (e) {
        console.error( WS_TETHER, 'enable() create' , this.id, e );
      }
      try {
        this.currentWebSocket.addEventListener( 'close', this.__on_close );
      } catch (e) {
        console.error( WS_TETHER, 'enable() create' , this.id, e );
      }
      try {
        this.currentWebSocket.addEventListener( 'error', this.__on_error );
      } catch (e) {
        console.error( WS_TETHER, 'enable() create' , this.id, e );
      }
      try {
        this.currentWebSocket.addEventListener( 'message', this.__on_message );
      } catch (e) {
        console.error( WS_TETHER, 'enable() create' , this.id, e );
      }
    }
  }

  disable() {
    try {
      this.tether = null;
    } catch (e) {
      console.error(e);
    }

    try {
      if ( this.currentWebSocket ) {
        this.currentWebSocket.close();
      }
    } catch (e) {
      console.error(e);
    }

    try {
      this.currentWebSocket = null;
    } catch (e) {
      console.error(e);
    }
  }
}


export class WebSocketTether /* extends EventTarget */ {
  id                 = Math.trunc( Math.random() * 65536 );
  webSocketFactory   = null;
  interval           = null;

  isOnline           = null;
  timer              = null;
  initialized        = false;
  webSocketManager   = null;

  constructor(nargs) {
    // super();
    const {
      webSocketFactory    = (()=>{throw new Error('webSocketFactory is not specified')})(),
      interval            = 1000,
      on_initialization   = ()=>{},
      on_finalization     = ()=>{},
      on_online           = ()=>{},
      on_offline          = ()=>{},
      on_open             = ()=>{},
      on_close            = ()=>{},
      on_error            = ()=>{},
      on_message          = ()=>{},
    } = nargs;

    this.webSocketFactory    = webSocketFactory;
    this.interval            = interval;
    this.timer               = createTimer( this.proc.bind( this ) );
    this.on_initialization   = on_initialization;
    this.on_finalization     = on_finalization;
    this.on_online           = on_online;
    this.on_offline          = on_offline;
    this.on_open             = on_open;
    this.on_close            = on_close;
    this.on_error            = on_error;
    this.on_message          = on_message;

    if ( typeof navigator !== 'undefined' ) {
      if ( navigator.onLine ) {
        this.isOnline = true;
      } else {
        this.isOnline = false;
      }
    } else {
      // XXX If navigator object does not exist, it should be on a server.
      // Shoud it ever be online? (Thu, 28 Dec 2023 20:31:45 +0900)
      this.isOnline = false;
    }
  }

  __on_online = function () {
    console.log( 'on_online', this.id );
    this.isOnline = true;
    try {
      this.on_online(this);
    } catch (e) {
      console.error(e);
    }
  }.bind(this);

  __on_offline = function () {
    console.log( 'on_offline', this.id );
    this.isOnline = false;
    try {
      this.on_offline(this);
    } catch (e) {
      console.error(e);
    }
  }.bind(this);

  /*
   * The Necesity of 'initialize'/'finalize'
   *
   * In React, unmounted components are not necessarily garbage collected;
   * therefore, unless the unmounted components are properly uninitialized, the
   * event handlers that are registered with the unmounted components would be
   * got called.
   *
   * Additionaly calling addEventListener() multiple times with a same event
   * handler results being duplicately registered; this also causes event
   * handlers that are related to unmounted components got called.
   */
  initialize() {
    if ( ! this.initialized ) {
      try {
        this.initialized = true;
      } catch (e) {
        console.error( WS_TETHER,'error was occured and ignored', e );
      }

      try {
        if ( typeof window !== 'undefined' ) {
          window.removeEventListener( 'online',  this.__on_online );
          window.removeEventListener( 'offline', this.__on_offline );
          window.addEventListener( 'online',  this.__on_online );
          window.addEventListener( 'offline', this.__on_offline );
        }
      } catch (e) {
        console.error( WS_TETHER,'error was occured and ignored', e );
      }

      try {
        this.on_initialization(this);
      } catch (e) {
        console.error(e);
      }

      try {
        this.#start();
      } catch (e) {
        console.error( WS_TETHER,'error was occured and ignored', e );
      }
    }
  }

  finalize() {
    try {
      if ( typeof window !== 'undefined' ) {
        window.removeEventListener( 'online',  this.__on_online  );
        window.removeEventListener( 'offline', this.__on_offline );
      }
    } catch (e) {
      console.error( WS_TETHER,'error was occured and ignored', e );
    }

    try {
      this.on_finalization(this);
    } catch (e) {
      console.error(e);
    }

    try {
      this.#stop();
    } catch (e) {
      console.error( WS_TETHER,'error was occured and ignored', e );
    }

    try {
      this.initialized = false;
    } catch (e) {
      console.error( WS_TETHER,'error was occured and ignored', e );
    }
  }

  #start() {
    if ( ! this.timer.running ) {
      this.timer.start( this.interval );
    }
  }

  #stop() {
    if ( this.timer.running ) {
      this.timer.stop();
    }
  }

  __on_open    = function ( ...args) {
    console.log( WS_TETHER, 'on_open', this.id );
    // this.dispatchEvent( new CustomEvent( "open",    { detail: { webSocket : e.target             }}));
    try {
      this.on_open.call( this, ...args );
    } catch (e) {
      console.error('ws-tether.on_open',e);
    }
  }.bind(this);

  __on_close   = function (...args) {
    console.log( WS_TETHER, 'on_close', this.id );
    // this.dispatchEvent( new CustomEvent( "close",   { detail: { webSocket : e.target             }}));
    try {
      this.on_close.call(this,...args);
    } catch (e) {
      console.error('ws-tether.on_close',e);
    }
  }.bind(this);

  __on_error   = function ( ...args ) {
    console.log( WS_TETHER, 'on_error', this.id );
    // this.dispatchEvent( new CustomEvent( "error",   { detail: { webSocket : e.target             }}));
    try {
      this.on_error.call( this, ...args );
    } catch (e) {
      console.error('ws-tether.on_error',e);
    }
  }.bind(this);

  __on_message = function ( ...args) {
    console.log( WS_TETHER, 'on_message', this.id );
    // this.dispatchEvent( new CustomEvent( "message", { detail: { webSocket : e.target, message:e  }}));
    try {
      this.on_message.call( this, ...args );
    } catch (e) {
      console.error( 'ws-tether.on_message', e );
    }
  }.bind(this);

  async proc() {
    console.log( WS_TETHER, 'proc 0' , 'id ', this.id, 'timer.id' , this?.timer?.id ?? 'null' );

    if ( this.webSocketManager === null ) {
      console.log( WS_TETHER, 'proc() create' , this.id );
      if ( this.isOnline ) {
        try {
          this.webSocketManager = new WebSocketManager({
            tether           : this,
            webSocketFactory : this.webSocketFactory,
          });
        } catch (e) {
          console.error( WS_TETHER, 'proc() open' , this.id, e );
        }

        try {
          this.webSocketManager.enable();
        } catch (e) {
          console.error( WS_TETHER, 'proc() enable' , this.id, e );
          try {
            this.webSocketManager.disable();
          } catch (e){
            console.error( WS_TETHER, 'proc() disable' , this.id, e );
          }
          try {
            this.webSocketManager = null;
          } catch (e){
            console.error( WS_TETHER, 'proc() nullify' , this.id, e );
          }
        }
      }
    } else {
      if (
        this.webSocketManager.currentThrownError ||
        this.webSocketManager.currentClosed  ||
        this.webSocketManager.currentError   ||
        false
      ) {
        try {
          this.webSocketManager.disable();
        } catch (e){
          console.error(e);
        }
        try {
          this.webSocketManager = null;
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}
