import assert from 'node:assert/strict';
import test from 'node:test';
import { hasSpeechContent } from './voice-content';

test('drops punctuation-only speech recognition filler', () => {
  assert.equal(hasSpeechContent('...'), false);
  assert.equal(hasSpeechContent('…'), false);
});

test('keeps plain text speech', () => {
  assert.equal(hasSpeechContent('Need to revisit the opening argument'), true);
});

test('keeps accented and non-Latin speech', () => {
  assert.equal(hasSpeechContent('¿Qué hacemos después?'), true);
  assert.equal(hasSpeechContent('次に何をする？'), true);
});
