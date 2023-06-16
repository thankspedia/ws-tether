
const fs         = require( 'fs' );
const path       = require( 'node:path' );

function startFileSytemWatchdog( /*either async and non-async */ onDetected, watchingFile  = './' ) {
  let modifiedTime = new Date().getTime();
  let processed    = true;
  let __filename = '';
  let handle = -1;

  // throttling the file change events.
  {
    console.log(`[asynchronous-context-backend] watching for file changes on ${path.resolve( watchingFile)}`);

    fs.watch( watchingFile, (event, filename)=>{
      // console.log({ event, filename } );
      if (filename && event ==='change') {
        // console.log(`[asynchronous-context-backend] ${filename} file Changed`);
        __filename = filename;
        modifiedTime = new Date();
        processed = true;
      }
    })
  }

  {
    handle = setInterval( async ()=>{
      try {
        // console.log(`[fs-watchdog] checking`);
        const now = new Date().getTime();
        if ( processed && ( 101 < (now - modifiedTime) ) ) {
          console.log(`[fs-watchdog] ${__filename} file Changed`);
          processed = false;
          // `onDetected` function can be either async or non-async.
          await onDetected();
        }
      } catch (e) {
        console.error( '[fs-watchdog] could not start specified services : ',e);
      }
    },100);
  }
  return {
    shutdown : ()=>{
      console.log( 'shutdown the watchdog' );
      clearInterval( handle );
    },
  };
}

module.exports.startFileSytemWatchdog = startFileSytemWatchdog;
