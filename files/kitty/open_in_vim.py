from typing import List
from kitty.boss import Boss
import subprocess
from urllib.parse import urlparse, parse_qs

def main(args: List[str]) -> str:
    # this is the main entry point of the kitten, it will be executed in
    # the overlay window when the kitten is launched
    url = args[1]
    parsed_url = urlparse(url)

    path = parsed_url.path
    position = parse_qs(parsed_url.query)

    line = position['line'][0]
    col = position['col'][0]

    wid = subprocess.run(["/home/zorzi/.local/bin/custom/vim-signal.js", path, line, col], stdout=subprocess.PIPE)
    wid = wid.stdout.decode('utf-8').strip()

    process = subprocess.run(["kitty", '@', 'focus-window', f'--match=id:{wid}'], stderr=subprocess.PIPE)
