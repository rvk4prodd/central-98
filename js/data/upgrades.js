export const UPGRADES = [
  {
    id: 'cooler',
    name: 'Cooler Duplo Turbo + Pasta Prata',
    shortDesc: 'Reduz o aquecimento da CPU e retarda o acúmulo de poeira no gabinete.',
    basePrice: 380,
    maxLevel: 3,
    priceStep: 280,
    effectLabel: '-25% calor por nível'
  },
  {
    id: 'headset',
    name: 'Headset Telemarketing Anti-Chiado',
    shortDesc: 'Remove ruído da linha e garante +10 de confiança inicial em toda ligação.',
    basePrice: 450,
    maxLevel: 3,
    priceStep: 320,
    effectLabel: '+10 confiança inicial por nível'
  },
  {
    id: 'modem',
    name: 'Modem Fibra Pirata 56k Overclock',
    shortDesc: 'Dobra a velocidade de rastreio do GeoTrace para puxar dados da vítima mais rápido.',
    basePrice: 520,
    maxLevel: 3,
    priceStep: 350,
    effectLabel: '+55% velocidade do GeoTrace por nível'
  },
  {
    id: 'antivirus',
    name: 'Avastão 98 Enterprise Crackeado',
    shortDesc: 'Intercepta ataques de Scambaiters e corta o dano térmico de pop-ups maliciosos.',
    basePrice: 600,
    maxLevel: 3,
    priceStep: 390,
    effectLabel: '40% de bloqueio de vírus por nível'
  },
  {
    id: 'database',
    name: 'Planilha Vazada VIP (Serasão)',
    shortDesc: 'Libera alvos corporativos de alto valor e inicia ligações com 1 fato já revelado.',
    basePrice: 750,
    maxLevel: 2,
    priceStep: 650,
    effectLabel: 'Desbloqueia VIPs + fato inicial'
  },
  {
    id: 'coffee',
    name: 'Cafeteira Industrial 18 Xícaras',
    shortDesc: 'Mantém o operador focado e aumenta a paciência média das vítimas na linha.',
    basePrice: 420,
    maxLevel: 3,
    priceStep: 300,
    effectLabel: '+18% paciência do alvo por nível'
  }
];

export function getUpgradePrice(upgrade, currentLevel) {
  return upgrade.basePrice + currentLevel * upgrade.priceStep;
}
