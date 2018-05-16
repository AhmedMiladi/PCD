import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from keras.models import Sequential
from keras.layers.core import Dense
from keras.layers.recurrent import LSTM
import time
from sklearn import preprocessing
import plotly as py
from plotly import tools
import plotly.graph_objs as go
import math


def invers_min_max(min, max):
    return

def sigmoid_1(y):
    return - math.log(1 / y - 1)


def predictor(df, model):

    input_x = df[-1:]

    for counter in range(10):
        pred = model.predict(input_x)

        if pred[0][1] < pred[0][0]:
            pred[0][1], pred[0][0] = pred[0][0], pred[0][1]

        if pred[0][1] < pred[0][2]:
            pred[0][1], pred[0][2] = pred[0][2], pred[0][1]

        if pred[0][1] < pred[0][3]:
            pred[0][1], pred[0][3] = pred[0][3], pred[0][1]

        if pred[0][2] > pred[0][0]:
            pred[0][2], pred[0][0] = pred[0][0], pred[0][2]

        if pred[0][2] > pred[0][3]:
            pred[0][2], pred[0][3] = pred[0][3], pred[0][2]

        input_x = input_x[0]
        input_x = np.append(input_x, pred)
        input_x = input_x[4:]
        input_x = np.array(input_x).reshape((1, 10, 4))

    result = np.array(input_x).reshape((10, 4))
    return result


def init_model():

    model = Sequential()

    model.add(Dense(activation="relu", input_shape=(10, 4), units=40))

    model.add(LSTM(activation="tanh", units=40, recurrent_activation="hard_sigmoid"))

    model.add(Dense(activation="linear", units=4))

    model.compile(loss='mean_squared_error', optimizer='rmsprop')

    return model


