import { expect } from 'chai';

import { BingSpeechClient, VoiceRecognitionResponse } from './';

import * as nock from 'nock';

describe('Bing Speech API client', () => {
    beforeEach(() => {
        nock('https://api.cognitive.microsoft.com')
            .post('/sts/v1.0/issueToken')
            .reply(200, 'FAKETOKEN');
    });

    it('should recognize a voice', () => {
        const mockResponse: VoiceRecognitionResponse = {
              version: '3.0',
              header: {
                  status: 'success',
                  scenario: 'ulm',
                  name: 'i have a dream',
                  lexical: 'i have a dream',
                  properties: {
                      requestid: '862cc972-d1dd-4a76-b0a8-829ecd03c4c3',
                      HIGHCONF: '1'
                  }
              },
              results: [
                  {
                      scenario: 'ulm',
                      name: 'i have a dream',
                      lexical: 'i have a dream',
                      confidence: '0.96075',
                      properties: {
                          HIGHCONF: '1'
                      }
                  }
              ]
        };

        nock('https://speech.platform.bing.com')
            .post('/recognize')
            .query(true)
            .reply(200, mockResponse);

        const client = new BingSpeechClient('fakeSubscriptionId');

        const stream: NodeJS.ReadWriteStream = null;
        return client.recognizeStream(stream)
            .then((response: VoiceRecognitionResponse) => {
                expect(response).to.eql(mockResponse);
            });
    });

    it('should synthesize a voice', () => {
        const client = new BingSpeechClient('fakeSubscriptionId');

        nock('https://speech.platform.bing.com')
            .post('/synthesize')
            .reply(200, '');

        // TODO fix & improve this test.
        // It passes but it is weak and, what is worse, it shows an ECONNRESET as if some connection wasn't properly intercepted by nock
        return client.synthesizeStream('This is a fake test')
            .then((stream: NodeJS.ReadableStream) => {
                expect(stream).to.be.an('object');
            });
    });
});
