
{
  require( 'asynchronous-context/settings' ).filenameOfSettings( 'ws-respapi-test.settings.json' );
}

{
  // const fs = require('fs');
  // const path = require('path');
  // const dotenv_file = path.resolve(process.cwd(), '.env');
  // if ( ! fs.existsSync( dotenv_file ) ) {
  //   throw new Error( `.env file (${ dotenv_file }) is missing.` );
  // }
  require('dotenv').config();
}


Object.assign( require('util').inspect.defaultOptions, {
  depth  : null,
  colors : false,
  showHidden : false,
  maxStringLength : Infinity,
  // compact: false,
  // breakLength: 1000,
});

{
  // process.stdout.write('\u001b[3J\u001b[1J');
  // const { execSync } = require('child_process');
  // execSync('beep');
}
