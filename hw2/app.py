# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START gae_python38_app]
# [START gae_python3_app]
from flask import Flask, request
from datetime import datetime
from dateutil.relativedelta import relativedelta
import requests
from flask_cors import CORS


FINNHUB_API_KEY="cn81ol9r01qplv1ehck0cn81ol9r01qplv1ehckg"
POLYGON_API_KEY="XUfQnilwktq9iGD_ith6sPokhYYfqksl"

app = Flask(__name__)
CORS(app)

@app.route("/")
def homepage():
    return app.send_static_file("index.html")

@app.route("/search", methods=['GET'])
def process():
    ticker = request.args.get('ticker')
    CURR =datetime.now()

    DAY30_BEFORE_CURR = CURR-relativedelta(days=30)
    MONTH6_BEFORE_CURR = CURR - relativedelta(months=6)

    # # Convert to UNIX timestamp
    # from_timestamp = int(MONTH6_BEFORE_CURR.timestamp()) * 1000
    # to_timestamp = int(CURR.timestamp()) * 1000

    URL_PROFILE = "https://finnhub.io/api/v1/stock/profile2?symbol={}&token={}".format(ticker,FINNHUB_API_KEY)
    URL_QUOTE = "https://finnhub.io/api/v1/quote?symbol={}&token={}".format(ticker, FINNHUB_API_KEY)
    URL_RECOMMENDATION="https://finnhub.io/api/v1/stock/recommendation?symbol={}&token={}".format(ticker, FINNHUB_API_KEY)
    URL_CHART="https://api.polygon.io/v2/aggs/ticker/{}/range/1/day/{}/{}?adjusted=true&sort=asc&apiKey={}".format(ticker,MONTH6_BEFORE_CURR.strftime("%Y-%m-%d"),CURR.strftime("%Y-%m-%d"),POLYGON_API_KEY)
    URL_NEWS="https://finnhub.io/api/v1/company-news?symbol={}&from={}&to={}&token={}".format(ticker,DAY30_BEFORE_CURR.strftime("%Y-%m-%d"),CURR.strftime("%Y-%m-%d"),FINNHUB_API_KEY)




    data = {

        "profile": requests.get(URL_PROFILE).text,
        "quote": requests.get(URL_QUOTE).text,
        "recommendation":requests.get(URL_RECOMMENDATION).text,
        "charts": requests.get(URL_CHART).text,
        "news":requests.get(URL_NEWS).text

    }


    return data


if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. You
    # can configure startup instructions by adding `entrypoint` to app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True,static_folder='static')
# [END gae_python3_app]
# [END gae_python38_app]
