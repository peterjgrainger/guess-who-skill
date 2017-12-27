const express = require("express"),
    alexa = require("alexa-app"),
    request = require("request"),
    
    characterList = require("./helpers/character-list"),
    AmazonSpeech = require('ssml-builder/amazon_speech'),
    PORT = process.env.PORT || 3000,
    app = express(),
    // Setup the alexa app and attach it to express before anything else.
    alexaApp = new alexa.app("");
    
    const help = `Guess Who! It's like the board game you love but on Alexa.
                  Say "Launch Guess Who" to get started.`
    
    const end = 'Game ended.  Say, launch Guess who it is, to start again.'
    
    const characters = characterList;

// POST calls to / in express will be handled by the app.request() function
alexaApp.express({
  expressApp: app,
  checkCert: true,
  // sets up a GET route when set to true. This is handy for testing in
  // development, but not recommended for production.
  debug: true
});

app.set("view engine", "ejs");

/**
 * Launch the app and start the game
 */
alexaApp.launch(function(request, response) {
      const session = request.getSession();
      const characterArray = Object.keys(characters);
      // randomly select a character
      const index = Math.floor(Math.random() * (characterArray.length-1)) + 1;
      const selectedCharacter = characterArray[index];
      session.clear();
      session.set('selectedCharacter', selectedCharacter)
      session.set('charactersRemaining', characterArray.join(','))
      session.set('guesses', '0')
  
      const startText = `I've selected a character for you to guess.
                         Ask me questions such as "Do they wear a beret?",
                         "Do they work as a programmer?" or "Are they male?"`

      response.say(startText).shouldEndSession(false);
});


alexaApp.intent("AMAZON.CancelIntent", {
    "slots": {},
    "utterances": []
  }, function(request, response) {
      response.say(end);
  }
);

alexaApp.intent("AMAZON.StopIntent", {
    "slots": {},
    "utterances": []
  }, function(request, response) {
    response.say(end);

  }
);

alexaApp.intent("AMAZON.HelpIntent", {
    "slots": {},
    "utterances": []
  }, function(request, response) {
      response.say(help).shouldEndSession(false);
  }
);

alexaApp.intent("remain", {
    "utterances": [
      "Remaining characters",
      "who is left"
    ]
  },
  function(request, response) {
  
      const session = request.getSession();
      const remainingCharacters = session.get('charactersRemaining').split(',')
      response.say(remainingCharacters.map(value => characters[value].toString()).join('.  ')).shouldEndSession(false);

  }
);

alexaApp.intent("listCharacters", {
    "utterances": [
      "List characters",
      "list all characters"
    ]
  },
  function(request, response) {
      response.say(Object.keys(characters).join(',')).shouldEndSession(false);
  }
);

alexaApp.intent("guessName", {
  "slots": {
      name: "NAME"
    },
    "utterances": [
      "is it {-|name}",
      "is the character {-|name}"
    ]
  },
  function(request, response) {
      const name = request.slot('name').toLowerCase();
      const session = request.getSession();
      const selectedCharacter = session.get('selectedCharacter');
      const charactersRemaining = session.get('charactersRemaining').split(',');
      const guesses = +session.get('guesses') + 1;
      session.set('guesses', guesses)
      let message;
      let endSession = false;
  
      if(selectedCharacter === name) {
        message = `Yes.  Good guess!  It is ${name}.  You are correct in ${guesses} guesses`
        let endSession = true;
      }else {
        const newCharactersRemaining = charactersRemaining.filter(value => value !== name);
        session.set('charactersRemaining', newCharactersRemaining.join(','));
        message = `Nope.  You have had ${guesses} guesses and there are ${newCharactersRemaining.length} characters left`
      }
            
      response.say(message).shouldEndSession(endSession);
  }
);

