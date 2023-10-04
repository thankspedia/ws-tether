
/*
 * context_factory : specify the package name of the starting context factory
 * static_paths    : file paths to static contents which you wish to serve by
 *                   the server
 * ports           : specify server ports that you wish to start
 * cors_origins    : cors setting
 */
function init( schema ) {
  schema.t_async_context_service_settings = schema.compile`
    object(
      async_context_backend : object(
        context_factory     : string(),
        purge_require_cache : boolean(),
        static_paths        : array_of( string() ),
        ports               : and(
                                array_of( number() ),
                                << e => 0<e.length >>
                              ),
        cors_origins        : or(
                                array_of( string() ),
                                equals( << "ALLOW_ALL" >> ),
                                function(),
                              ),
      )
    )
  `;
  return schema;
}

module.exports.init = init;
