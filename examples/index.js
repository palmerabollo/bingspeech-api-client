var fs = require('fs');
var os = require('os');
var path = require('path');
var client = require('../lib/client');

if (!process.env.MICROSOFT_BING_SPEECH_KEY) {
  console.error('You need to set a MICROSOFT_BING_SPEECH_KEY env var');
  process.exit(1);
}

var bing = new client.BingSpeechClient(process.env.MICROSOFT_BING_SPEECH_KEY);

/**
 * Speech To Text example
 */
var wave = fs.readFileSync(__dirname + '/example.wav');
bing.recognize(wave).then(result => {
  console.log('Speech To Text completed');
  console.log(result)
  console.log('\n');
});

/**
 * Text To Speech example (default lang & genre)
 */
bing.synthesize('All for one and one for all').then(result => {
  var file = path.join(os.tmpdir(), 'bingspeech-api-client.wav');
  var wstream = fs.createWriteStream(file);
  wstream.write(result.wave);
  console.log('Text To Speech completed. Audio file written to', file);
});

/**
 * Text To Speech example (spanish female)
 */
bing.synthesize('Todos para uno y uno para todos', 'es-es', 'female').then(result => {
  var file = path.join(os.tmpdir(), 'bingspeech-api-client.wav');
  var wstream = fs.createWriteStream(file);
  wstream.write(result.wave);
  console.log('Text To Speech completed. Audio file written to', file);
});
