const { AsyncContext }       = require( 'asynchronous-context' );
const { set_typesafe_tags } = require( 'runtime-typesafety' );
const { middleware, METHOD_POST } = require( './middleware' );

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
  })
}

async function hello_world() {
  return 'hello world !!';
}
Hello.defineMethod( hello_world, METHOD_POST,{
  unprotected_output : true,
});

async function multiple(...args) {
  return [ ... args ];
}
Hello.defineMethod( multiple, METHOD_POST,{
  unprotected_output : true,
});

function createContext() {
  return Hello.create();
}

module.exports.createContext = createContext;

