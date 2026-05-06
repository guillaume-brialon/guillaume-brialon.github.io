#!/usr/bin/env node
/**
 * Script pour générer une page HTML de feuille de route Berenis
 * à partir du fichier backlog.csv
 *
 * Usage: node generate-timeline.js
 * Output: ../index.html
 */

import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MILESTONE_PREFIX = '➜ '
const DONE_MARKER = '✅'

/**
 * Parse le statut (pourcentage ou ✅) et retourne un nombre entre 0 et 100
 */
function parseProgress(status) {
  const trimmed = status?.trim()
  if (!trimmed) return 0
  if (trimmed === DONE_MARKER) return 100

  // Extraire le pourcentage (ex: "75%", "75 %", "75")
  const match = trimmed.match(/^(\d+)\s*%?$/)
  if (match) {
    return Math.min(100, Math.max(0, parseInt(match[1], 10)))
  }
  return 0
}

// Chemins des fichiers
const inputFile = path.join(__dirname, 'backlog.csv')
const outputFile = path.join(__dirname, '../index.html')

/**
 * Parse le fichier CSV et retourne les jalons avec leurs étapes
 */
function parseBacklog(content) {
  const lines = content.split('\n')
  const milestones = []
  let currentSteps = []

  for(const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Séparer les colonnes (tab-separated)
    const [name, status] = trimmedLine.split('\t')
    const progress = parseProgress(status)

    if (name.startsWith(MILESTONE_PREFIX)) {
      // C'est un jalon - on collecte les étapes précédentes
      milestones.push({
        name: name.slice(MILESTONE_PREFIX.length),
        progress,
        steps: [...currentSteps],
      })
      currentSteps = []
    }
    else {
      //console.log(`----- Processing step: ${name} with progress ${progress}%`)
      // C'est une étape
      currentSteps.push({
        name,
        progress,
      })
    }
  }

  return milestones
}

/**
 * Détermine l'index du jalon courant (premier jalon non terminé)
 */
function findCurrentMilestoneIndex(milestones) {
  for(let i = 0; i < milestones.length; i++) {
    if (!milestones[i].progress < 100) {
      return i
    }
  }
  return milestones.length - 1 // Tous terminés, on prend le dernier
}

/**
 * Génère le HTML de la page
 */
