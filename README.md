# bingspeech-api-client

A Microsoft Bing Speech API client written in node.js.

## Usage examples

```javascript
import { BingSpeechClient, VoiceRecognitionResponse } from 'bingspeech-api-client';

// audio input in a Buffer
let wav = fs.readFileSync('myaudiofile.wav');

// Bing Speech Key (https://www.microsoft.com/cognitive-services/en-us/subscriptions)
let subscriptionKey: string = 'your_private_subscription_key';

let client = new BingSpeechClient(subscriptionKey);
client.voiceRecognition(wav)
      .then(response => {
          console.log(response.results[0].name);
      });
```
