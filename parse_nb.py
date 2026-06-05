import json
with open('Breast_Canser_Classifiaction_Birad (1) (1).ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)
with open('notebook_code.py', 'w', encoding='utf-8') as out:
    for cell in nb['cells']:
        if cell['cell_type'] == 'code':
            out.write(''.join(cell['source']) + '\n\n')