function generateHTML(milestones) {
  const currentIndex = findCurrentMilestoneIndex(milestones)

  const milestonesHTML = milestones.map((milestone, index) => {
    const isCurrent = index === currentIndex
    const isPast = index < currentIndex

    const stepsHTML = milestone.steps.map(step => {
      const isComplete = step.progress >= 100
      const hasProgress = step.progress > 0 && step.progress < 100

      return `
                        <li>
                            <label>
                                <div class="step-checkbox ${isComplete ? 'complete' : ''} ${hasProgress ? 'in-progress' : ''}">
                                    ${hasProgress ? `<div class="step-progress" style="--progress: ${step.progress}%"></div>` : ''}
                                    ${isComplete ? '<span class="checkmark">✓</span>' : ''}
                                </div>
                                <span class="${isComplete ? 'complete' : ''}">${escapeHtml(step.name)}</span>
                                ${hasProgress ? `<span class="progress-label">${step.progress}%</span>` : ''}
                            </label>
                        </li>`
    }).join('')

    const milestoneComplete = milestone.progress >= 100
    const milestoneHasProgress = milestone.progress > 0 && milestone.progress < 100

    return `
                <div class="milestone-block ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}">
                    <div class="milestone-marker">
                        <div class="marker ${isCurrent ? 'filled' : 'hollow'}" ${milestoneHasProgress ? `style="--milestone-progress: ${milestone.progress}%"` : ''}>
                        </div>
                    </div>
                    <div class="milestone-content">
                        <h2 class="milestone-title">
                            ${escapeHtml(milestone.name)}
                            ${milestoneHasProgress ? `<span class="milestone-progress-label">${milestone.progress}%</span>` : ''}
                            ${milestoneComplete ? '<span class="milestone-complete-label">✓</span>' : ''}
                        </h2>
                        <ul class="steps-list">${stepsHTML}
                        </ul>
                    </div>
                </div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feuille de Route Berenis</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg-color: #ffffff;
            --accent-color: #000091;
            --secondary-color: #123765;
            --success-color: #5b8c5a;
            --progress-color: #ea580c;
            --text-color: #1e1e1e;
            --text-muted: #666666;
            --border-color: #e0e0e0;
            --line-width: 4px;
            --marker-size: 24px;
            --marker-border: 4px;
            --content-left: 80px;
            --line-center: 40px;
        }

        body {
            background-color: var(--bg-color);
            min-height: 100vh;
            font-family: 'Raleway', system-ui, -apple-system, sans-serif;
            font-size: 16px;
            color: var(--text-color);
            font-variant-numeric: lining-nums;
        }

        .header {
            padding: 60px 40px 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--accent-color);
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }

        .header .subtitle {
            font-size: 1.1rem;
            color: var(--text-muted);
            font-weight: 400;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px 40px 60px;
            position: relative;
        }

        /* Ligne verticale de la timeline */
        .timeline {
            position: relative;
            padding-left: var(--content-left);
        }

        .timeline::before {
            content: '';
            position: absolute;
            left: calc(var(--line-center) - var(--line-width) / 2);
            top: 0;
            bottom: 0;
            width: var(--line-width);
            background: var(--accent-color);
            border-radius: 2px;
        }

        .milestone-block {
            position: relative;
            display: flex;
            margin-bottom: 50px;
        }

        .milestone-block:last-child {
            margin-bottom: 0;
        }

        .milestone-marker {
            position: absolute;
            left: calc(-1 * var(--content-left) + var(--line-center) - var(--marker-size) / 2 - var(--marker-border));
            width: calc(var(--marker-size) + 2 * var(--marker-border));
            height: calc(var(--marker-size) + 2 * var(--marker-border));
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Marqueur cercle évidé (jalon non courant) */
        .marker.hollow {
            width: var(--marker-size);
            height: var(--marker-size);
            border-radius: 50%;
            background-color: var(--bg-color);
            border: var(--marker-border) solid var(--accent-color);
            position: relative;
        }

        /* Marqueur disque plein (jalon courant) */
        .marker.filled {
            width: calc(var(--marker-size) + 2 * var(--marker-border));
            height: calc(var(--marker-size) + 2 * var(--marker-border));
            border-radius: 50%;
            background-color: var(--accent-color);
        }

        /* Jalons passés */
        .milestone-block.past .marker.hollow {
            background-color: var(--success-color);
            border-color: var(--success-color);
        }

        .milestone-content {
            flex: 1;
            background: var(--bg-color);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid var(--border-color);
        }

        .milestone-block.current .milestone-content {
            border-color: var(--accent-color);
            border-width: 2px;
        }

        .milestone-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--accent-color);
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .milestone-progress-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--progress-color);
            background: rgba(255, 149, 0, 0.1);
            padding: 2px 8px;
            border-radius: 12px;
        }

        .milestone-complete-label {
            font-size: 1rem;
            color: var(--success-color);
        }

        .steps-list {
            list-style: none;
        }

        .steps-list li {
            margin-bottom: 10px;
        }

        .steps-list li:last-child {
            margin-bottom: 0;
        }

        .steps-list label {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            cursor: default;
            font-size: 0.95rem;
            line-height: 1.5;
        }

        /* Checkbox personnalisée avec progression */
        .step-checkbox {
            width: 18px;
            height: 18px;
            min-width: 18px;
            border: 2px solid var(--border-color);
            border-radius: 4px;
            background: transparent;
            margin-top: 2px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .step-checkbox.complete {
            background-color: var(--success-color);
            border-color: var(--success-color);
        }

        .step-checkbox.in-progress {
            border-color: var(--progress-color);
        }

        .step-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: var(--progress);
            background-color: var(--progress-color);
            opacity: 0.3;
        }

        .step-checkbox .checkmark {
            color: white;
            font-size: 12px;
            font-weight: bold;
            z-index: 1;
        }

        .steps-list span {
            color: var(--text-color);
        }

        .steps-list span.complete {
            color: var(--text-muted);
            text-decoration: line-through;
        }

        .progress-label {
            font-size: 0.8rem;
            color: var(--progress-color);
            font-weight: 600;
            margin-left: auto;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding: 40px;
            color: var(--text-muted);
            font-size: 0.85rem;
        }

        /* Responsive */
        @media (max-width: 600px) {
            .header h1 {
                font-size: 1.8rem;
            }
    
            .container {
                padding: 20px;
            }
    
            :root {
                --content-left: 60px;
                --line-center: 30px;
            }

            .milestone-content {
                padding: 16px;
            }

            .milestone-title {
                font-size: 1.1rem;
                flex-wrap: wrap;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>Feuille de route Berenis</h1>
        <p class="subtitle">Suivi des jalons et étapes du projet</p>
    </header>

    <main class="container">
        <div class="timeline">
${milestonesHTML}
        </div>
    </main>

    <footer class="footer">
        <p>Généré automatiquement le ${new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}</p>
    </footer>
</body>
</html>`
}

/**
 * Échappe les caractères HTML
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Main
try {
  console.log('📖 Lecture du fichier backlog.csv...')
  const content = fs.readFileSync(inputFile, 'utf-8')

  console.log('🔍 Analyse du contenu...')
  const milestones = parseBacklog(content)
  console.log(`   → ${milestones.length} jalons trouvés`)

  const currentIndex = findCurrentMilestoneIndex(milestones)
  console.log(`   → Jalon courant: "${milestones[currentIndex].name}"`)

  console.log('🎨 Génération du HTML...')
  const html = generateHTML(milestones)

  console.log(`💾 Écriture vers ${outputFile}...`)
  fs.writeFileSync(outputFile, html, 'utf-8')

  console.log('✅ Feuille de route générée avec succès!')
} catch (error) {
  console.error('❌ Erreur:', error.message)
  process.exit(1)
}
