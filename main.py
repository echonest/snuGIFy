import sys, os
reload(sys)
sys.setdefaultencoding('utf-8')
cwd = os.path.dirname(os.path.abspath( __file__ ))
sys.path.append(cwd)
os.environ['PYTHON_EGG_CACHE'] = '/tmp'
import logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
try:
    import simplejson as json
except ImportError:
    import json
import time
import urllib
import web
web.config.update({
        'server.environment': 'production',
        'staticFilter.on': True,
        'staticFilter.dir': 'static',
})

logger = logging.getLogger(__name__)

urls = (
        '/',                    'Index',
        )

class Index:
    def GET(self):
        raise web.seeother("/static/index.html")

application = web.application(urls, globals()).wsgifunc()

if __name__ == "__main__":
    app = web.application(urls, globals())
    app.run()
