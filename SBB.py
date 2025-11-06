import numpy as np
from collections import defaultdict
import pandas as pd

"""
Use this script to find the optimal public transportation passes to minimize costs.
"""
# CHOOSE AGE #
youth = True # youth means < 25 years old

################# Abo Prices #############################
if youth:
    ## Jugend ##

    ## Tram Stuff ##
    zvv_tram = 586 # Yearly tram subscription for zones 1-2
    zvv_month = 63

    ## Train Stuff ##
    HT_plus_1000 = [600, 400] # Cost is 600 CHF, additional 400 CHF is bonus
    HT_plus_2000 = [1125, 875] # Cost is 1125 CHF, additional 875 CHF is bonus
    HT_plus_3000 = [1575, 1425] # Cost is 1575 CHF, additional 1425 CHF is bonus
    GA = 2780 
    HT = 100 
    GA_Night = 100

else:
    ## Adult ##
    zvv_tram = 929 # Yearly tram subscription for zones 1-2
    zvv_month = 100


##### Setup the optimization problem #####
class AboCalculator():

    def __init__(self, youth=True):
        """
        Initialize the AboCalculator with different pricing depending on the youth status.
        """
        # Set the youth flag
        self.youth = youth

        ###### Ticket Prices ######
        self.tram_trip_price = 3.20  # Price per tram trip with HT
        self.train_trip_price = 20   # Price per train trip with HT

        ###### Abo Prices ######
        if self.youth:
            ## Jugend ##
            ## Tram Stuff ##
            self.zvv_tram = 586  # Yearly tram subscription for zones 1-2
            self.zvv_month = 63

            ## Train Stuff ##
            self.HT_plus_1000 = [600, 400]  # Cost is 600 CHF, additional 400 CHF is bonus
            self.HT_plus_2000 = [1125, 875] # Cost is 1125 CHF, additional 875 CHF is bonus
            self.HT_plus_3000 = [1575, 1425]# Cost is 1575 CHF, additional 1425 CHF is bonus
            self.GA = 2780  # GA price for youth
            self.HT = 100   # Half-Tax price
            self.GA_Night = 100  # GA Night price for youth

        else:
            ## Adult ##
            self.zvv_tram = 929  # Yearly tram subscription for zones 1-2
            self.zvv_month = 100  # Monthly tram subscription for adults

    ##### Abo Options ####
    def tramabo_HTplus1000(self, traintrips):
        """Calculates the money spent and bonus left with tram Abo and HT plus 1000.

        Args:
            traintrips (int): Train trips per month

        Returns:
            money_spent, bonus_left (float, float): Total money spent on public transportation. Remaining bonus. 
        """

        money_spent = self.zvv_tram #+ self.GA_Night + self.HT
        bonus_left = 0
        if traintrips * 12 * self.train_trip_price > self.HT_plus_1000[0] + self.HT_plus_1000[1]:
            money_spent += traintrips * 12 * self.train_trip_price - self.HT_plus_1000[1]
            bonus_left = 0
        elif traintrips * 12 * self.train_trip_price < self.HT_plus_1000[0]:
            money_spent += traintrips * 12 * self.train_trip_price
            bonus_left = self.HT_plus_1000[1]
        else:
            money_spent += self.HT_plus_1000[0]
            bonus_left = self.HT_plus_1000[0] + self.HT_plus_1000[1] - traintrips * 12 * self.train_trip_price

        return int(money_spent), int(bonus_left)
    
    def tramabo_HTplus2000(self, traintrips):
        """Calculates the money spent and bonus left with tram Abo and HT plus 2000.

        Args:
            traintrips (int): Train trips per month

        Returns:
            money_spent, bonus_left (float, float): Total money spent on public transportation. Remaining bonus. 
        """

        money_spent = self.zvv_tram# + self.GA_Night + self.HT
        bonus_left = 0
        if traintrips * 12 * self.train_trip_price > self.HT_plus_2000[0] + self.HT_plus_2000[1]:
            money_spent += traintrips * 12 * self.train_trip_price - self.HT_plus_2000[1]
            bonus_left = 0
        elif traintrips * 12 * self.train_trip_price < self.HT_plus_2000[0]:
            money_spent += traintrips * 12 * self.train_trip_price
            bonus_left = self.HT_plus_2000[1]
        else:
            money_spent += self.HT_plus_2000[0]
            bonus_left = self.HT_plus_2000[0] + self.HT_plus_2000[1] - traintrips * 12 * self.train_trip_price

        return int(money_spent), int(bonus_left)
    
    def HTplus2000(self, tramtrips, traintrips):
        """Calculates the money spent and bonus left with HT plus 2000.

        Args:
            tramtrips (int): Tram trips per week
            traintrips (int): Train trips per month

        Returns:
            money_spent, bonus_left (float, float): Total money spent on public transportation. Remaining bonus. 
        """
        money_spent = 0 #+ self.GA_Night + self.HT
        bonus_left = 0
        if tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price > self.HT_plus_2000[0]+self.HT_plus_2000[1]:
            money_spent += tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price - self.HT_plus_2000[1]
            bonus_left = 0
        elif tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price < self.HT_plus_2000[0]:
            money_spent += tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price
            bonus_left = self.HT_plus_2000[1]
        else:
            money_spent += self.HT_plus_2000[0]
            bonus_left = self.HT_plus_2000[0]  + self.HT_plus_2000[1]  - (tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price)   

        return int(money_spent), int(bonus_left)
    
    def HTplus3000(self, tramtrips, traintrips):
        """Calculates the money spent and bonus left with HT plus 3000.

        Args:
            tramtrips (int): Tram trips per week
            traintrips (int): Train trips per month

        Returns:
            money_spent, bonus_left (float, float): Total money spent on public transportation. Remaining bonus. 
        """
        money_spent = 0 #+ self.GA_Night + self.HT
        bonus_left = 0
        if tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price > self.HT_plus_3000[0]+self.HT_plus_3000[1]:
            money_spent += tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price - self.HT_plus_3000[1]
            bonus_left = 0
        elif tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price < self.HT_plus_3000[0]:
            money_spent += tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price
            bonus_left = self.HT_plus_3000[1]
        else:
            money_spent += self.HT_plus_3000[0]
            bonus_left = self.HT_plus_3000[0] + self.HT_plus_3000[1] - (tramtrips * 52 * self.tram_trip_price + traintrips * 12 * self.train_trip_price)    

        return int(money_spent), int(bonus_left)


