
import { create_callapi        } from './callapi.mjs' ;
import { http_callapi_handler  } from './http-callapi.mjs' ;

export function createContext( nargs ) {
  const callapi_handler = http_callapi_handler;
  return create_callapi( { ...nargs, http_method : 'POST', callapi_handler  });
}


