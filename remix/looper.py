#!/usr/bin/env python
# encoding: utf-8
"""
looper.py

Created by Brian Whitman on 2011-11-05.
Copyright (c) 2011 The Echo Nest. All rights reserved.
"""

import sys
import tempfile
import urllib
import os
import echonest.audio as audio
import pyechonest.song as song



def get_song(combined="kreayshawn gucci gucci"):
    s = song.search(combined=combined,buckets=["id:7digital-US","tracks"],limit=True,results=1)
    if len(s) > 0:
        try:
            url = s[0].get_tracks("7digital-US")[0]["preview_url"]
        except KeyError:
            url = None
    return url

def download_url(url):
    print "downloading"
    temp = tempfile.NamedTemporaryFile(mode="wb", suffix=".mp3")
    temp.write(urllib.urlopen(url).read())
    return temp

def get_loops(fileobj, output_name="out.mp3"):
    print "analyzing"
    audio_file = audio.LocalAudioFile(fileobj.name)
    print "done"
    
    print "%d bars" % len(audio_file.analysis.bars)

    collect = audio.AudioQuantumList()
    
    bar = audio_file.analysis.bars[5]
    for x in xrange(1):
        collect.append(bar)

    out = audio.getpieces(audio_file, collect)
    out.encode(output_name)

    
def main():
    combined = sys.argv[1]
    url = get_song(combined=combined)
    fileobj = download_url(url)
    get_loops(fileobj)

if __name__ == '__main__':
    main()

