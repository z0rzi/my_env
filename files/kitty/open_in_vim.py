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

    subprocess.run(["/home/zorzi/.local/bin/custom/vim-signal.ts", path, line, col], stdout=subprocess.PIPE)
