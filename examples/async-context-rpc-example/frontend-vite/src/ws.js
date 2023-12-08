
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

function createTimer( proc, millisecond ) {
  function set(){
    return setTimeout(()=>{
      try {
        proc();
      } catch (e) {
        console.error(e);
      }
      if ( flag ) {
        set();
      }
    }, 3000 );
  }
  function reset( handle ) {
    clearTimeout( handle );
  }
  //------------

  let flag = false;
  let handle =null;
  return {
    start() {
      if ( ! flag ) {
        flag = true;
        handle = set();
      }
    },
    stop() {
      if ( flag ) {
        flag = false;
        reset( handle );
        handle = null;
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

Hello.prototype.start = p(
  async function start() {
    await this.backend.how_are_you(1,2,3);
  },
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);

export class WS {
  __time = new Date();
  __check() {
    this.proc();
  }
  backend = null;
  constructor() {
    this.timer = createTimer( this.__check.bind( this ), 3000 );
  }

  start() {
    this.timer.start();
  }
  stop(){
    this.timer.stop();
  }
  async proc(){
    console.log( 'proc 0' , '__time', this.__time, '__backend', this.backend );
    if ( this.backend === null ) {
      console.log( 'proc() initialize' , this.__time );
      const websocket = create_websocket( 'ws://schizostylis.local:3632/foo' );
      this.websocket = websocket;
      const {context:backendContext} =  await createContext({ websocket:this.websocket });
      console.log( 'proc 2' , backendContext );
      this.backend = backendContext;

      const frontendContext = Hello.create();
      console.log( 'proc 3' , frontendContext );
      frontendContext.backend = backendContext;
      frontendContext.websocket = websocket;
      this.frontend = frontendContext;

      on_init_websocket_of_ws_frontend_respapi( websocket, frontendContext );
      await await_websocket( websocket );


    }
  }
}

