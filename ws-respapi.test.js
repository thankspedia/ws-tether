
require( 'dotenv' ).config();


const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );
const { AsyncContext } = require( 'asynchronous-context' );
const { METHOD_POST  } = require( 'asynchronous-context-backend' );

function p(o) {
  return set_typesafe_tags( o, 'WEBSOCKET_METHOD' );
}

class Hello extends AsyncContext {
  constructor(event_handlers){
    this.event_handlers = event_handlers;
  }
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


function createContext(...args) {
  return Hello.create(...args);
}
const {
  asyncCreateWebsocketServerContext,
} = require( './ws-callapi-context-factory' );

async function asyncCreateContext(...args) {
  return asyncCreateWebsocketServerContext(
    'ws://localhost:3001/foo',
    ()=>createContext(...args)
  );
}

describe( ()=>{
  it('as test1', async()=>{
    const p = new Promise( async (resolve,reject)=>{
      await asyncCreateContext({
        on_open : (context)=>{
        },
        on_done : (context)=>{
          resolve();
        },
      });

      setTimeout( ()=>{
      }, 1000 );

      setTimeout( ()=>{
        // reject( new Error('timeout'))
        reject( new Error('not implemented'))
      }, 3000 );

      // await context.say_hello();
    });

    return await p;
  });

//  it('as test2', async()=>{
//    const p = new Promise( async (resolve,reject)=>{
//      const { context } = await asyncCreateContext();
//      const websocket = (await context.websocket() );
//      const close = ()=>websocket.close();
//
//      websocket.on( 'message', ( data )=>{
//        const v = JSON.parse( data.toString() );
//        console.log( 'hJGqsnbq5A4', v );
//        if ( v.message.join(',') === 'okay,hello,world,foo' ) {
//          resolve(v);
//        } else {
//          reject(v);
//        }
//        close();
//      });
//
//      setTimeout( ()=>{
//        reject('timeout')
//        close();
//      }, 1000 );
//
//      await (context.hello.world.foo.bar.baz( 'hello','world','foo' ));
//    });
//
//    //assert.equal( await ( context.hello_world( 'hello world !!' ) ) , 'hello world !!' );
//    return await p;
//  });

});
