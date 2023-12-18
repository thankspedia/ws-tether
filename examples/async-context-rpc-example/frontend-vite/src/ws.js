
import { AsyncContext   } from 'asynchronous-context' ;
import { createContext  } from 'asynchronous-context-rpc/ws-frontend-callapi-context-factory' ;
import { create_websocket, await_websocket, await_sleep } from 'asynchronous-context-rpc/ws-utils' ;
import { set_typesafe_tags } from 'runtime-typesafety' ;

import  {
 t_handle_message,
 t_respapi_message,
 handle_on_message_of_ws_frontend_respapi,
 on_init_websocket_of_ws_frontend_respapi,
} from 'asynchronous-context-rpc/ws-frontend-respapi.mjs' ;

// class AsyncContext {
// }

function p(o) {
  return set_typesafe_tags( o, 'WEBSOCKET_METHOD' );
}

function createTimer( proc ) {
  function set( proc, interval ){
    return setTimeout(()=>{
      try {
        proc();
      } catch (e) {
        console.error(e);
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

export class Hello  extends AsyncContext {
  constructor(event_handlers){
    super();
    this.event_handlers = event_handlers;
    this.flag_succeded = false;
  }
}

Hello.prototype.fine_thank_you = p(
  async function fine_thank_you(...args) {
    alert('fine_thank_you');
    console.log( 'hooray!' , ...args );
    this.flag_succeded = true;
    // this.websocket.close();
    // test_state.__service.shutdown();
    // await this.backend.how_are_you(...args);
  },
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);


Hello.prototype.poke = p(
  async function poke(nargs,info) {
    console.log( 'poke!' , nargs );
    alert(nargs.message);
  },
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);

Hello.prototype.start = p(
  async function start() {
    await this.backend.how_are_you(1,2,3);
  },
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);

export class WS extends EventTarget {
  __time = new Date();

  frontendContext = null;
  backendContext = null;
  interval = null;
  websocket = null;

  constructor( context = (()=>{throw new Error()})(), interval = 3000 ) {
    super();
    this.frontendContext = context;
    this.timer = createTimer( this.proc.bind( this ) );
    this.interval = interval;
  }
  __on_online = function () {
    console.log( 'on_online' );
    this.start();
  }.bind(this);

  __on_offline = function (){
    console.log( 'on_offline' );
    this.stop();
  }.bind(this);

  start() {
    if ( ! this.timer.running ) {
      if ( typeof window !== 'undefined' ) {
        window.addEventListener( 'online', this.__on_online );
        window.addEventListener( 'offline', this.__on_offline );

        if ( navigator.onLine ) {
          this.timer.start( this.interval );
        }
      } else {
        this.timer.start( this.interval );
      }
    }
  }
  stop(){
    if ( this.timer.running ) {
      this.timer.stop();
      if ( this.websocket !== null ) {
        this.websocket.close();
      }
      this.websocket = null;
      this.backendContext  = null;
    }
  }

  async proc(){
    console.log( 'proc 0' , '__time', this.__time, '__backend', this.backendContext );
    if ( this.websocket === null ) {
      console.log( 'proc() initialize' , this.__time );

      const websocket = create_websocket( 'ws://schizostylis.local:3632/foo' );

      websocket.addEventListener( 'open', async()=>{
        console.log( 'WebSocket', 'opened' );

        const {context:backendContext} =  await createContext({ websocket:this.websocket });
        console.log( 'proc 2' , backendContext );

        this.backendContext = backendContext;

        console.log( 'proc 3' , this.frontendContext );

        this.frontendContext.backend   = backendContext;
        this.frontendContext.websocket = websocket;

        on_init_websocket_of_ws_frontend_respapi( websocket, this.frontendContext );
      });

      websocket.addEventListener( 'close', ()=>{
        console.log( 'WebSocket', 'closed' );
        this.websocket = null;
        this.frontendContext.backend = null
        this.frontendContext.websocket = null
      });

      this.websocket = websocket;
      this.dispatchEvent( new Event( 'connect', {} ) );

      await await_websocket( websocket );
    }
  }
}

