import logging
import web

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    logging.debug("starting server...")
    import main
    web.debug = True
    from main import *
    app = web.application(main.urls, globals())
    app.run()
