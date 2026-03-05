# MRT-Bot

## Fonctionnalités
- Discord.js V14 
- Database
- Panel Web
- Antiraid
- Contact
- Gestion
- Information
- Logs
- Modération
- Paramètres
- Utilitaires
- Jeux
- Films
- IA
- FiveM
- Profil
- Codex
- Bourse

> [!CAUTION]
> ### 🛡️ Avertissement : Commande Screenshot
> L'utilisation de la commande `+screenshot` avec le JavaScript activé (`on js`) comporte des risques :
> - **Consommation de ressources :** L'exécution du JS sature davantage le CPU et la RAM de votre hébergeur.
> - **Sécurité de l'hôte :** Le bot exécute des scripts tiers. Un site malveillant pourrait tenter d'exploiter des failles du navigateur (Puppeteer).
> - **Exposition d'IP :** L'adresse IP de votre serveur est directement visible par les sites capturés.
> **Conseil :** Laissez le mode JS sur `off` par défaut et ne l'activez que pour des besoins spécifiques.

## Prérequis
- [Node.js](https://nodejs.org/fr/download/current) (22.12+)
- [Fichiers](https://github.com/martindepanne/MRT-Bot/archive/refs/heads/main.zip)
- [Token](https://discord.com/developers/applications)

## Installation
1. Configurer le config.json / Gemini API : https://aistudio.google.com/api-keys / Ajouter ton bot à tes applications ( perm minimum : identify)
2. Installer les dépendances, en ouvrant l'invite de commande
```bash
npm install
```
3. Démarrer le bot
```bash
node index.js
```
Ou pour éviter les Warning
```bash
node --no-deprecation index.js
```

## MAJS

Pour mettre à jour, il suffit de conserver la database et la config puis de les glisser dans un dossier à jour ( sauf quand le config est mis à jour)

## HEBERGEUR

remplacer dans Events/loadDatabase.js
```
const dbPath = path.join(__dirname, '../database.sqlite3');
```
Par
```
const dbPath = path.join(process.cwd(), 'database.sqlite3');
```
Et remplacer le fichier Dashboard/server.js par Dashboard/hebergeurserver.js
Puis remettez lui le nom server.js


## Crédit
- Martin Dépanne (([Discord](https://guns.lol/martindepanne)/([Github](https://github.com/martindepanne))))
- Rework du bot de 4wip
