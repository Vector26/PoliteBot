'use strict';
var http=require("http");
exports.handler = function(event, context, callback){
//there are 3 types of requests, need to handle them all
//good practice to surround using try/catch block

 
   
 
  try {
    var request = event.request;
    var session = event.session;

   if(!event.session.attributes)
   event.session.attributes={};
    
      if(request.type==="LaunchRequest"){
      let options = { //note that var will make it visible to the whole file
        speechText: "Welcome to the Politebot. WOuld you like to greet someone or just wanna hear a quote?",
        repromptText: "For example, you can say: say hello to John. or say <break time='2s'/> inspire me",
        endSession: false
      }
      context.succeed(buildResponse(options));
      }
    //   context.succeed(buildResponse(options));
     else if (request.type === "IntentRequest"){
        console.log("got here!");
      let options = {};
      if(request.intent.name === "Hellointent"){
        let name = request.intent.slots.FirstName.value;
        options.speechText = `Hello <emphasis level='strong'> ${name} ,</emphasis> `;
        options.speechText += getWish();
        options.endSession = true;
          context.succeed(buildResponse(options));
      }
      else if(request.intent.name==="AMAZON.HelpIntent"){
        help(request,context,session);
      }
      else if(request.intent.name==="AMAZON.CancelIntent"||request.intent.name==="AMAZON.StopIntent"){
        cancel(request,context,session);
      }
        else if(request.intent.name==="getQuote")
        {
         getQuoteIntent(request,context,session);
        }
        
        else if(request.intent.name==="moreQuote"){
          moreQuote(request,context,session);
        }   
        
      else {
        // context.fail("unknown intent")
        //since we are already in a try block, can also just throw an Exception
        throw "Unknown intent";
      }
    } else if (request.type === "SessionEndedRequest"){
        callback();
    } else {
      // context.fail("Unknown request");
      throw "Unknown request";
    }
   }catch(e) {
    callback(e);
    // context.fail("Exception: " + e);
  }
}







function getQuote(callback) {
  // body...
  var url="http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json";
  var req=http.get(url, function(res){
    var body='';
    res.on('data', function(chunk){
       body+=chunk; 
    });
    res.on('end',function(){
        body=body.replace(/\\/g,'');
        var quote=JSON.parse(body);
        callback(quote.quoteText);
    });
  });
  req.on('error', function(err){
      callback('',err);
    });
}







function getWish(){
  var myDate = new Date();
  var hours = myDate.getUTCHours()+5.3; //will get UTC hours
  if(hours < 0){
    hours = hours+24;
  }
  if (hours < 12){
    return "Good morning. ";
  } else if (hours < 18){
    return "Good afternoon. ";
  } else {
    return "Good evening. ";
  }
}








function buildResponse(options){
  //the text have to match the keys that Alexa defined. You do not have to have all the keys, but you have to use the default ones for the ones you do use.
  var response = {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "SSML",
        ssml:"<speak>"+ options.speechText+"</speak>"
      },
      //use reprompt object if we want to keep the session open
      shouldEndSession: options.endSession
    }
  }
  if(options.repromptText){
    response.response.reprompt = {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>"+options.repromptText+"</speak>"
      }
    }
  }
  
  if(options.session&&options.session.attributes){
    response.sessionAttributes=options.session.attributes;
  }
  return response;
}



function help(request,context,session){
  let options={};
  options.speechText="Just try <break time='1s'/>ask polite bot to say hello to <break time='0.7s'/>name of person who you want to greet <break time='1s'/> or try <break time='0.8s'/> tell polite bot to inspire me  <break time='1s'/> So do you want to greet or get inspired?"
  options.endSession=false;
  context.succeed(buildResponse(options));
}


function cancel(request,context,session){
  let options={};
  options.speechText="Good Bye <break time='0.4s'/> have a good day";
  options.endSession=true;
  context.succeed(buildResponse(options));
}


function getQuoteIntent(request,context,session){
  let options={};
  options.session=session;
   getQuote(function(quote,err){
           if(err)
           context.fail(err);
           else
           options.speechText=quote;
           options.speechText+="<break time='2s'/> Want to here more?. just say ,yes, or , one more."
           options.session.attributes.getQuoteIntent=true;
          options.endSession = false;
          context.succeed(buildResponse(options));
          });
}


function moreQuote(request,context,session){
  let options={};
  options.session=session;
  if(session.attributes.getQuoteIntent){
   getQuote(function(quote,err){
           if(err)
           context.fail(err);
           else{
           options.speechText=quote;
           options.speechText+="<break time='1.3s'/> Want to hear more?. just say ,yes, or , one more."
           options.session.attributes.getQuoteIntent=true;
          options.endSession = false;
          context.succeed(buildResponse(options));}
          });
          }
  else{
      options.speechText="wrong, please try again";}

}
