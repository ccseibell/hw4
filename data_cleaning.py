import pandas as pd

# Read the CSV file
data = pd.read_csv(r"C:\Users\clayt\Downloads\steak-risk-survey.csv")

# Remove rows with missing values
data = data.dropna(how='any')

# Remove leading/trailing whitespace from string columns
string_cols = data.select_dtypes(include=['object']).columns
data[string_cols] = data[string_cols].apply(lambda x: x.str.strip())

# Rename the long column name
data = data.rename(columns={'Consider the following hypothetical situations: <br>In Lottery A, you have a 50% chance of success, with a payout of $100. <br>In Lottery B, you have a 90% chance of success, with a payout of $20. <br><br>Assuming you have $10 to bet, would you play Lottery A or Lottery B?': 'Lot_A_or_B'})

# Print column names
print(data.columns)

# Convert categorical columns to appropriate data types
categorical_cols = list(data.columns)
categorical_cols.remove('RespondentID')

for col in categorical_cols:
    data[col] = data[col].astype('category')

# Convert numerical columns to appropriate data types
numerical_cols = ['RespondentID']
for col in numerical_cols:
    data[col] = pd.to_numeric(data[col], errors='coerce')

# Rename columns to remove whitespace and special characters
data.columns = data.columns.str.replace(r'[^a-zA-Z0-9_]', '_', regex=True)

# Print the cleaned data
print(data)
data.to_csv('cleaned_data.csv', index=False)