def create_model(df):

    df = df.iloc[-100000:]
    print('creating model started!')

    #add time shifts to the data
    #################################################

    yt = df[['open', 'high', 'low', 'close']]

    yt_1 = yt.shift(1)
    yt_2 = yt.shift(2)
    yt_3 = yt.shift(3)
    yt_4 = yt.shift(4)
    yt_5 = yt.shift(5)
    yt_6 = yt.shift(6)
    yt_7 = yt.shift(7)
    yt_8 = yt.shift(8)
    yt_9 = yt.shift(9)
    yt_10 = yt.shift(10)

    yt = yt[['open', 'high', 'low', 'close']]

    data = pd.concat([yt,
                      yt_1, yt_2, yt_3, yt_4, yt_5, yt_6, yt_7, yt_8, yt_9, yt_10], axis=1)

    data.columns = ['yt_open', 'yt_high', 'yt_low', 'yt_close',
                    'yt1_open', 'yt1_high', 'yt1_low', 'yt1_close',
                    'yt2_open', 'yt2_high', 'yt2_low', 'yt2_close',
                    'yt3_open', 'yt3_high', 'yt3_low', 'yt3_close',
                    'yt4_open', 'yt4_high', 'yt4_low', 'yt4_close',
                    'yt5_open', 'yt5_high', 'yt5_low', 'yt5_close',
                    'yt6_open', 'yt6_high', 'yt6_low', 'yt6_close',
                    'yt7_open', 'yt7_high', 'yt7_low', 'yt7_close',
                    'yt8_open', 'yt8_high', 'yt8_low', 'yt8_close',
                    'yt9_open', 'yt9_high', 'yt9_low', 'yt9_close',
                    'yt10_open', 'yt10_high', 'yt10_low', 'yt10_close']

    data = data.dropna()

    """data = np.array(data).reshape((len(data), 11, 4))
    scaler_x = preprocessing.MinMaxScaler(feature_range=(-1, 1))
    for i in range(len(data)):
        intermediate_x = np.transpose(data[i])
        intermediate_x = scaler_x.fit_transform(intermediate_x)
        intermediate_x = np.transpose(intermediate_x)
        data[i] = intermediate_x"""

    y = data[['yt_open', 'yt_high', 'yt_low', 'yt_close']]

    colms = [
        'yt1_open', 'yt1_high', 'yt1_low', 'yt1_close',
        'yt2_open', 'yt2_high', 'yt2_low', 'yt2_close',
        'yt3_open', 'yt3_high', 'yt3_low', 'yt3_close',
        'yt4_open', 'yt4_high', 'yt4_low', 'yt4_close',
        'yt5_open', 'yt5_high', 'yt5_low', 'yt5_close',
        'yt6_open', 'yt6_high', 'yt6_low', 'yt6_close',
        'yt7_open', 'yt7_high', 'yt7_low', 'yt7_close',
        'yt8_open', 'yt8_high', 'yt8_low', 'yt8_close',
        'yt9_open', 'yt9_high', 'yt9_low', 'yt9_close',
        'yt10_open', 'yt10_high', 'yt10_low', 'yt10_close']

    x = data[colms]
    print('training & testing data successfully created!')

    #transform data into train & test
    ######################################################

    scaler_x = preprocessing.MinMaxScaler(feature_range=(-1, 1))
    #x = np.array(x).reshape((len(x), 40))
    x = np.array(x).reshape((len(x), 10, 4))

    for i in range(len(x)):
        x[i] = scaler_x.fit_transform(x[i])

    scaler_y = preprocessing.MinMaxScaler(feature_range=(-1, 1))
    y = np.array(y).reshape((len(y), 4))
    y = scaler_y.fit_transform(y)

    #the training set
    #######################################################

    trainingBegin = 10000
    trainingEnd = 40000
    testingEnd = 10
    x = np.array(x).reshape((len(x), 10, 4))
    y = np.array(y).reshape((len(y), 4))

    x_train = x[trainingBegin:trainingEnd, ]

    x_test = x[trainingEnd:trainingEnd+testingEnd, ]

    y_train = y[trainingBegin:trainingEnd, ]

    y_test = y[trainingEnd:trainingEnd+testingEnd, ]

    #x_train = x_train.reshape(x_train.shape+(1, ))
    #x_test = x_test.reshape(x_test.shape+(1, ))

    x_train.shape

    #LSTM NN Specs
    #########################################################

    seed = 77
    np.random.seed(seed)

    model = init_model()

    #fitting the model
    ##########################################################
    epoch_count = 10
    batch_count = 10

    print("training the model")
    print(x_train.shape)
    model.fit(x_train, y_train, batch_size=batch_count, epochs=epoch_count, shuffle=False)

    #train & test
    #############################################################

    score_test = model.evaluate(x_test, y_test, batch_size=batch_count)

    #Prediction Values
    ################################################################

    nbrreel = 20

    print('all ready to predict!')
    prediction_length = testingEnd
    pred = predictor(x_train, model)
    #pred= model.predict(x_test)
    y_test = scaler_y.inverse_transform(np.array(y_test)).reshape((len(y_test), 4))

    pred = scaler_y.inverse_transform(np.array(pred)).reshape((len(pred), 4))
    pred_dataframe = pd.DataFrame(pred)
    pred_dataframe.columns = ['open', 'high', 'low', 'close']
    pred_dataframe = pred_dataframe.set_index(df.index[trainingEnd+10:trainingEnd+testingEnd+10, ])

    #y_test = scaler_y.inverse_transform(np.array(y_test)).reshape((len(y_test), 4))
    y_dataframe = df.iloc[trainingEnd+10:trainingEnd+testingEnd+10, ]
    y_dataframe.columns = ['open', 'high', 'low', 'close']

    #y_dataframe = y_dataframe.set_index(df.index[trainingEnd-50:trainingEnd+testingEnd-50, ])
    #y_dataframe = y_dataframe.iloc[-nbrreel:]

    #PLOTTING
    ##################################################################

    print('all ready to plot!')

    rnnPlot = go.Candlestick(
                    x=pred_dataframe.index,
                    open=pred_dataframe.open,
                    high=pred_dataframe.high,
                    low=pred_dataframe.low,
                    close=pred_dataframe.close,
                    increasing=dict(line=dict(color='#17BECF')),
                    decreasing=dict(line=dict(color='#7F7F7F')),
                    name='prediction')

    expectedPlot = go.Candlestick(
                    x=y_dataframe.index,
                    open=y_dataframe.open,
                    high=y_dataframe.high,
                    low=y_dataframe.low,
                    close=y_dataframe.close,
                    name='target')

    fig = tools.make_subplots(rows=1, cols=1, shared_xaxes=True)
    fig.append_trace(rnnPlot, 1, 1)
    fig.append_trace(expectedPlot, 1, 1)

    py.offline.plot(fig, filename='predictionGraph.html')

    return 1


def best_model_params(begin, end):

    df = pd.read_csv("EUR_USD_min.csv", sep=',', header=0, names=['date', 'open', 'high', 'low', 'close', 'Volume'])
    df.date = pd.to_datetime(df.date, format='%d.%m.%Y %H:%M:%S.%f')
    df = df.set_index(df.date)
    df = df[['open', 'high', 'low', 'close']]
    df = df.drop_duplicates(keep=False)
    best = create_model(df, begin)
    best_i = begin

    for i in range(begin+1, end+1):
        print('try: ', i, 'current best: ', best_i)
        time.sleep(0.05)
        x = create_model(df, i)
        if x < best:
            best = x
            best_i = i

    print(best_i, " is the best solution")

    return best_i
