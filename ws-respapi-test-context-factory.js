const { AsyncContext }            = require( 'asynchronous-context' );
const { set_typesafe_tags }       = require( 'runtime-typesafety' );
const { middleware, METHOD_POST } = require( './http-middleware' );

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
  async function ws_hello_world() {
    setTimeout( ()=>{
      this.send_ws_message({
        message : 'shutdown immediately',
      });
    },500);
    return 'hello world !!';
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

module.exports.createContext = createContext;

