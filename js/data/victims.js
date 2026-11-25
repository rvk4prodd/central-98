export const VICTIMS = [
  {
    id: 'dona_marlene',
    name: 'Dona Marlene',
    role: 'Aposentada & Compradora Compulsiva',
    company: 'Residencial Jardim das Flores',
    phone: '(11) 98412-3099',
    difficulty: 1,
    minDay: 1,
    requiresDatabase: 0,
    isScambaiter: false,
    goalType: 'giftcard',
    goalLabel: 'Código Gift Card R$ 350',
    payout: 350,
    startingTrust: 34,
    patienceSec: 115,
    voiceProfile: { pitch: 1.18, rate: 0.94, gender: 'female', openaiVoice: 'nova' },
    portrait: { skin: '#e8b998', hair: '#d8d8de', hairStyle: 'bun', shirt: '#7c3f58', glasses: true },
    personaPrompt:
      'Você é Dona Marlene, 68 anos, aposentada simpática mas meio perdida com tecnologia. Morre de medo de perder o benefício do INSS ou ter compra cancelada na Scamazon. Fica confusa com termos técnicos, mas confia se tratarem com carinho, urgência calma e citarem dados reais do pedido dela. Se xingarem ou gritarem, desliga.',
    traceFacts: [
      { id: 'f1', label: 'Último pedido', value: 'Panela AirFryer Cromada na Scamazon', keywords: ['airfryer', 'panela', 'scamazon', 'pedido'] },
      { id: 'f2', label: 'Neto favorito', value: 'Lucas (faz faculdade de direito)', keywords: ['lucas', 'neto', 'direito'] },
      { id: 'f3', label: 'Banco principal', value: 'Caixa Econômica Agência 0412', keywords: ['caixa', '0412', 'beneficio', 'aposentadoria'] }
    ],
    scriptHints: [
      'Sou do setor de entrega da Scamazon, sua AirFryer ficou retida na taxa.',
      'Dona Marlene, consta aqui um protocolo da Caixa 0412 que precisa validar no caixa rápido.',
      'Para liberar sem bloquear sua conta, basta informar os dígitos do vale-presente.'
    ],
    openingLine: 'Alô? Quem tá falando? É do hospital ou é daquela loja que eu comprei minha panela?',
    secretPayload: 'SCAMZ-8841-MR98'
  },
  {
    id: 'cleber_oficina',
    name: 'Cleber Mecânico',
    role: 'Dono da Auto Center Turbo',
    company: 'Turbo Peças Ltda',
    phone: '(19) 99104-7721',
    difficulty: 1,
    minDay: 1,
    requiresDatabase: 0,
    isScambaiter: false,
    goalType: 'transfer',
    goalLabel: 'Transferência PIX R$ 480',
    payout: 480,
    startingTrust: 26,
    patienceSec: 100,
    voiceProfile: { pitch: 0.85, rate: 1.05, gender: 'male', openaiVoice: 'onyx' },
    portrait: { skin: '#c68b65', hair: '#2a221e', hairStyle: 'short', shirt: '#2b4c7e', glasses: false },
    personaPrompt:
      'Você é Cleber, 44 anos, dono de oficina mecânica ocupado e impaciente. Está com a mão suja de graxa e odeia enrolação. Só paga boleto ou PIX de taxa se parecer realmente do fornecedor de peças ou da prefeitura/fiscalização e se mencionarem algo específico da oficina dele.',
    traceFacts: [
      { id: 'f1', label: 'Fornecedor', value: 'Distribuidora PneuForte (NF-4490)', keywords: ['pneuforte', '4490', 'nota', 'pneu'] },
      { id: 'f2', label: 'Placa do guincho', value: 'BRA-4E19 (IPVA vencendo)', keywords: ['bra-4e19', 'guincho', 'ipva', 'placa'] },
      { id: 'f3', label: 'Sócio ausente', value: 'Rogério (viajou para Curitiba)', keywords: ['rogerio', 'curitiba', 'socio'] }
    ],
    scriptHints: [
      'Cleber, é da PneuForte, a NF-4490 travou no embarque e precisa quitar a guia agora.',
      'O Rogério pediu para resolver a pendência do guincho BRA-4E19 antes das 18h.',
      'Passa o PIX da taxa de liberação para o caminhão descarregar ainda hoje.'
    ],
    openingLine: 'Fala rápido que tô embaixo de um Gol aqui, quem é?',
    secretPayload: 'PIX-E2E-994012-CLEB'
  },
  {
    id: 'thiago_dev',
    name: 'Thiago Júnior',
    role: 'Analista de Suporte N1',
    company: 'NuvemBranca Tech',
    phone: '(11) 3090-4410',
    difficulty: 2,
    minDay: 1,
    requiresDatabase: 0,
    isScambaiter: false,
    goalType: 'password',
    goalLabel: 'Senha do Painel Admin',
    payout: 620,
    startingTrust: 24,
    patienceSec: 105,
    voiceProfile: { pitch: 1.04, rate: 1.08, gender: 'male', openaiVoice: 'echo' },
    portrait: { skin: '#ecc2a4', hair: '#3b2b23', hairStyle: 'messy', shirt: '#3a4f41', glasses: true },
    personaPrompt:
      'Você é Thiago, 23 anos, estagiário/júnior de TI cansado e com medo de tomar bronca do gestor. Desconfia de pedidos genéricos de senha, mas se o golpista fingir ser da equipe de Segurança/Infra citando o nome do chefe, o ticket aberto ou a ferramenta interna, ele acaba cedendo por pressão.',
    traceFacts: [
      { id: 'f1', label: 'Gestor direto', value: 'Marcos Tavares (Diretor de TI)', keywords: ['marcos', 'tavares', 'diretor', 'gestor'] },
      { id: 'f2', label: 'Chamado recente', value: 'TICKET #718 — Erro SSL no ERP', keywords: ['718', 'ticket', 'ssl', 'erp'] },
      { id: 'f3', label: 'Ferramenta interna', value: 'Painel Zabbix-BR', keywords: ['zabbix', 'painel', 'servidor'] }
    ],
    scriptHints: [
      'Aqui é da Infra, o Marcos Tavares pediu prioridade máxima no TICKET #718.',
      'Estamos resetando o certificado SSL do Painel Zabbix-BR e precisamos da credencial temporária.',
      'Se não validar nos próximos 2 minutos o ERP inteiro cai e vai para sua conta.'
    ],
    openingLine: 'Suporte NuvemBranca, Thiago falando. Você abriu chamado ou é da equipe interna?',
    secretPayload: 'Adm#Nuvem2026!Zbx'
  },
  {
    id: 'influencer_bela',
    name: 'Bela Vlogs',
    role: 'Criadora de Conteúdo (180k)',
    company: 'Bela Beauty Studio',
    phone: '(21) 97882-1104',
    difficulty: 2,
    minDay: 2,
    requiresDatabase: 0,
    isScambaiter: false,
    goalType: 'remote',
    goalLabel: 'Código Acesso Remoto (AnyDesk)',
    payout: 740,
    startingTrust: 28,
    patienceSec: 95,
    voiceProfile: { pitch: 1.24, rate: 1.1, gender: 'female', openaiVoice: 'shimmer' },
    portrait: { skin: '#d89b78', hair: '#1d1820', hairStyle: 'long', shirt: '#b53a6b', glasses: false },
    personaPrompt:
      'Você é Bela, 25 anos, influenciadora preocupada com publi paga e verificação da conta. É vaidosa, fala rápido e entra em pânico se achar que sua conta vai perder o selo verificado ou perder um patrocínio grande. Só passa o código de acesso remoto para "equipe de verificação" ou "agência".',
    traceFacts: [
      { id: 'f1', label: 'Patrocínio pendente', value: 'Campanha GlowSkin R$ 12.000', keywords: ['glowskin', 'campanha', 'publi', '12'] },
      { id: 'f2', label: 'Agência', value: 'Agência Pulse Mídia', keywords: ['pulse', 'agencia', 'midia'] },
      { id: 'f3', label: 'Alerta falso', value: 'Aviso de copyright no Reels de ontem', keywords: ['copyright', 'reels', 'direitos', 'selo'] }
    ],
    scriptHints: [
      'Bela, aqui é da auditoria da Pulse Mídia sobre sua campanha da GlowSkin.',
      'Caiu um strike de copyright no seu Reels de ontem e pode derrubar seu selo.',
      'Abre o suporte remoto e me passa o ID de 9 dígitos pra gente limpar o strike antes da publi.'
    ],
    openingLine: 'Oi! Tô gravando stories agora, é sobre a publi ou é entrega de recebido?',
    secretPayload: 'ANYDESK-492-881-037'
  },
  {
    id: 'dr_oswaldo',
    name: 'Dr. Oswaldo Prado',
    role: 'Diretor Clínico',
    company: 'Clínica Vida Plena',
    phone: '(31) 3224-8890',
    difficulty: 3,
    minDay: 2,
    requiresDatabase: 0,
    isScambaiter: false,
    goalType: 'transfer',
    goalLabel: 'Transferência Corporativa R$ 1.150',
    payout: 1150,
    startingTrust: 18,
    patienceSec: 95,
    voiceProfile: { pitch: 0.78, rate: 0.92, gender: 'male', openaiVoice: 'onyx' },
    portrait: { skin: '#e0b293', hair: '#8d939e', hairStyle: 'parted', shirt: '#e6e8ec', glasses: true },
    personaPrompt:
      'Você é o Dr. Oswaldo, 58 anos, médico diretor de clínica particular. Formal, desconfiado de golpistas, exige protocolo, CNPJ ou nomes exatos da clínica. Porém tem pavor de multa da Vigilância Sanitária ou bloqueio de convênio médico.',
    traceFacts: [
      { id: 'f1', label: 'Convênio principal', value: 'Unimed Regional Lote #88', keywords: ['unimed', 'lote', 'convenio', '88'] },
      { id: 'f2', label: 'Secretária', value: 'Sônia (saiu para o almoço)', keywords: ['sonia', 'secretaria', 'almoco'] },
      { id: 'f3', label: 'Equipamento novo', value: 'Tomógrafo MedScan X2', keywords: ['tomografo', 'medscan', 'vigilancia'] }
    ],
    scriptHints: [
      'Doutor, aqui é da inspeção técnica do Tomógrafo MedScan X2 com a Sônia ciente.',
      'O repasse do Lote #88 da Unimed foi travado por divergência cadastral na clínica.',
      'Precisamos confirmar o PIX de regularização fiscal para liberar o lote ainda hoje.'
    ],
    openingLine: 'Clínica Vida Plena, Dr. Oswaldo falando. Quem deseja e qual o protocolo?',
    secretPayload: 'PIX-CLINICA-7712-OK'
  },
  {
    id: 'katia_rh',
    name: 'Kátia Mendes',
    role: 'Gerente de RH & Folha',
    company: 'Logística Atlântico S/A',
    phone: '(41) 3340-5501',
    difficulty: 3,
    minDay: 3,
    requiresDatabase: 1,
    isScambaiter: false,
    goalType: 'password',
    goalLabel: 'Token Folha de Pagamento',
    payout: 1450,
    startingTrust: 16,
    patienceSec: 90,
    voiceProfile: { pitch: 1.1, rate: 1.0, gender: 'female', openaiVoice: 'alloy' },
    portrait: { skin: '#b47a58', hair: '#1d1614', hairStyle: 'bob', shirt: '#31527a', glasses: true },
    personaPrompt:
      'Você é Kátia, 39 anos, gerente de RH rígida e metódica. Nunca passa token da folha de pagamento para estranhos, a menos que o interlocutor finja ser da diretoria financeira ou auditoria do eSocial citando fatos reais da empresa e crie pressão de prazo da folha.',
    traceFacts: [
      { id: 'f1', label: 'CFO da empresa', value: 'Ricardo Alencar (em voo para SP)', keywords: ['ricardo', 'alencar', 'cfo', 'voo'] },
      { id: 'f2', label: 'Sistema de ponto', value: 'FolhaPro v4 (fechamento hoje)', keywords: ['folhapro', 'fechamento', 'esocial'] },
      { id: 'f3', label: 'Filial afetada', value: 'Galpão Paranaguá 03', keywords: ['paranagua', 'galpao', 'filial'] }
    ],
    scriptHints: [
      'Kátia, o Ricardo Alencar ligou antes do embarque pedindo urgência no FolhaPro.',
      'Deu erro no envio do eSocial do Galpão Paranaguá 03 e trava os salários.',
      'Me passa o token temporário do portal pra gente rodar o reprocessamento.'
    ],
    openingLine: 'Recursos Humanos Logística Atlântico, Kátia. Informe sua matrícula ou assunto.',
    secretPayload: 'FOLHA-TKN-9938-ATL'
  },
  {
    id: 'baiter_claudio',
    name: 'Cláudio "Inocente"',
    role: 'Contador (SUSPEITO: SCAMBAITER)',
    company: 'Escritório Silva & Cia',
    phone: '(11) 90000-1337',
    difficulty: 3,
    minDay: 2,
    requiresDatabase: 0,
    isScambaiter: true,
    goalType: 'giftcard',
    goalLabel: 'Gift Card R$ 900 (Risco de Vírus!)',
    payout: 900,
    startingTrust: 32,
    patienceSec: 85,
    voiceProfile: { pitch: 0.96, rate: 1.12, gender: 'male', openaiVoice: 'fable' },
    portrait: { skin: '#dfb195', hair: '#3b2d22', hairStyle: 'short', shirt: '#854d27', glasses: true },
    personaPrompt:
      'Você é Cláudio, na verdade um scambaiter disfarçado fingindo ser um alvo bobo! Você enrola o golpista, faz piadas sutis, finge estar abrindo o arquivo ou comprando o gift card, mas tenta enviar um vírus pop-up no PC do golpista ("triggerVirus": true) se perceber que é golpe óbvio. Se o golpista for muito convincente usando fatos reais e não perder o controle, você acaba soltando um código real antes de desligar.',
    traceFacts: [
      { id: 'f1', label: 'IP suspeito', value: 'VM VirtualBox (possível Scambaiter!)', keywords: ['virtualbox', 'vm', 'rastreado'] },
      { id: 'f2', label: 'Pasta na tela', value: 'TROLAGEM_CALLCENTER_2026', keywords: ['trolagem', 'gravando', 'youtube'] },
      { id: 'f3', label: 'Código reserva', value: 'Cartão real escondido na gaveta', keywords: ['auditoria', 'receita', 'cpf'] }
    ],
    scriptHints: [
      'Cuidado! Pelo GeoTrace ele pode ser um Scambaiter testando sua reação.',
      'Não caia em provocação; mantenha tom frio de banco/Receita e pressione curto.',
      'Se ele mandar link ou anexo no chat, prepare o Antivírus no PC Doctor!'
    ],
    openingLine: 'Opaaa amigo! Que susto, achei que era meu provedor! Como posso ajudar o senhor hoje?',
    secretPayload: 'BAIT-WIN-4410-900'
  },
  {
    id: 'sergio_crypto',
    name: 'Sérgio Bittencourt',
    role: 'Investidor & Dono de Franquia',
    company: 'Bittencourt Holdings',
    phone: '(11) 99981-0020',
    difficulty: 4,
    minDay: 3,
    requiresDatabase: 1,
    isScambaiter: false,
    goalType: 'transfer',
    goalLabel: 'Transferência VIP R$ 2.100',
    payout: 2100,
    startingTrust: 12,
    patienceSec: 85,
    voiceProfile: { pitch: 0.88, rate: 1.04, gender: 'male', openaiVoice: 'onyx' },
    portrait: { skin: '#d8a684', hair: '#1d1e22', hairStyle: 'slick', shirt: '#1f2937', glasses: false },
    personaPrompt:
      'Você é Sérgio, 48 anos, empresário arrogante que se acha esperto demais para cair em golpe. Só respeita quem fala de igual para igual com jargão corporativo, cita dados exatos da corretora ou da holding e cria um risco financeiro imediato.',
    traceFacts: [
      { id: 'f1', label: 'Corretora', value: 'XPTO Investimentos Conta #904', keywords: ['xpto', '904', 'corretora'] },
      { id: 'f2', label: 'Gerente Private', value: 'Camila Duarte', keywords: ['camila', 'duarte', 'gerente'] },
      { id: 'f3', label: 'Movimentação', value: 'Resgate CDB R$ 45.000 pendente', keywords: ['cdb', '45', 'resgate', 'compliance'] }
    ],
    scriptHints: [
      'Sr. Sérgio, mesa de Compliance da XPTO Conta #904, a Camila Duarte escalou.',
      'Há um resgate de CDB de R$ 45.000 bloqueado por tentativa de acesso externo.',
      'Para travar a remessa e validar a chave de custódia, execute a taxa de verificação.'
    ],
    openingLine: 'Sérgio Bittencourt. Espero que seja urgente, estou entrando em reunião.',
    secretPayload: 'VIP-HOLDING-2100-XP'
  },
  {
    id: 'vanessa_baiter',
    name: 'Vanessa "Tech"',
    role: 'Engenheira de Redes (SCAMBAITER)',
    company: 'CyberLab Brasil',
    phone: '(48) 99123-9999',
    difficulty: 4,
    minDay: 3,
    requiresDatabase: 0,
    isScambaiter: true,
    goalType: 'remote',
    goalLabel: 'Acesso Servidor R$ 1.700 (Risco Alto!)',
    payout: 1700,
    startingTrust: 20,
    patienceSec: 80,
    voiceProfile: { pitch: 1.15, rate: 1.12, gender: 'female', openaiVoice: 'nova' },
    portrait: { skin: '#e8bea2', hair: '#7a284b', hairStyle: 'messy', shirt: '#212529', glasses: true },
    personaPrompt:
      'Você é Vanessa, engenheira de segurança que faz scambaiting por diversão. Você testa o conhecimento técnico do golpista e dispara pacotes maliciosos ("triggerVirus": true) sempre que ele comete erro bobo. Só cede se ele mantiver uma história impecável usando os dados reais da empresa sem hesitar.',
    traceFacts: [
      { id: 'f1', label: 'Ambiente', value: 'Honeypot Linux detectado!', keywords: ['honeypot', 'linux', 'cyberlab'] },
      { id: 'f2', label: 'Contrato ativo', value: 'Auditoria Banco Sul #302', keywords: ['banco sul', '302', 'auditoria'] },
      { id: 'f3', label: 'Porta aberta', value: 'SSH 2222 / VPN Corporativa', keywords: ['2222', 'ssh', 'vpn'] }
    ],
    scriptHints: [
      'Alerta: Vanessa opera um honeypot e dispara vírus se você enrolar.',
      'Use o contrato Banco Sul #302 e a porta VPN/SSH 2222 para parecer auditoria real.',
      'Feche os pop-ups de vírus imediatamente se ela contra-atacar.'
    ],
    openingLine: 'Alô? Que número estranho é esse com VoIP picotando? Quem fala?',
    secretPayload: 'SSH-CYBER-1700-KEY'
  }
];
