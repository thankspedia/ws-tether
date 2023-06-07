require( 'dotenv' ).config();

const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );
const { WebSocket } = require( 'ws' );

let testService = null;

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
      setTimeout( ()=>{
        const data = `hello`;
        ws.send(data);
      },1000);
    });

    ws.on('message', function message(data) {
      console.log( 'received a message', data );
      const s = data.toString();
      if ( s === 'shutdown immediately' ) {
        console.log( s );
        console.log( 'okay,sir' );
        ws.close();
      }
    });
  });

});

