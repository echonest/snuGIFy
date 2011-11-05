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
import web
import echonest.audio as audio
import pyechonest.song as song
import echonest.aws as aws
import random
import string
import subprocess
try:
    import json
except ImportError:
    import simplejson as json


urls = (
    '/looper', 'looper',
    '/searchgif', 'searchgif'
)
app = web.application(urls, globals())




_s3 = aws.connect_s3()
_bucket = _s3.get_bucket("remix-sounds.sandpit.us")

def random_string(N=8):
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(N))

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

def get_loops(fileobj, output_name="out.mp3", bars_count=8, bars_start=1):
    print "analyzing"
    audio_file = audio.LocalAudioFile(fileobj.name)
    print "done"
    
    print "%d bars" % len(audio_file.analysis.bars)

    collect = audio.AudioQuantumList()
    
    bars = audio_file.analysis.bars
    repeats = 1
    if len(bars)-bars_start < bars_count:
        bars_count = 4
    if len(bars)-bars_start < bars_count:
        bars_count = 1

    print "actual bar count was %d" % (bars_count)
    for y in xrange(repeats):
        for x in xrange(bars_count):
            collect.append(audio_file.analysis.bars[bars_start+x])
    
    out = audio.getpieces(audio_file, collect)
    output_temp = tempfile.NamedTemporaryFile(mode="w+b", suffix=".mp3")
    out.encode(output_temp.name)
    analysis = json.loads(urllib.urlopen(audio_file.analysis.pyechonest_track.analysis_url).read())
    return (output_temp, analysis)
    
def upload_to_s3(fileobj):
    fn = random_string()+".mp3"
    key = _bucket.new_key(fn)
    key.set_contents_from_file(fileobj)
    key.set_acl("public-read")
    key.close()
    return "http://remix-sounds.sandpit.us/"+fn
    
def do_it(search, bars_count=8, bars_start=1):
    combined = sys.argv[1]
    url = get_song(combined=combined)
    fileobj = download_url(url)
    (oneloopobj, analysis) = get_loops(fileobj, bars_count=bars_count, bars_start=bars_start)
    return (upload_to_s3(oneloopobj), analysis)
    
    
#if __name__ == '__main__':
#    print str(do_it(sys.argv[1]))

class searchgif:
    def GET(self):
        i = web.input(query=None)
        if i.query is not None:
            cmd = 'curl "http://dump.fm/cmd/search/'+urllib.quote(i.query)+'"'
            p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            (json_block, errs) = p.communicate()
            return json_block
        return "{'need a query':'RALPH'}"


class looper:
    def POST(self):
        i = web.input(combined=None, bars_count=8, bars_start=1)
        (url,analysis) = do_it(i.combined, bars_count=i.bars_count, bars_start=i.bars_start)
        analysis["loop_url"] = url
        return json.dumps(analysis)

    def GET(self):
        i = web.input(combined=None, bars_count=8, bars_start=1)
        (url,analysis) = do_it(i.combined, bars_count=i.bars_count, bars_start=i.bars_start)
        analysis["loop_url"] = url
        return json.dumps(analysis)

if __name__ == "__main__":
    app.run()