#### Define trip comparison range
tram_per_week_trips = [5, 6, 7, 8]
train_per_month_trips = [1, 2, 3, 4, 5]

results_dic = defaultdict(lambda: defaultdict(dict))         
AboCalculator = AboCalculator(youth=True)

# Calculate money spent and bonus left
for tram_trips in tram_per_week_trips:
    for train_trips in train_per_month_trips:
        results_dic[tram_trips][train_trips]["Tram Abo + HT Plus 1000"] = AboCalculator.tramabo_HTplus1000(traintrips=train_trips)
        results_dic[tram_trips][train_trips]["Tram Abo + HT Plus 2000"] = AboCalculator.tramabo_HTplus2000(traintrips=train_trips)
        results_dic[tram_trips][train_trips]["HT Plus 2000"] = AboCalculator.HTplus2000(tramtrips=tram_trips, traintrips=train_trips)
        results_dic[tram_trips][train_trips]["HT Plus 3000"] = AboCalculator.HTplus3000(tramtrips=tram_trips, traintrips=train_trips)

table_data = []

# Loop through the first level keys (tram trips per week)
for tram_trips, train_trip_data in results_dic.items():
    # Loop through the second level keys (train trips per month)
    for train_trips, value_data in train_trip_data.items():
        # Extract the values for each scenario
        tram_abo_ht1000 = value_data.get('Tram Abo + HT Plus 1000', (0, 0))
        tram_abo_ht2000 = value_data.get('Tram Abo + HT Plus 2000', (0, 0))
        ht_plus_2000 = value_data.get('HT Plus 2000', (0, 0))
        ht_plus_3000 = value_data.get('HT Plus 3000', (0, 0))
        
        # Add a row to the table with tram trips, train trips, and the 4 scenarios
        table_data.append([tram_trips, train_trips, tram_abo_ht1000, tram_abo_ht2000, ht_plus_2000, ht_plus_3000])

# Create the pandas DataFrame
columns = ['Tram trips per week (3.20CHF)', 'Train trips per month (20CHF)', 
           'Tram Abo + HT Plus 1000', 'Tram Abo + HT Plus 2000', 
           'HT Plus 2000', 'HT Plus 3000']

df = pd.DataFrame(table_data, columns=columns)

# Display the DataFrame as a table
print(df)

