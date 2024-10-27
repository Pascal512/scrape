const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

const app = express();
const port = 3000;

// Middleware pour forcer les réponses JSON
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*"); // Permet l'accès depuis n'importe quelle origine
    res.header("Access-Control-Allow-Methods", "GET, POST"); // Autorise les méthodes GET et POST
    res.header("Access-Control-Allow-Headers", "*"); // Autorise le header Content-Type
    next();
});

// Root
router.get('/', (req, res) => {
    res.json({
        response: 'API en marche'
    });
});

// Root
router.get('/test', (req, res) => {
    const { url, type } = req.query;
    res.json({
        response: 'Route test API en marche. Avec comme paramètres : type == ' + type + ' | url == ' + url
    });
});

// Route principale pour le scraping avec paramètres dynamiques
app.get('/scrape', (req, res) => {
    const { url, type } = req.query;

    if (!url || !type) {
        return res.status(400).json({ error: "L'URL et le type d'extraction sont obligatoires." });
    }

    try {
        // Récupère le contenu HTML de l'URL fournie
        const response = axios.get(decodeURIComponent(url));
        const $ = cheerio.load(response.data);

        let result;

        switch (type) {
            case 'texte':
                // Extrait tout le texte de la page
                result = $('body').text().trim();
                break;

            case 'images':
                // Extrait toutes les URLs des images de la page
                result = $('img').map((i, el) => $(el).attr('src')).get();
                break;

            case 'brut':
                // Récupère le HTML complet de la page
                result = $.html();
                break;

            default:
                return res.status(400).json({ error: "Type d'extraction invalide. Utilisez 'texte', 'images' ou 'brut'." });
        }

        res.json({ url, type, result });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du scraping', details: error.message });
    }
});

// Démarrage du serveur
/*app.listen(port, () => {
    console.log(`API de scraping en cours d'exécution sur http://localhost:${port}`);
});*/

app.use('/.netlify/functions/api', router);
//app.use('/', router);

module.exports.handler = serverless(app);
