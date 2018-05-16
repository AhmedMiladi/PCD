from Functions import *


df = pd.read_csv("EUR_USD_min.csv", sep=',', header=0, names=['date', 'open', 'high', 'low', 'close', 'Volume'])
df.date = pd.to_datetime(df.date, format='%d.%m.%Y %H:%M:%S.%f')
df = df.set_index(df.date)
df = df[['open', 'high', 'low', 'close']]
df = df.drop_duplicates(keep=False)

create_model(df)
