
const { schema             } = require( 'vanilla-schema-validator' );
const { typesafe_function, get_typesafe_tags } = require( 'runtime-typesafety' );

/**
 * status : 'found'
 *          'forbidden'
 *          'not_found'
 *
 */
const resolve_callapi_method_path = typesafe_function(
  function resolve_callapi_method_path( callapi_target, callapi_method_path, required_typesafe_tag ) {
    const accumlator = {
      status       : 'found',
      value                : callapi_target,
      tags                 : [],
      actual_method_path   : [], // was valid_prop_name_list (Fri, 02 Jun 2023 13:12:29 +0900)
    };

    const finallization = (r)=>{
      r.callapi_method_path        = [ ... callapi_method_path ];
      r.callapi_method_path_string = callapi_method_path.join('.');
      r.actual_method_path_string  = r.actual_method_path.join('.');
      return r;
    };

    try{
      const result = callapi_method_path.reduce((accumlator,prop_name)=>{
        if ( prop_name === undefined || prop_name === null ) {
          throw new ReferenceError( `internal error; prop_name value should not be undefined or null ${prop_name}` );
        } else if ( accumlator.status !== 'found' ) {
          // CONDITION_ABOVE
          return accumlator;
        } else if ( prop_name in accumlator.value ) {
          const next_value = accumlator.value[prop_name];
          const tags       = next_value ? ( get_typesafe_tags( next_value ) ?? [] ) : [];

          if ( tags.includes( required_typesafe_tag ) ) {
            return {
              status             : 'found',
              value              : next_value,
              tags               : tags,
              actual_method_path : [ ...accumlator.actual_method_path  , prop_name ],
            };
          } else {
            return {
              status             : 'forbidden', // see the CONDITION_ABOVE
              value              : null,
              tags               : tags,
              actual_method_path : [ ...accumlator.actual_method_path  , prop_name ],
            };
          }
        } else {
          return {
            status         : 'not_found', // see the CONDITION_ABOVE
            value          : null,
            tags           : [],
            actual_method_path   : accumlator.actual_method_path  ,
          };
        }
      }, accumlator );

      return finallization(result);

    } catch (err) {
      finallization( err.callapi_result );
      throw err;
    }
  },{
    typesafe_input : schema.compile`
      array(
        callapi_target        : object(),
        callapi_method_path   : array_of( string() ),
        required_typesafe_tag : string()
      ),
    `,
    typesafe_output : schema.compile`
      object(
        status : and(
          string(),
          or(
            equals( <<'found'>>     ),
            equals( <<'not_found'>> ),
            equals( <<'forbidden'>> ),
          ),
        ),
        value  : or(
          null(),
          function(),
        ),
        tags                       : array_of( string() ),
        actual_method_path         : array_of( string() ),
        callapi_method_path        : array_of( string() ),
        actual_method_path_string  : string(),
        callapi_method_path_string : string(),
      )
    `,
  }
);

module.exports.resolve_callapi_method_path = resolve_callapi_method_path;

