export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: number;
  category: "guide" | "tutorial" | "news" | "case-study";
  image?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "guide-creer-cel-suisse-2026",
    title: "Guide complet: créer sa CEL en Suisse en 2026",
    excerpt:
      "Le cadre légal a changé en 2025. Voici ce que ça signifie concrètement si vous voulez lancer une communauté énergétique cette année.",
    content: `
## La CEL n'est plus un RCP

Première chose à clarifier: depuis janvier 2025, on ne parle plus vraiment de RCP (Regroupement dans le cadre de la Consommation Propre). La nouvelle Loi sur l'électricité introduit les **Communautés Électriques Locales (CEL)** avec des règles différentes.

La différence principale? Vous n'êtes plus limité à un seul bâtiment ou terrain contigu. Une CEL peut regrouper des bâtiments dans un rayon de plusieurs kilomètres, tant qu'ils sont sur le même réseau basse tension.

## Ce que votre GRD ne vous dit pas forcément

J'ai accompagné une dizaine de projets CEL en Romandie. Voici ce que j'aurais aimé savoir dès le départ:

**Les délais sont longs.** Comptez 3-6 mois entre votre première demande et la mise en service. Romande Énergie, Groupe E, SIG — chaque GRD a ses propres processus. Certains sont réactifs, d'autres... moins.

**Le tarif du timbre varie.** Quand on parle de "40% de réduction sur le timbre", c'est 40% du tarif d'acheminement basse tension. Mais ce tarif varie de 6 à 10 ct/kWh selon votre GRD. Faites le calcul avec VOS tarifs.

**Les compteurs, c'est le nerf de la guerre.** Vous avez besoin de compteurs quart-horaires pour chaque point de mesure. Si vos membres ont encore des vieux compteurs Ferraris, prévoyez le remplacement dans votre planning (et votre budget — même si c'est souvent gratuit, ça prend du temps).

## Les vraies étapes (pas la version théorique)

### 1. Sondez l'intérêt avant tout

Avant de contacter le GRD ou de rédiger des statuts, parlez à vos voisins. Combien sont vraiment intéressés? Combien ont déjà des panneaux? Combien seraient prêts à en installer?

Un projet CEL avec 4 membres motivés vaut mieux qu'un projet avec 20 membres tièdes dont la moitié va se désister.

### 2. Vérifiez la faisabilité technique

Appelez votre GRD et posez LA question: "Est-ce que les adresses X, Y, Z sont sur le même transformateur?"

Si oui, vous avez droit à 40% de réduction sur le timbre. Si non, c'est 20%. Cette différence peut représenter plusieurs milliers de francs par an.

### 3. Choisissez votre structure juridique

Trois options principales:
- **Association**: simple, démocratique, idéale pour les petites CEL de quartier
- **Coopérative**: plus structurée, permet de lever des fonds, adaptée aux projets ambitieux
- **Contrat de droit privé**: rapide à mettre en place, mais moins protecteur pour les membres

Pour une CEL de 10-15 membres dans un quartier, l'association suffit largement.

### 4. Définissez vos règles AVANT les problèmes

Les conflits arrivent toujours sur les mêmes sujets:
- Comment répartir l'énergie quand il n'y en a pas assez pour tout le monde?
- Que se passe-t-il si un membre part?
- Qui paie si quelqu'un ne paie pas ses factures?

Écrivez les règles maintenant, pendant que tout le monde est de bonne humeur.

### 5. Mettez en place la gestion opérationnelle

C'est là que 90% des CEL galèrent. Chaque mois, il faut:
- Récupérer les données de consommation (souvent en CSV depuis le portail du GRD)
- Calculer la répartition selon votre clé choisie
- Générer les factures pour chaque membre
- Gérer les paiements et les relances

Avec Excel, comptez une journée par mois. C'est gérable au début, épuisant après 6 mois.

## Le vrai coût d'une CEL

Personne n'en parle, alors je le fais:

**Coûts de mise en place:**
- Statuts/contrats: CHF 500-2'000 (si vous passez par un avocat)
- Frais GRD pour l'étude de faisabilité: CHF 0-500 selon le GRD
- Installation compteurs: généralement gratuit, mais vérifiez

**Coûts récurrents:**
- Gestion administrative: 0 si vous le faites vous-même, CHF 100-300/mois si vous déléguez
- Frais GRD annuels: quelques centaines de francs
- Logiciel de gestion: CHF 79-500/mois selon la solution

**Économies typiques:**
- CEL de 15 membres avec 100 kWc: CHF 4'000-8'000/an d'économies brutes
- Après coûts de gestion: CHF 2'500-6'000/an d'économies nettes

Le retour sur investissement est réel, mais il faut être réaliste sur les chiffres.

## Mon conseil

Commencez petit. 5-10 membres motivés qui se connaissent. Testez pendant un an. Ensuite seulement, envisagez d'agrandir.

Les CEL qui échouent sont souvent celles qui ont voulu voir trop grand trop vite.
    `,
    author: "Équipe Kiwatt",
    date: "2026-01-10",
    readTime: 8,
    category: "guide",
  },
  {
    slug: "5-erreurs-gestion-cel",
    title: "5 erreurs que j'ai vues (et faites) en gérant des CEL",
    excerpt:
      "Après avoir accompagné une vingtaine de CEL en Suisse romande, voici les pièges dans lesquels tout le monde tombe — et comment les éviter.",
    content: `
## Erreur 1: Le tableur Excel "provisoire" qui dure 3 ans

On se dit tous la même chose au début: "Je vais faire un petit Excel pour commencer, on verra après."

18 mois plus tard, le fichier fait 47 onglets, personne d'autre ne comprend les formules, et vous passez un week-end par mois à le maintenir. Je l'ai vécu. J'ai vu des gestionnaires de CEL le vivre.

**Le problème n'est pas Excel.** C'est que la gestion d'une CEL est plus complexe qu'on ne le pense:
- Les courbes de charge arrivent en format différent selon le GRD
- Il y a des cas limites (membre absent 2 mois, nouveau membre en milieu de mois, compteur en panne)
- Les membres veulent voir leurs données, pas juste recevoir une facture

**Ce que j'aurais dû faire:** Soit investir dans un vrai outil dès le départ, soit accepter que ma solution bricolée aurait des limites et les documenter.

## Erreur 2: Sous-estimer la charge mentale

Ce n'est pas juste le temps passé. C'est le fait d'y penser constamment.

"Est-ce que j'ai bien récupéré les données ce mois?" "Mme Dupont a appelé, elle ne comprend pas sa facture." "Le nouveau compteur de M. Martin n'envoie pas de données."

Après un an, plusieurs gestionnaires bénévoles que je connais ont jeté l'éponge. Pas par manque de temps, par épuisement mental.

**La solution:** Soit vous déléguez à une structure (régie, coopérative énergétique), soit vous automatisez au maximum. Le bénévolat à long terme, ça ne marche que si la charge reste gérable.

## Erreur 3: La clé de répartition "équitable" qui ne l'est pas

Au début, tout le monde est d'accord: "On répartit au prorata de la consommation, c'est logique."

6 mois plus tard: "Pourquoi la famille Martin avec leur piscine chauffée reçoit 40% de l'énergie solaire alors que moi j'en reçois que 5%?"

**Le problème:** Une répartition au prorata favorise les gros consommateurs. Si vous voulez vraiment l'équité, il faut réfléchir à d'autres modèles:
- Répartition égalitaire (chacun reçoit la même part)
- Répartition plafonnée (maximum X kWh par membre avant redistribution)
- Répartition selon l'investissement (ceux qui ont financé les panneaux reçoivent plus)

**Mon conseil:** Discutez-en AVANT le lancement. Faites des simulations avec les vraies données de consommation. Montrez ce que ça donne concrètement.

## Erreur 4: Ne pas prévoir les départs

Un membre veut quitter la CEL. Simple, non?

Sauf que:
- Il a contribué à l'installation des panneaux. Il veut récupérer sa mise.
- Son départ change la répartition pour tout le monde.
- Le contrat ne prévoit rien sur le sujet.

J'ai vu une CEL se déchirer pendant 8 mois sur le départ d'un seul membre. Les avocats ont coûté plus cher que l'économie de 2 ans.

**La solution:** Dans vos statuts, prévoyez explicitement:
- Le préavis de départ (3-6 mois, c'est raisonnable)
- Les conditions de remboursement des investissements (ou pas)
- Ce qui se passe avec les factures impayées

## Erreur 5: Oublier que les gens ne lisent pas les emails

Vous envoyez un email expliquant le nouveau mode de calcul. Vous pensez que tout le monde est informé.

3 mois plus tard: "Personne ne m'a prévenu!"

**La réalité:** Les gens ne lisent pas les emails. Ou ils les lisent en diagonale. Ou ils les oublient.

**Ce qui marche mieux:**
- Une assemblée annuelle obligatoire (avec apéro, ça aide)
- Un tableau de bord en ligne où chaque membre voit SES données
- Des factures claires avec le détail du calcul

La transparence, ce n'est pas envoyer l'info. C'est s'assurer qu'elle est comprise.

## Le mot de la fin

Ces erreurs sont normales. Tout le monde les fait. L'important, c'est de les anticiper et d'avoir un plan B.

Une CEL qui fonctionne bien, c'est 20% de technique et 80% d'humain. Les panneaux et les compteurs, c'est facile. Les relations entre voisins, c'est compliqué.
    `,
    author: "Équipe Kiwatt",
    date: "2026-01-05",
    readTime: 6,
    category: "guide",
  },
  {
    slug: "calculer-economies-cel",
    title: "Combien rapporte vraiment une CEL? Les vrais chiffres.",
    excerpt:
      "On voit beaucoup de promesses d'économies. Voici comment calculer ce que VOTRE projet peut réellement générer, avec des exemples concrets.",
    content: `
## Arrêtons les promesses vagues

"Économisez jusqu'à 30% sur votre facture d'électricité!" Ces slogans, vous les avez vus partout. Mais ça veut dire quoi concrètement?

Je vais vous donner les vraies formules, avec des vrais chiffres, pour que vous puissiez calculer vous-même.

## Les deux sources d'économies

### 1. L'économie sur le timbre (la plus fiable)

Le "timbre", c'est ce que vous payez pour utiliser le réseau électrique. Quand l'énergie reste dans votre CEL, vous utilisez moins le réseau, donc vous payez moins.

**Le calcul:**
\`\`\`
Économie = Énergie partagée × Tarif timbre × Réduction
\`\`\`

**Les variables:**
- **Énergie partagée:** L'énergie produite localement ET consommée localement (pas celle qui repart sur le réseau)
- **Tarif timbre:** Entre 6 et 10 ct/kWh selon votre GRD
- **Réduction:** 40% si même transformateur, 20% sinon

**Exemple réel (GRD: Romande Énergie):**
- Tarif timbre: 8.2 ct/kWh
- CEL de 12 membres, 80 kWc installés
- Production annuelle: 72'000 kWh
- Autoconsommation collective: 55% (soit 39'600 kWh partagés)
- Même transformateur: oui

Économie timbre = 39'600 × 0.082 × 0.40 = **CHF 1'299/an**

### 2. L'économie sur le prix de l'énergie (variable)

Au lieu de payer le prix réseau (disons 27 ct/kWh), les membres paient le prix interne de la CEL (disons 18 ct/kWh).

**Mais attention:** Cette économie dépend de comment vous fixez le prix interne. Si vous le fixez trop bas, les producteurs y perdent. Trop haut, les consommateurs n'y gagnent rien.

**Exemple avec la même CEL:**
- Prix réseau: 27 ct/kWh
- Prix interne CEL: 18 ct/kWh (= coût de production + marge raisonnable)
- Énergie partagée: 39'600 kWh

Économie énergie = 39'600 × (0.27 - 0.18) = **CHF 3'564/an**

### Total brut

Économie timbre + Économie énergie = CHF 1'299 + CHF 3'564 = **CHF 4'863/an**

## Maintenant, les coûts

Parce que oui, gérer une CEL a un coût.

**Coûts fixes annuels:**
- Assurance RC (optionnelle mais recommandée): CHF 200-400
- Comptabilité (si structure juridique): CHF 300-500
- Frais bancaires: CHF 100-200

**Coûts de gestion:**
- Option A: Bénévolat → CHF 0 (mais 8-12h/mois de travail)
- Option B: Logiciel type Kiwatt → CHF 948-1'800/an selon le volume
- Option C: Délégation complète à une régie → CHF 2'000-4'000/an

**Avec l'option B (notre exemple):**
- Frais fixes: ~CHF 500
- Kiwatt: 39'600 kWh × 0.01 = CHF 396 (mais minimum CHF 79/mois = CHF 948/an)
- Total coûts: ~CHF 1'450/an

**Bénéfice net = CHF 4'863 - CHF 1'450 = CHF 3'413/an**

Soit environ CHF 280/an par membre. C'est pas Byzance, mais c'est réel.

## Les facteurs qui changent tout

### Le taux d'autoconsommation

C'est LE chiffre crucial. Plus vous consommez localement ce que vous produisez, plus vous économisez.

- 40% d'autoconsommation: économies modestes
- 60% d'autoconsommation: intéressant
- 75%+ d'autoconsommation: excellent

**Ce qui améliore l'autoconsommation:**
- Mix de profils (familles, retraités, télétravail = consommation répartie dans la journée)
- Batterie collective (mais ça coûte cher)
- Véhicules électriques qui chargent en journée

### Le nombre de membres

Plus vous êtes nombreux, plus les coûts fixes sont dilués. Une CEL de 5 membres paiera les mêmes frais de base qu'une CEL de 20 membres.

### Votre GRD

Les tarifs varient énormément. Vérifiez les vôtres sur le site de votre distributeur avant de faire vos calculs.

## Comment savoir si ça vaut le coup pour VOUS?

Utilisez notre calculateur avec vos propres données. Mais voici une règle empirique:

**Une CEL est généralement rentable si:**
- Vous avez au moins 30-40 kWc de solaire
- Vous avez au moins 8-10 membres actifs
- Votre taux d'autoconsommation prévu dépasse 50%

En dessous de ces seuils, les économies risquent d'être mangées par les coûts de gestion.

## Le mot honnête de la fin

Une CEL, ce n'est pas un investissement financier qui va vous rendre riche. C'est un projet collectif qui génère des économies modestes mais réelles, tout en valorisant votre production locale.

Si vous le faites uniquement pour l'argent, vous risquez d'être déçu. Si vous le faites pour le projet communautaire et la transition énergétique, avec les économies comme bonus, vous serez satisfait.
    `,
    author: "Équipe Kiwatt",
    date: "2025-12-20",
    readTime: 7,
    category: "tutorial",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
