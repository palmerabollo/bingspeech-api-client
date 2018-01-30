# bingspeech-api-client-saudi

A Microsoft Bing Speech API client written in Node.js, with added support for the Saudi Arabian dialect.

Official documentation for [Bing Speech API service](https://docs.microsoft.com/en-us/azure/cognitive-services/speech/home).

>To work with Bing Speech API, you must have a subscription key. If you don't have a subscription key already, get one here: [Subscriptions](https://docs.microsoft.com/en-us/azure/cognitive-services/speech/getstarted/getstartedjswebsockets).


## Usage

Install [`bingspeech-api-client-saudi`](https://www.npmjs.com/package/bingspeech-api-client-saudi) in your node project with npm.

```
npm install -save bingspeech-api-client-saudi
```

See example below on how to require and use for Speech to text (STT) and text to speech (TTS).


## Examples 

Following example code is assuming you are using [typescript](https://www.typescriptlang.org/). If you are, skip this section and go straight to the examples. But if you are using node ES6 and want to use the example code read on. 

At present node does not support `import`. As mentioned on [MDN](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/import)

>Note: This feature[`import`] is only beginning to be implemented in browsers natively at this time. It is implemented in many transpilers, such as the Traceur Compiler, Babel, Rollup or Webpack.


To get the example code working change the first line to: 

```js
const { BingSpeechClient, VoiceRecognitionResponse } = require('bingspeech-api-client-saudi');
```


### Usage with streams

#### STT usage example (recognize)

```javascript
import { BingSpeechClient, VoiceRecognitionResponse } from 'bingspeech-api-client-saudi';

let audioStream = fs.createReadStream(myFileName); // create audio stream from any source

// Bing Speech Key (https://www.microsoft.com/cognitive-services/en-us/subscriptions)
let subscriptionKey = 'your_private_subscription_key';

let client = new BingSpeechClient(subscriptionKey);
client.recognizeStream(audioStream).then(response => console.log(response.results[0].name));
```

#### TTS usage example (synthesize)

```javascript
import { BingSpeechClient, VoiceVoiceSynthesisResponse } from 'bingspeech-api-client-saudi';

// Bing Speech Key (https://www.microsoft.com/cognitive-services/en-us/subscriptions)
let subscriptionKey = 'your_private_subscription_key';

let client = new BingSpeechClient(subscriptionKey);
client.synthesizeStream('I have a dream').then(audioStream => /* ... */);
```

### Usage with buffers (deprecated, will be removed in 2.x)

#### STT usage example (recognize)

```javascript
import { BingSpeechClient, VoiceRecognitionResponse } from 'bingspeech-api-client-saudi';

// audio input in a Buffer
let wav = fs.readFileSync('myaudiofile.wav');

// Bing Speech Key (https://www.microsoft.com/cognitive-services/en-us/subscriptions)
let subscriptionKey = 'your_private_subscription_key';

let client = new BingSpeechClient(subscriptionKey);
client.recognize(wav).then(response => console.log(response.results[0].name));
```

#### TTS usage example (synthesize)

```javascript
import { BingSpeechClient, VoiceVoiceSynthesisResponse } from 'bingspeech-api-client-saudi';

// Bing Speech Key (https://www.microsoft.com/cognitive-services/en-us/subscriptions)
let subscriptionKey = 'your_private_subscription_key';

let client = new BingSpeechClient(subscriptionKey);
client.synthesize('I have a dream').then(response => { /* audio is a Buffer in response.wave */ });
```

