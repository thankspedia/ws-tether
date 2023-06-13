const { AsyncContext }      = require( 'asynchronous-context' );
const { set_typesafe_tags } = require( 'runtime-typesafety' );
const { middleware, METHOD_POST } = require( './http-middleware' );

function p(o) {
  return set_typesafe_tags( o, METHOD_POST );
}
function q(o) {
  return o;
}

class Hello extends AsyncContext {
  hello = p({
    world : p({
      foo : p({
        bar : p({
          baz : p(async function baz() {
            return 'hello world foo bar baz !!!!!!!';
          }),
        }),
      }),
    }),
  });

  hello2 = p({
    world : p({
      foo : p({
        bar : q({
          baz : p(async function baz() {
            return 'hello world foo bar baz !!!!!!!';
          }),
        }),
      }),
    }),
  });

  hello3 = p({
    world : p({
      foo : p({
        bar : q({
          baz : p(async function baz() {
            throw new Error( 'hello world foo bar baz !!!!!!!');
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

Hello.defineMethod(
  async function hello_world() {
    return 'hello world !!';
  },
  METHOD_POST,
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);

Hello.defineMethod(
  async function say_hello() {
    this.send_ws_message(
      "Okay, your request was received."
    );
    return 'hello';
  },
  METHOD_POST,
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);

async function multiple(...args) {
  return [ ... args ];
}
Hello.defineMethod( multiple, METHOD_POST,{
  unprotected_output : true,
});



Hello.defineMethod(
  async function throw_hello_world() {
    throw new Error( 'hello world !!');
  },
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);



function createContext() {
  return Hello.create();
}

module.exports.createContext = createContext;

