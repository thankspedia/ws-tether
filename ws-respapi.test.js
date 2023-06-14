
require( 'dotenv' ).config();


const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );
const { AsyncContext } = require( 'asynchronous-context' );
const { METHOD_POST  } = require( 'asynchronous-context-backend' );

const { schema, trace_validator } = require( 'vanilla-schema-validator' );
const { create_callapi } = require( './callapi.js' );
const { websocket_callapi_handler } = require( './ws-callapi' );
const { create_websocket, await_websocket, await_sleep } = require( './ws-utils.js' );
const { set_typesafe_tags } = require( 'runtime-typesafety' );
const { respapi } = require( './respapi.js' );

const {
  asyncCreateWebsocketServerContext,
} = require( './ws-callapi-context-factory' );

const t_respapi_message = schema.compile`
  object(
    command_type : string(),
    command_value : object(
      method_path : array_of( string() ),
      method_args : array_of( any() ),
    ),
  )
`();

function p(o) {
  return set_typesafe_tags( o, 'WEBSOCKET_METHOD' );
}

class HelloWorld extends AsyncContext {
  constructor(event_handlers){
    super();
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

HelloWorld.defineMethod(
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
HelloWorld.defineMethod(
  async function start() {
    await this.backend.hello_world();
  },
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);

function createContext(...args) {
  return HelloWorld.create(...args);
}


const t_handle_message = schema.compile`
  object(
    context   : object(),
    websocket : object(),
    data      : object(),
  ),
`();

async function handle_websocket_message( nargs ) {
  {
    const info = trace_validator( t_handle_message, nargs );
    if ( ! info.value ) {
      throw new Error( 'invalid args ' + info.report() );
    }
  }

  const {
    context,
    websocket,
    data,

  } = nargs;

  const message = JSON.parse( data.toString() );
  {
    const info = trace_validator( t_respapi_message, message );
    if ( ! info.value ) {
      throw new Error( 'invalid message' + info.report() );
    }
  }


  const respapi_result  =
    await respapi(
      /* callapi_target */
      context,

      /* callapi_method_path */
      message.command_value.method_path,

      /* http-method as TAGS */
      'WEBSOCKET_METHOD',

      /* on_execution */
      async ( resolved_callapi_method )=>{

        // (Mon, 05 Jun 2023 20:07:53 +0900)
        // await context_initializer.call( context, resolved_callapi_method );

        /*
         * Invoking the Resolved Method
         */
        const target_method      = resolved_callapi_method.value
        const target_method_args = message.command_value.method_args;
        return await (context.executeTransaction( target_method, ... target_method_args ));
      },
    );

  console.log( 'received No.1: %s', data );
  console.log( 'respapi_result', respapi_result );
  // console.log( 'context.hello_world', await context.hello_world() );

  return context

}


/*
 * See :
 * ```
 *    const { create_backend_websocket_initializer } = require( './ws-middleware' );
 * ```
 */

function on_init_websocket( websocket, context ) {
  websocket.on( 'message', (data)=>{
    return handle_websocket_message({
      context,
      websocket,
      data,
    });
  });
  websocket.on( 'error', (...args)=>{
    console.error( ...args );
  });
}


describe( ()=>{
  it('as test1', async()=>{

    class Hello extends AsyncContext {
      constructor(event_handlers){
        super();
        this.event_handlers = event_handlers;
      }
    }

    Hello.defineMethod(
      async function fine_thank_you(...args) {
        console.log( 'hooray!' , ...args );
        await this.backend.how_are_you(...args);
      },
      'WEBSOCKET_METHOD',
      {
        unprotected_output : true,
      }
    );

    Hello.defineMethod(
      async function start() {
        await this.backend.how_are_you(1,2,3);
      },
      'WEBSOCKET_METHOD',
      {
        unprotected_output : true,
      }
    );

    const websocket = create_websocket( 'ws://localhost:3001/foo' );

    const context = Hello.create();
    context.backend = create_callapi({
      callapi_handler : websocket_callapi_handler,
      websocket,
    });

    on_init_websocket( websocket, context );
    await await_websocket( websocket );

    await context.start();
    await await_sleep( 1000 );
    websocket.close();

  });


//  it('as test2', async()=>{
//    const p = new Promise( async (resolve,reject)=>{
//      const { context } = await on_init_websocket();
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