alexaApp.intent("guessWearable", {
    "slots": {
      wearable: "WEARABLE"
    },
    "utterances": [
      "Does your character wear {-|wearable}",
      "Do they wear {a|an} {-|wearable}",
      "Are they wearing {-|wearable}",
      "Are they wearing {a|an} {-|wearable}",
      "Do they wear {-|wearable}"
    ]
  },
  function(request, response) {
    guess(request, response, 'wear', 'wearable')
  }
);



alexaApp.intent("guessJob", {
    "slots": {
      job: "JOB"
    },
    "utterances": [
      "Is your character's job {-|job}",
      "Doex your character work as a {-|job}",
      "Do they work as a {-|job}",
      "Is thier job a {-|job}",
    ]
  },
  function(request, response) {
    guess(request, response, 'job', 'job')
  }
);

alexaApp.intent("guessGender", {
    "slots": {
      gender: "GENDER"
    },
    "utterances": [
      "Is your character {-|gender}",
      "are they {-|gender}",
    ]
  },
  function(request, response) {
      guess(request, response, 'gender', 'gender')
  }
);

alexaApp.intent("guessFeature", {
    "slots": {
      feature: "FEATURE"
    },
    "utterances": [
      "Does your character have {a|an} {-|feature}",
      "Do they have {a|an} {-|feature}",
    ]
  },
  function(request, response) {
      guess(request, response, 'feature', 'feature')
  }
);

alexaApp.intent("guessHair", {
    "slots": {
      colour: "COLOUR"
    },
    "utterances": [
      "Does your character have {-|colour} hair",
      "Do they have {-|colour} hair",
      "Is there hair color {-|colour}"
    ]
  },
  function(request, response) {
      guess(request, response, 'hair', 'colour')
  }
);



alexaApp.sessionEnded(function(request, response) {
  console.log("In sessionEnded");
  console.error('Alexa ended the session due to an error');
  // no response required
});

/**
 * common guess logic 
 */
function guess(request, response, characterProperty, sessionProperty) {
      const session = request.getSession();
      if(!request.hasSession()) {
        response.say('No Character selected.  Start again!')
      } else {
        const sessionData = getSessionData(request, sessionProperty);
        let correctGuess = sessionData.selectedCharacter[characterProperty] === sessionData[sessionProperty];
        let message = correctGuess ? `Yes, good guess!` : `Nope, that's not right`;
        // work out characters left
        const remainingCharacters = removeCharacters(characterProperty, sessionData[sessionProperty], sessionData.charactersRemaining, correctGuess)
        session.set('charactersRemaining', remainingCharacters.join(','))
        console.log('remaining characters', remainingCharacters);

        const guesses = +session.get('guesses') + 1;
        session.set('guesses', '' + guesses);

        if(remainingCharacters.length === 1) {
          response.say(`Only ${sessionData.characterName} is left!  You guessed in ${guesses} tries`)
          return;
        }

        message += `.  You've had ${guesses} guesses and have ${remainingCharacters.length} characters remaining`;
        response.say(message).shouldEndSession(false);
      }
}

/**
 * Get the data from the session and assign to an object
 */
function getSessionData(request, sessionProperty) {
      const session = request.getSession();
      const sessionVariables = {
        characterName: (session.get('selectedCharacter') || '').toLowerCase(),
        charactersRemaining: session.get('charactersRemaining').split(',')
      }
      sessionVariables[sessionProperty] = request.slot(sessionProperty);
      sessionVariables.selectedCharacter = characters[sessionVariables.characterName];
      return sessionVariables;
}

/**
* If guessed correctly remove all with that property, if not guessed correctly remove 
* every other value apart from that one.
*/
function removeCharacters(property, propertyValue, charactersRemaining, correctGuess) {
  return charactersRemaining.filter(value => {
    if(correctGuess) {
      // if the guess is right keep ones with only that property
      return characters[value][property] === propertyValue
    } else {
      // if the guess is wrong return all without that property
      return characters[value][property] !== propertyValue
    }
  });
  
}




app.listen(PORT, () => console.log("Listening on port " + PORT + "."));