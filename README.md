#### guillaume-brialon.github.io

Feuille de route Berenis, publiée via GitHub Pages sur [guillaume-brialon.github.io/berenis](https://guillaume-brialon.github.io/berenis/).

## Marche à suivre pour mettre à jour la page

La source est le fichier `berenis/gen/backlog.csv`.

1. **Remplir le CSV** : copier-coller les colonnes A et B du [document Google Sheets](https://docs.google.com/spreadsheets/d/16edY1hBkiHkLNF0Uc6APhiD-iT747tqaKmm38FOvJns/edit?usp=sharing) dans `berenis/gen/backlog.csv` (le copier-coller depuis Google Sheets produit des colonnes séparées par des tabulations, c'est le format attendu).
   - Les lignes préfixées par `➜ ` sont des jalons.
   - La colonne B contient le statut : `✅` (terminé) ou un pourcentage d'avancement (ex. `75`).

2. **Générer la page** :

   ```bash
   cd berenis/gen
   node generate-timeline.js
   ```

   Le script génère `berenis/index.html`.

3. **Publier** : commit puis push pour publier la page.

   ```bash
   git add .
   git commit -m "updates for ..."
   git push
   ```