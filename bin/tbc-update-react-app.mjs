#!/usr/local/bin/node

import fs from 'fs';
import path from 'path';

// sed "s/\(^import[^'\"]*\)['\"]\([^'\"]*\)['\"]\([ ;]*\)$/\1\"\2\";/g" App.js  | less

/**
 * *walkSync()
 * This generator function recursively lists all files in a specified directory.
 */
function *walkSync(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

/**
 * nthLastIndexOf()
 *
 * It works like String#lastIndexOf() but it allows you to specify the number from the
 * last index in the direction to the beginning of the specified string.
 */
function nthLastIndexOf( s, searchString, n ) {
  if ( s == null ) {
    return -1;
  }
  if ( ! n || isNaN(n) || n <= 0 ) {
    return s.lastIndexOf( searchString );
  } else {
    return s.lastIndexOf( searchString, nthLastIndexOf(s, searchString, n -1 ) - 1);
  }
}

/*
 * In webtbc, all file names are following the Filename Convension of `webtbc`.
 *
 * ex) foo.bar.baz.bum.foo.MyLovelyClassName.js
 *     [<- package name->] [<-  filename ->]
 *
 * baseModulename() retrieves the filename without the filename part.
 *
 * baseModulename( 'foo.bar.baz.bum.foo.MyLovelyClassName.js' )
 *
 * >> 'MyLovelyClassName.js'
 *
 */
function baseModulename( filename ) {
  const i = nthLastIndexOf(filename , '.' , 1 );
  if ( i<0 ) {
    return filename;
  } else {
    return filename.substring( i + 1 );
  }
}

/**
 * Returns the name part of the given filename without its path part.
 * Additionally it appends its extension part '.js' when it was omitted.
 *
 * baseFilename( 'foo/bar/bum/hello' )
 * > 'hello.js'
 */
function baseFilename( filename ) {
  if ( path.extname( filename ) == '' ) {
    filename = filename + '.js';
  }
  return path.basename( filename );
}


/**
 * Add to this list when you find a public module name conflicts
 * to any local module name. Any filename specified in this list
 * will be treated as is. It is replaced with its actual relative filename.
 */

const excludeFiles = [
  'util.js',
  'utils.js',
  'config.js',
  'configs.js',
];

/*
 * *.css files are treated as they are
 * *.js  files are stripped down to no-ext form.
 * (Thu, 22 Sep 2022 17:09:11 +0900)
 */
const argsFileExt = ['.js'];


/**
 *
 * All files are listed up. And it creates a map in which
 * the key is its basename part and the value is the actual
 * relative filename.
 *
 * "foo.bar.bum.baz.ClassName.js" is translated as :
 * {
 *   'ClassName':'foo.bar.bum.baz.ClassName.js
 * }
 */
function proc0() {
  const filenameDict = {};
  const filepathList = [];
  for (const filepath of walkSync( path.join( './', '' ))) {
    const bname = 
      baseModulename( 
        baseFilename( filepath, ...argsFileExt ) );

    if ( excludeFiles.includes( bname ) ) {
      continue;
    }

    filepathList.push( filepath );
    if ( bname in filenameDict  ) {
      console.error( 'warning : ' + bname + ' is already defined.' );
    }

    filenameDict[ bname ] = filepath;
    console.log( 'proc0', bname ,'->' , filepath );
  }
  return [ filenameDict, filepathList ];
}

/**
 * This searches all `import`s and replace its filename with
 * the corresponding filename which is denoted in the map
 * which is previously described above.
 */
function proc1( filename, filenameDict, callback ) {
  // 1. read the file ...
  fs.readFile( filename, 'utf8', (error, data) => {
    if (error) {
      callback( error);
    } else {
      // 2. processing the file ...
      
      // 2.1 split it with line breaks.
      let result = data.split('\n');

      // 2.2 process the list.
      result = result.map( (line)=>{

        return line.replace(
          /(^import[^'"]*)['"]([^'"]*)['"]([ ;]*.*)$/g , 
          (all, prefix, filename)=>{
            const bname = 
              baseModulename( 
                baseFilename( filename, ...argsFileExt ));

            // console.log( 'read', bname );

            let replaceResult;
            if ( false ) {
              // dummy
            } else if ( bname in filenameDict ) {
              // In case the basename is registered in the dictionary.
              replaceResult = `${prefix}"${filenameDict[bname]}"; // a local module`;
            } else { 
              // Otherwise, do following:
              replaceResult =  `${prefix}"${filename}";`;
            }
            console.log( bname,'->', replaceResult );
            return replaceResult;
          })
      });

      // 2.3 join the list
      const output = ( result.join('\n') );

      // 3.1 store its timestamps
      fs.stat( filename, (error,stats) =>{
        if (error) {
          callback( error);
        } else {
          const atime = stats.atime;
          const mtime = stats.mtime;

          // 4. overwrite the file
          fs.writeFile( filename, output , (error)=>{
            if (error) {
              callback( error);
            } else {
              // 5. restore its timestamp
              fs.utimes( filename, atime, mtime, (error)=>{
                if (error) {
                  throw error;
                } else {
                  callback(null);
                }
              });
            }
          });
        }
      });

    }
  });
}

console.log( process.argv );
const filename = process.argv[2] ?? null;

if ( filename !== null ) {
  const [ filenameDict, filepathList ] = proc0();
  for ( const f of filepathList ) {
    proc1( f, filenameDict, ()=>{} );
  }
} else {
  console.error( 'specify a file path' );
}


