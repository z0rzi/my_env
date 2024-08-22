#!/usr/bin/env python3

from pathlib import Path
from openai import OpenAI
import os
import pyperclip
import subprocess

def prompt(message = ''):
    print(message)

    result = subprocess.run(['bash', '-c', 'read -n1 key && test "$key" = "q"'], shell=False)

    if result.returncode == 0:
        return False
    return True

api_key_file = os.path.join(os.environ['HOME'], '.config', 'openapi-token.conf')

with open(api_key_file, 'r') as f:
  api_key = f.read().strip()

client = OpenAI(api_key=api_key)

text = pyperclip.paste()

if len(text) == 0:
    print('No text in clipboard')
    exit(1)

if len(text) > 2000:
    print('Text too long... (max 1000 characters, {} characters provided)'.format(len(text)))
    prompt()
    exit(1)

speech_file_path = "/tmp/speech.mp3"

print('Converting text to speech...')

response = client.audio.speech.create(
  model="tts-1",
  voice="alloy",
  input=text
)

response.stream_to_file(speech_file_path)

system_command = f"mpv --speed=1.35 {speech_file_path}"

os.system('clear')
os.system(system_command)

while True:
    if prompt('Hit <space> to listen again, <q> to leave'):
        os.system(system_command)
    else:
        break
