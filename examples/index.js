var fs = require('fs');
var client = require('../lib/client');

var bing = new client.BingSpeechClient(process.env.MICROSOFT_BING_SPEECH_KEY);
var wave = fs.readFileSync(__dirname + '/example.wav');
bing.voiceRecognition(wave).then(result => console.log(result));
