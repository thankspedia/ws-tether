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
  async function how_are_you(a,b,c) {
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

module.exports.createContext = createContext;

