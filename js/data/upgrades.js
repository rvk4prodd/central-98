export const UPGRADES = [
  {
    id: 'cooler',
    name: 'Water Cooler RGB 240mm',
    shortDesc: 'Mantém a CPU gelada sob carga pesada e reduz o acúmulo de poeira.',
    basePrice: 380,
    maxLevel: 3,
    priceStep: 300,
    effectLabel: '-25% aquecimento por nível'
  },
  {
    id: 'headset',
    name: 'Headset Studio Anti-Ruído',
    shortDesc: 'Áudio cristalino na chamada; garante +10 de confiança inicial.',
    basePrice: 440,
    maxLevel: 3,
    priceStep: 320,
    effectLabel: '+10 confiança inicial por nível'
  },
  {
    id: 'modem',
    name: 'Fibra Pirata 1 Gbps',
    shortDesc: 'Acelera o rastreio do GeoTrace e estabiliza a conexão do AnyControl.',
    basePrice: 520,
    maxLevel: 3,
    priceStep: 360,
    effectLabel: '+55% velocidade GeoTrace por nível'
  },
  {
    id: 'antivirus',
    name: 'Avastão 11 Pro Crackeado',
    shortDesc: 'Bloqueia contra-ataques de Scambaiters e reduz dano de vírus.',
    basePrice: 600,
    maxLevel: 3,
    priceStep: 390,
    effectLabel: '+35% bloqueio de vírus por nível'
  },
  {
    id: 'database',
    name: 'Planilha Vazada VIP (Serasão)',
    shortDesc: 'Libera alvos corporativos de alto valor e inicia com 1 fato revelado.',
    basePrice: 750,
    maxLevel: 2,
    priceStep: 680,
    effectLabel: 'Desbloqueia VIPs + 1º fato livre'
  },
  {
    id: 'coffee',
    name: 'Cafeteira Expresso Industrial',
    shortDesc: 'Aumenta a paciência das vítimas na linha com atendimento ágil.',
    basePrice: 420,
    maxLevel: 3,
    priceStep: 300,
    effectLabel: '+18% paciência do alvo por nível'
  },
  {
    id: 'vpn',
    name: 'VPN Camaleão Anti-Batida',
    shortDesc: 'Reduz o calor policial por golpe e dá tempo extra para abrir o Excel.',
    basePrice: 680,
    maxLevel: 3,
    priceStep: 420,
    effectLabel: '-22% calor policial + 5s na batida'
  },
  {
    id: 'aiScripts',
    name: 'Teleprompter IA Em Tempo Real',
    shortDesc: 'Sugestões mais persuasivas: bônus extra de confiança ao citar fatos.',
    basePrice: 560,
    maxLevel: 3,
    priceStep: 380,
    effectLabel: '+6 confiança ao usar fatos/scripts'
  }
];

export function getUpgradePrice(upgrade, currentLevel) {
  return upgrade.basePrice + currentLevel * upgrade.priceStep;
}
