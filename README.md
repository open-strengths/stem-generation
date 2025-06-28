# Stem Generation, Validation and Analysis Scripts

## Overview
This project generates questionnaire stems for various facets using OpenAI's GPT API, validates them for drift and readability, and provides visualizations for analysis.

## Installation

### Step 1: Install `uv`
`uv` is a Python virtual environment manager. Install it using pip:
```bash
pip install uv
```


### Step 2: Create virtual environment in the root of the directory and activate it
```bash
uv venv .venv && source .venv/bin/activate
```

### Step 3: Install dependencies
```bash
uv sync
```


## Usage Flow
### Step 1: Run generator.py
This script generates questionnaire stems for each facet and saves them to a CSV file (ai_stems_generated.csv).  

Run the script:
```bash
python generator.py
```

### Step 2: Run validator.py
This script validates the generated stems for drift and readability, and updates the CSV file with flags.  

Run the script:
```bash
python validator.py
```

### Step 3: Open Jupyter Notebook and View Plots
Use the Jupyter Notebook to analyze the results and visualize the data.  

Start Jupyter Notebook:
```bash
jupyter notebook
```
The terminal output will tell you which port the server is running on.
It may automatically open your browser to the right url.
Navigate to the notebook file, `cos_sims.ipynb` in your browser and open it.


