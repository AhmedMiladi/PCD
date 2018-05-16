import pandas as pd
import datetime
import time
import urllib.request
from io import StringIO


def createDataFrame(length, periodicity):
    """
            newLine = pd.read_csv(StringIO(contents), sep=',',
                              names=['currency', 'datetime', 'bid', 'bidpoint', 'offer', 'offerpoint',
                                     'high', 'low', 'open'])

    newLine['bid'] = newLine.bid + newLine.bidpoint / 100000
        loopEnd = time.time() + 59
        open = newLine.bid.iloc[0]
        high = newLine.bid.iloc[0]
        low = newLine.bid.iloc[0]
        close = newLine.bid.iloc[0]
    data.datetime = datetime.datetime.fromtimestamp(data.datetime / 1000).strftime('%d.%m.%Y %H:%M:%S')
    data = data.set_index(data.datetime)

    :return: dataFrame of x lines for y time period
    """
    print('data collection started!')
    data = pd.DataFrame(columns=['datetime', 'open', 'high', 'low', 'close'])
    gate = True
    for i in range(length):
        while time.time() % 60 >= 1 and gate:
            time.sleep(0.25)
            print('not yet, time:', time.time() % 60)

        gate = False
        data_string = ""
        loopEnd = time.time() + 59.8

        while time.time() < loopEnd:

            contents = urllib.request.urlopen("http://webrates.truefx.com/rates/connect.html?c=EUR%2FUSD&f=csv").read()
            if contents is not None:
                data_string = data_string + str(contents, 'utf-8') + "\n"
                print("data collected at: ", time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time())))
            else:
                print('no new value!')
            time.sleep(periodicity)

        newLine = pd.read_csv(StringIO(data_string), sep=',',
                              names=['currency', 'datetime', 'bid', 'bidpoint', 'offer', 'offerpoint',
                                     'high', 'low', 'open'])

        newLine.bid = newLine.bid + newLine.bidpoint / 100000

        data = data.append({'datetime': newLine.datetime.iloc[0],
                            'open': newLine.bid.iloc[0],
                            'high': newLine.bid.max(),
                            'low': newLine.bid.min(),
                            'close': newLine.bid.iloc[-1]}, ignore_index=True)
        print('data of minute', i, 'collected')

    print('successfully created a ', len(data), ' lines dataFrame!')

    data.datetime = pd.to_datetime(data.datetime // 60000, unit='m')
    #data['datetime'] = data['datetime'].strftime('%d.%m.%Y %H:%M')
    data = data.set_index(data.datetime)
    data = data[['open', 'high', 'low', 'close']]
    ma = data.close.rolling(center=False, window=10).mean()
    data['ma'] = pd.Series(ma.values, index=data.index)
    data = data[10:]
    print('data collection completed!')

    return data


createDataFrame(1000, 0.25)
