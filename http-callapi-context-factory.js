
import { create_callapi        } from './callapi.js' ;
import { http_callapi_handler  } from './http-callapi' ;

export function createContext( nargs ) {
  const callapi_handler = http_callapi_handler;
  return create_callapi( { ...nargs, http_method : 'POST', callapi_handler  });
}


