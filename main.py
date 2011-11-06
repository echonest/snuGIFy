#!/usr/bin/env python
# encoding: utf-8
import sys, os
reload(sys)
sys.setdefaultencoding('utf-8')
cwd = os.path.dirname(os.path.abspath( __file__ ))
sys.path.append(cwd)
os.environ['PYTHON_EGG_CACHE'] = '/tmp'
import logging
import tempfile
import urllib
import os
import web
import echonest.audio as audio
import pyechonest.config as pconfig
import pyechonest.song as song
import echonest.aws as aws
import random
import string
import shutil
import subprocess
from echonest.action import render, make_stereo
from echonest.audio import LocalAudioFile
from pyechonest import util
from capsule_support import order_tracks, equalize_tracks, resample_features, timbre_whiten, initialize, make_transition, terminate, FADE_OUT, display_actions, is_valid
from utils import tuples


pconfig.ECHO_NEST_API_KEY = "N6E4NIOVYMTHNDM8J"
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
try:
    import simplejson as json
except ImportError:
    import json


urls = (
    '/looper', 'looper',
    '/searchgif', 'searchgif',
    '/', 'Index'
)

_s3 = aws.connect_s3()
_bucket = _s3.get_bucket("remix-sounds.sandpit.us")

def random_string(N=8):
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(N))

def get_song(combined="kreayshawn gucci gucci"):
    s = song.search(combined=combined,buckets=["id:7digital-US","tracks"],limit=True,results=1)
    if len(s) > 0:
        try:
            url = s[0].get_tracks("7digital-US")[0]["preview_url"]
            return (url, s[0])
        except KeyError:
            return (None, None)

def download_url(url):
    print "downloading"
    temp = tempfile.NamedTemporaryFile(mode="wb", suffix=".mp3")
    temp.write(urllib.urlopen(url).read())
    return temp


def get_loops(fileobj, inter=8.0, trans=2.0):
    # Get pyechonest/remix objects
    analyze = lambda x : LocalAudioFile(x, verbose=verbose)
    tracks = map(analyze, audio_files)

    valid = []
    # compute resampled and normalized matrices
    for track in tracks:
        if verbose: print "Resampling features for", track.analysis.pyechonest_track.title
        track.resampled = resample_features(track, rate='beats')
        track.resampled['matrix'] = timbre_whiten(track.resampled['matrix'])
        # remove tracks that are too small
        if is_valid(track, inter, trans):
            valid.append(track)
        # for compatibility, we make mono tracks stereo
        track = make_stereo(track)
    tracks = valid

    if len(tracks) < 1: return []
    # Initial transition. Should contain 2 instructions: fadein, and playback.
    if verbose: print "Computing transitions..."
    start = initialize(tracks[0], inter, trans)

    # Middle transitions. Should each contain 2 instructions: crossmatch, playback.
    middle = []
    [middle.extend(make_transition(t1, t2, inter, trans)) for (t1, t2) in tuples(tracks)]

    # Last chunk. Should contain 1 instruction: fadeout.
    end = terminate(tracks[-1], FADE_OUT)
    actions =  start + middle + end
    
    output_temp = tempfile.NamedTemporaryFile(mode="w+b", suffix=".mp3")
    render(actions, output_temp.name, False)
    # Do it again
    new_one = audio.LocalAudioFile(output_temp.name)
    analysis = json.loads(urllib.urlopen(new_one.analysis.pyechonest_track.analysis_url).read())
    return (output_temp.name, analysis)
    
    
    

def upload_to_s3(filename):
    fn = random_string()+".mp3"
    key = _bucket.new_key(fn)
    key.set_contents_from_filename(filename)
    key.set_acl("public-read")
    key.close()
    return "http://remix-sounds.sandpit.us/"+fn
    
def do_it(search, inter=8.0, trans=2.0):
    # combined = sys.argv[1]
    (url, song) = get_song(combined=search)
    fileobj = download_url(url)
    (new_one, analysis) = get_loops(fileobj, inter=inter, trans=trans)
    analysis["artist"] = song.artist_name
    analysis["title"] = song.title
    analysis["loop_url"] = upload_to_s3(new_one)
    return analysis
    

class searchgif:
    def GET(self):
        i = web.input(query=None)
        if i.query is not None:
            cmd = 'curl "http://dump.fm/cmd/search/'+urllib.quote(i.query)+'"'
            p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            (json_block, errs) = p.communicate()
            package = json.loads(json_block)
            new_list = []
            for x in package:
                if x["url"].endswith(".gif"):
                    if x["url"].startswith("/"):
                        x["url"] = "http://dump.fm/images"+x["url"]
                    else:
                        x["url"] = "http://"+x["url"]
                    new_list.append(x)
            return json.dumps(new_list)
        return "{'need a query':'RALPH'}"


class looper:
    def POST(self):
        i = web.input(combined=None, inter=8.0, trans=2.0)
        return json.dumps( do_it(i.combined, bars_count=i.bars_count, bars_start=i.bars_start) )

    def GET(self):
        i = web.input(combined=None, inter=8.0, trans=2.0)
        return json.dumps( do_it(i.combined, bars_count=i.bars_count, bars_start=i.bars_start) )

class Index:
    def GET(self):
        raise web.seeother("/static/index.html")

application = web.application(urls, globals()).wsgifunc()

