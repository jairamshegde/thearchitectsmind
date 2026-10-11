---
title: A Beginner’s Guide to Setting Up a Miniforge Conda Environment for Python in VS Code
date: 2026-10-11
tags:
  - python
  - coding
draft: false
---

If you are learning Python, setting up your tools the right way makes everything easier. A clean environment keeps packages organized, avoids version conflicts, and helps you focus on learning instead of troubleshooting. Miniforge is a lightweight conda-based installer built around the conda-forge ecosystem, and VS Code is a beginner-friendly editor that works well with Python once you select the right interpreter.

## Step 1: Install Miniforge

Miniforge is a minimal installer for conda and mamba that comes preconfigured to use conda-forge as the default channel. In practice, that means your packages come from a community-maintained ecosystem instead of the older default conda channel setup. That makes it a strong choice for learners who want a simple, modern Python environment.

[Download link](https://conda-forge.org/download/)

Once installation complete, verify installation using following command

```shell
conda --version
```

Expected output:

```shell
conda 25.x.x
```

If you see a version number, Miniforge is installed correctly.

## Step 2: Install and Set up VS Code

Visual Studio Code (VS Code) is a free, lightweight, and powerful source code editor developed by Microsoft. It supports a wide range of programming languages, including Python, JavaScript, Java, C++, and many others. VS Code provides everything you need to write, test, and manage your code efficiently.

For Python learners, VS Code becomes even more powerful when paired with the official Python extension. It offers syntax highlighting, code suggestions, linting, debugging, Jupyter Notebook support, and seamless integration with Python environments such as Miniforge or Anaconda.

[Download link](https://code.visualstudio.com/download?_exp_download=fb315fc982)

[learn more about extensions here](https://code.visualstudio.com/docs/configure/extensions/extensions)

### Recommended Extensions

| Extension | Required | Purpose |
| --- | --- | --- |
| Python (Microsoft) | ✅ Yes | Core Python support |
| Pylance (Microsoft) | ✅ Yes | Intelligent code completion and analysis |
| Jupyter (Microsoft) | Optional | Notebook development |
| Ruff (Astral) | Recommended | Linting and formatting |
| AI coding assistants | Recommended | Claude Code / Co-Pilot (your choice) |

you can open the vs code using `code .` (Note: space between code and dot) from the choice of your folder in terminal.

## Step 3: Create your first environment

Once Miniforge is installed, open a terminal and create a new environment for learning Python. A separate environment keeps your learning projects isolated from the rest of your system.

### What is a Virtual Environment?

A virtual environment is an isolated workspace that contains its own Python interpreter and installed packages. Instead of installing libraries globally on your computer, each project can have its own dedicated environment with its own dependencies.

For example, one project may require **Python 3.12** and the latest version of **NumPy**, while another project might depend on **Python 3.10** and an older version of the same library. By using separate virtual environments, both projects can coexist without conflicts.

### Create Virtual env using conda

Give the meaningful name to your environment and correct python version. Here `pyenv` is the environment name and version is 3.12(you can use the latest stable version)

```shell
conda create --name pyenv python=3.12 -y
```

### some useful conda commands

The following are some of the most commonly used Conda commands for creating and managing Python environments.

| Command | Description |
| --- | --- |
| `conda --version` | Display the installed Conda version. |
| `conda info` | Show information about the Conda installation and current environment. |
| `conda env list` | List all available Conda environments. |
| `conda create -n myenv python=3.12` | Create a new environment named `myenv` with Python 3.12. |
| `conda activate myenv` | Activate the `myenv` environment. |
| `conda deactivate` | Exit the currently active environment. |
| `conda install package_name` | Install a package in the active environment. |
| `conda install package1 package2` | Install multiple packages at once. |
| `conda update conda` | Update Conda to the latest version. |
| `conda update --all` | Update all installed packages in the active environment. |
| `conda remove package_name` | Remove a package from the active environment. |
| `conda remove -n myenv --all` | Delete the entire `myenv` environment. |
| `conda list` | List all packages installed in the current environment. |
| `conda search package_name` | Search for a package available in Conda repositories. |
| `conda clean --all` | Remove unused package caches and temporary files to free disk space. |
| `conda env create -f environment.yml` | Create an environment from a YAML file. |
| `conda doctor` | Check the health of your Conda installation (available in newer Conda versions). |

## Step 4: Install a few useful packages

<div data-node-type="callout">
<div data-node-type="callout-emoji">💡</div>
<div data-node-type="callout-text">always activate environment before installing any packages</div>
</div>

For beginner practice, you can start small.

### Recommended Starter Packages for Beginners

If you're just beginning your Python journey, these packages are a great starting point:

*   `numpy` – Numerical computing
    
*   `pandas` – Data analysis
    
*   `matplotlib` – Data visualization
    
*   `requests` – Working with web APIs
    
*   `openpyxl` – Excel file handling
    
*   `jupyterlab` – Interactive coding environment
    
*   `pytest` – Learning software testing
    
*   `fastapi` - Most used web app server
    

## Step 5: Run the Hello-World

A simple folder might look like this:

```plaintext
python-learning/
├── .vscode/
├── main.py
└── README.md
```

### [Main.py](http://Main.py)

```python
def hello_name(name):
    return f"Hello, {name}!"


if __name__ == "__main__":
    user_input = input("Hello User, please enter your name: ")
    print("Namaste India 🇮🇳")
    print(hello_name(user_input))

```

### Steps to execute the main file

1.  open the terminal and activate the environment
    
2.  list the available file in the current directory or folder to make sure you're in the correct location.
    
3.  then run command `python main.py`
    
4.  `README.md` is the project information file, you're going to use as you progress.
    

```plaintext
Hello User, please enter your name: Bharat
Namaste India 🇮🇳
Hello, Bharat!
```

## Common beginner mistakes

The most common mistake is installing packages into the wrong Python environment. Another is forgetting to select the interpreter in VS Code, which can make it look like packages are “missing” even though they are installed.