# Define a custom function to highlight the smallest tuple value in each row
def highlight_min(row):
    # Extract the tuples from the row
    values = [row['Tram Abo + HT Plus 1000'], row['Tram Abo + HT Plus 2000'], row['HT Plus 2000'], row['HT Plus 3000']]
    
    # Find the minimum by first number, and in case of a tie, by second number
    min_value = min(values, key=lambda x: (x[0], x[1]))
    
    # Apply background color based on the minimum value found
    return ['background-color: yellow' if v == min_value else '' for v in values]

# Apply the style across the columns with tuples
styled_df = df.style.apply(highlight_min, subset=['Tram Abo + HT Plus 1000', 'Tram Abo + HT Plus 2000', 'HT Plus 2000', 'HT Plus 3000'], axis=1)

# Display the styled DataFrame with highlighted cells
styled_df


# AboCalculator = AboCalculator(youth=True)
# money_spent, bonus_left = AboCalculator.tramabo_HTplus1000(6)
# print("tram HT plus 1000 money: ", money_spent)
# print("tram HT plus 1000 bonus: ", bonus_left)
# money_spent, bonus_left = AboCalculator.tramabo_HTplus2000(6)
# print("tram HT plus 2000 money: ", money_spent)
# print("tram HT plus 2000 bonus: ", bonus_left)
# money_spent, bonus_left = AboCalculator.HTplus2000(5, 6)
# print("HT plus 2000 money: ", money_spent)
# print("HT plus 2000 bonus: ", bonus_left)
# money_spent, bonus_left = AboCalculator.HTplus3000(5, 6)
# print("HT plus 3000 money: ", money_spent)
# print("HT plus 3000 bonus: ", bonus_left)



# ##### Scenario I #####
# """
# Tram Abo + HT_plus_1000 + GA_Night + HT
# """
# money_spent = zvv_tram + GA_Night + HT
# bonus_left = 0
# if traintrips * 52 * train_trip_price > HT_plus_1000[0]+HT_plus_1000[1]:
#     money_spent += traintrips * 52 * train_trip_price - HT_plus_1000[1]
#     bonus_left = 0
# elif traintrips * 52 * train_trip_price < HT_plus_1000[0]:
#     money_spent += traintrips * 52 * train_trip_price
#     bonus_left = HT_plus_1000[1]
# else:
#     money_spent += HT_plus_1000[0]
#     bonus_left = traintrips * 52 * train_trip_price - HT_plus_1000[0]

# print("MONEY SPENT SCENARIO TRAM ABO + HT_PLUS_1000: ",money_spent)
# print("BONUS LEFT SCENARIO TRAM ABO + HT_PLUS_1000: ", bonus_left)

# ##### Scenario II #####
# """
# HT_plus_2000 + GA_Night + HT
# """
# money_spent = GA_Night + HT
# bonus_left = 0
# if tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price > HT_plus_2000[0]+HT_plus_2000[1]:
#     money_spent += tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price - HT_plus_2000[1]
#     bonus_left = 0
# elif tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price < HT_plus_2000[0]:
#     money_spent += tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price
#     bonus_left = HT_plus_2000[1]
# else:
#     money_spent += HT_plus_2000[0]
#     bonus_left = tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price - HT_plus_2000[0]

# print("MONEY SPENT SCENARIO HT_PLUS_2000: ",money_spent)
# print("BONUS LEFT SCENARIO HT_PLUS_2000: ", bonus_left)

# ##### Scenario III #####
# """
# HT_plus_3000 + GA_Night + HT
# """
# money_spent = GA_Night + HT
# bonus_left = 0
# if tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price > HT_plus_3000[0]+HT_plus_3000[1]:
#     money_spent += tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price - HT_plus_3000[1]
#     bonus_left = 0
# elif tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price < HT_plus_3000[0]:
#     money_spent += tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price
#     bonus_left = HT_plus_3000[1]
# else:
#     money_spent += HT_plus_3000[0]
#     bonus_left = tramtrips * 52 * tram_trip_price + traintrips * 52 * train_trip_price - HT_plus_3000[0]

# print("MONEY SPENT SCENARIO HT_PLUS_3000: ",money_spent)
# print("BONUS LEFT SCENARIO HT_PLUS_3000: ", bonus_left)

# ##### Scenario IV #####
# """
# Tram Abo + HT_plus_2000 + GA_night + HT
# """

# ##### Scenario V #####
# """
# GA + HT
# """
