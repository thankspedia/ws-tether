require( 'dotenv' ).config();

const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );
const { WebSocket } = require( 'ws' );

let testService = null;

const host_object = {
  foo: {
    bar : {
      hello : function( a,b ) {
      },
    },
  },
};

const filter = (v, allowed_fields =[ 'reason','status_code'])=>({
  ...v,
  value :
    Object.fromEntries(
      Object
        .entries(v.value)
        .filter( ([k,v])=>allowed_fields.includes(k)))
});

describe( 'http-middleware-test', ()=>{
  before(()=>{
  });
  after(()=>{
  });

  it( 'as no.1' , async()=>{
    const ws = new WebSocket('ws://localhost:3952/foo');

    ws.on('error', (...args)=>{
      console.error('error!', ...args );
    });

    ws.on('open', function open() {
      setTimeout(()=>{
        ws.send(JSON.stringify({
          method_path : [ 'ws_hello_world', ],
          method_args : [ 1, 2, 3 ],
        }));
      },1000);
    });

    ws.on('message', function message(__data) {
      const data = JSON.parse( __data.toString() );
      console.log( 'received a message', data );

      if ( data.message === 'shutdown immediately' ) {
        console.log( data );
        console.log( 'okay,sir' );
        ws.close();
      }
    });
  });
});

