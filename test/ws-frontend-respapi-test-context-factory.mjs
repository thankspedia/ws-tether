import { AsyncContext }                from   'asynchronous-context'  ;
import { set_typesafe_tags }           from   'runtime-typesafety'  ;
import { METHOD_POST }     from   'asynchronous-context-rpc/http-middleware.mjs'  ;

function p(o) {
  return set_typesafe_tags( o, 'WEBSOCKET_METHOD' );
}

class Hello extends AsyncContext {
  hello = p({
    world : p({
      foo : p({
        bar : p({
          baz : p(async (...args)=>{
            this.send_ws_message({
              message : [ 'okay', ...args ],
            });
          }),
        }),
      }),
    }),
  });
}

Hello.defineMethod(
  async function how_are_you(a,b,c) {
    /*
     * See `ws-backend-respapi.js`.
     * (Fri, 16 Jun 2023 14:01:43 +0900)
     */
    await this.frontend.fine_thank_you( a+1, b+1, c+1 );
  },
  METHOD_POST,
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);


function createContext() {
  return Hello.create();
}

export { createContext };

