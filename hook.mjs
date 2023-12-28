
import React from 'react';
import { WebSocketTether } from './ws-tether.mjs';


export function useWebSocketTether( ...args ) {
  const ref = React.useRef( new WebSocketTether( ...args ) );

  React.useEffect(()=>{
    console.log( '[ws-tether/hook]', 'mounted', ref.current.id );
    ref.current.initialize();
    return ()=>{
      console.log( '[ws-tether/hook]', 'umounted', ref.current.id );
      ref.current.finalize();
    };
  });
  return ref.current;
}

