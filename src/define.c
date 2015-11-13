
#define Err() throw tea.error(new Error(), ARGR...)

#define debug_log() if(debug.log) debug.log(ARGR...)

#define debug_pp() if(debug.prep) debug.prep(ARGR...)

#define debug_p() if(debug.parser) debug.parser(ARGR...)

#define debug_g() if(debug.gptn) debug.gptn(ARGR...)


#define tea_log() if(debug.log) debug.log(ARGR...)

#define prep_log() if(debug.prep) debug.prep(ARGR...)

#define syntax_log() if(debug.parser) debug.parser(ARGR...)

#define tokens_log() if(debug.gptn) debug.gptn(ARGR...)

#define write_log() if(debug.gptn) debug.gptn(ARGR...)