import re

def mark(text, args, Mark, extra_cli_args, *a):
    # This function is responsible for finding all
    # matching text. extra_cli_args are any extra arguments
    # passed on the command line when invoking the kitten.
    # We mark all individual word for potential selection
    for idx, m in enumerate(re.finditer(r'(?<=[ \'"`(\n])[\.~]?[\w@.\n-]*(?:/[\w@.\n-]+)+(?::\d+){0,2}', text)):
        start, end = m.span()
        match = text[start:end]
        # if '\n' in match:
            # end = start + len(match.replace('\n.*', ''))
            # continue
        mark_text = text[start:end].replace('\n', '').replace('\0', '')
        # The empty dictionary below will be available as groupdicts
        # in handle_result() and can contain arbitrary data.
        yield Mark(idx, start, end, mark_text, {})


def handle_result(args, data, target_window_id, boss, extra_cli_args, *a):
    # This function is responsible for performing some
    # action on the selected text.
    # matches is a list of the selected entries and groupdicts contains
    # the arbitrary data associated with each entry in mark() above
    matches, groupdicts = [], []
    for m, g in zip(data['match'], data['groupdicts']):
        if m:
            matches.append(m), groupdicts.append(g)


    w = boss.window_id_map.get(target_window_id)
    for word, match_data in zip(matches, groupdicts):
        # Lookup the word in a dictionary, the open_url function
        # will open the provided url in the system browser
        # boss.launch('/home/zorzi/.local/bin/custom/vim_signal.sh', '{}'.format(word))
        if w is not None:
            w.paste_text(word)
