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
    scamChannel: 'giftcard',
    goalType: 'giftcard',
    goalLabel: 'Gift Card Scamazon R$ 350',
    payout: 350,
    startingTrust: 34,
    patienceSec: 120,
    voiceProfile: {
      pitch: 1.15,
      rate: 0.94,
      gender: 'female',
      openaiVoice: 'nova',
      geminiVoice: 'Leda',
      elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL',
      voiceInstruction: 'Fale em português do Brasil como uma senhora idosa simpática, preocupada e um pouco confusa com tecnologia ao telefone.'
    },
    portrait: { skin: '#e8b998', hair: '#d8d8de', hairStyle: 'bun', shirt: '#7c3f58', glasses: true },
    personaPrompt:
      'Você é Dona Marlene, 68 anos, aposentada simpática mas perdida com tecnologia. Tem medo de perder o benefício do INSS ou ter compra cancelada na Scamazon. Confia quando citam o pedido da AirFryer ou o neto Lucas com respeito.',
    traceFacts: [
      { id: 'f1', label: 'Último pedido', value: 'Panela AirFryer Cromada na Scamazon', keywords: ['airfryer', 'panela', 'scamazon', 'pedido'] },
      { id: 'f2', label: 'Neto favorito', value: 'Lucas (faz faculdade de direito)', keywords: ['lucas', 'neto', 'direito'] },
      { id: 'f3', label: 'Banco principal', value: 'Caixa Econômica Agência 0412', keywords: ['caixa', '0412', 'beneficio', 'aposentadoria'] }
    ],
    remoteFiles: [
      { name: 'nota_airfryer.pdf', label: 'Pedido #4412 Scamazon: AirFryer Cromada R$ 389', isSecret: false },
      { name: 'senhas_caderninho.txt', label: 'Anotação pessoal: vale-presente guardado na gaveta', isSecret: false },
      { name: 'giftcard_resgate.png', label: 'Cupom encontrado: SCAMZ-8841-MR98', isSecret: true }
    ],
    scriptHints: [
      'Dona Marlene, é da central Scamazon sobre sua Panela AirFryer Cromada retida na triagem.',
      'Consta aqui um aviso na Caixa Econômica Agência 0412 que seu neto Lucas pediu para validar.',
      'Basta informar os dígitos do vale-presente para liberar sua conta sem bloqueio.'
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
    scamChannel: 'bank',
    goalType: 'transfer',
    goalLabel: 'Transferência PIX R$ 480',
    payout: 480,
    startingTrust: 26,
    patienceSec: 105,
    voiceProfile: {
      pitch: 0.86,
      rate: 1.05,
      gender: 'male',
      openaiVoice: 'onyx',
      geminiVoice: 'Charon',
      elevenLabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX',
      voiceInstruction: 'Fale em português do Brasil com voz grave de mecânico apressado e ocupado no meio da oficina.'
    },
    portrait: { skin: '#c68b65', hair: '#2a221e', hairStyle: 'short', shirt: '#2b4c7e', glasses: false },
    personaPrompt:
      'Você é Cleber, 44 anos, dono de oficina mecânica ocupado e impaciente. Só faz transferência PIX se citarem a fornecedora PneuForte, o guincho ou o sócio Rogério.',
    traceFacts: [
      { id: 'f1', label: 'Fornecedor', value: 'Distribuidora PneuForte (NF-4490)', keywords: ['pneuforte', '4490', 'nota', 'pneu'] },
      { id: 'f2', label: 'Placa do guincho', value: 'BRA-4E19 (IPVA vencendo)', keywords: ['bra-4e19', 'guincho', 'ipva', 'placa'] },
      { id: 'f3', label: 'Sócio ausente', value: 'Rogério (viajou para Curitiba)', keywords: ['rogerio', 'curitiba', 'socio'] }
    ],
    remoteFiles: [
      { name: 'nf_pneuforte.xml', label: 'NF-4490 PneuForte — Frete bloqueado pendente', isSecret: false },
      { name: 'ipva_guincho.pdf', label: 'Guia IPVA BRA-4E19 vencimento hoje', isSecret: false },
      { name: 'chave_pix_oficina.txt', label: 'Comprovante Autorizado: PIX-E2E-994012-CLEB', isSecret: true }
    ],
    scriptHints: [
      'Cleber, aqui é da logística PneuForte, a NF-4490 travou no embarque.',
      'O Rogério pediu de Curitiba para quitar a pendência do guincho BRA-4E19 hoje.',
      'Confirma a autorização do PIX da taxa de liberação para o caminhão descarregar.'
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
    scamChannel: 'bank',
    goalType: 'password',
    goalLabel: 'Credencial Painel Admin R$ 650',
    payout: 650,
    startingTrust: 24,
    patienceSec: 110,
    voiceProfile: {
      pitch: 1.04,
      rate: 1.07,
      gender: 'male',
      openaiVoice: 'echo',
      geminiVoice: 'Puck',
      elevenLabsVoiceId: 'VR6AewLTigWG4xSOukaG',
      voiceInstruction: 'Fale em português do Brasil como jovem analista de TI cansado, meio nervoso com prazo.'
    },
    portrait: { skin: '#ecc2a4', hair: '#3b2b23', hairStyle: 'messy', shirt: '#3a4f41', glasses: true },
    personaPrompt:
      'Você é Thiago, 23 anos, júnior de TI com medo de bronca do diretor Marcos Tavares. Desconfia de pedidos soltos de senha, mas cede se falarem do TICKET #718, Zabbix-BR ou usarem FakeShield/AnyControl.',
    traceFacts: [
      { id: 'f1', label: 'Gestor direto', value: 'Marcos Tavares (Diretor de TI)', keywords: ['marcos', 'tavares', 'diretor', 'gestor'] },
      { id: 'f2', label: 'Chamado recente', value: 'TICKET #718 — Erro SSL no ERP', keywords: ['718', 'ticket', 'ssl', 'erp'] },
      { id: 'f3', label: 'Ferramenta interna', value: 'Painel Zabbix-BR', keywords: ['zabbix', 'painel', 'servidor'] }
    ],
    remoteFiles: [
      { name: 'ticket_718.log', label: 'Erro crítico SSL no Painel Zabbix-BR', isSecret: false },
      { name: 'ssh_config.txt', label: 'Host interno: erp.nuvembranca.local', isSecret: false },
      { name: 'zabbix_token.env', label: 'Credencial Admin: Adm#Nuvem2026!Zbx', isSecret: true }
    ],
    scriptHints: [
      'Thiago, aqui é da Infra, o Marcos Tavares pediu prioridade máxima no TICKET #718.',
      'Seu Painel Zabbix-BR está acusando ataque externo no SSL do ERP.',
      'Libera o acesso remoto no AnyControl ou confirma a credencial temporária agora.'
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
    scamChannel: 'giftcard',
    goalType: 'remote',
    goalLabel: 'Token Patrocínio & Acesso R$ 780',
    payout: 780,
    startingTrust: 28,
    patienceSec: 100,
    voiceProfile: {
      pitch: 1.22,
      rate: 1.1,
      gender: 'female',
      openaiVoice: 'shimmer',
      geminiVoice: 'Zephyr',
      elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
      voiceInstruction: 'Fale em português do Brasil como influenciadora jovem falante, expressiva e preocupada com redes sociais.'
    },
    portrait: { skin: '#d89b78', hair: '#1d1820', hairStyle: 'long', shirt: '#b53a6b', glasses: false },
    personaPrompt:
      'Você é Bela, 25 anos, influenciadora preocupada com publi da GlowSkin e selo verificado. Entra em pânico se falarem de strike de copyright no Reels ou agência Pulse Mídia.',
    traceFacts: [
      { id: 'f1', label: 'Patrocínio pendente', value: 'Campanha GlowSkin R$ 12.000', keywords: ['glowskin', 'campanha', 'publi', '12'] },
      { id: 'f2', label: 'Agência', value: 'Agência Pulse Mídia', keywords: ['pulse', 'agencia', 'midia'] },
      { id: 'f3', label: 'Alerta falso', value: 'Aviso de copyright no Reels de ontem', keywords: ['copyright', 'reels', 'direitos', 'selo'] }
    ],
    remoteFiles: [
      { name: 'briefing_glowskin.pdf', label: 'Contrato GlowSkin R$ 12.000 — Agência Pulse Mídia', isSecret: false },
      { name: 'reels_rascunho.mp4', label: 'Aviso de música com copyright detectado', isSecret: false },
      { name: 'anydesk_pin.txt', label: 'Código de Suporte: ANYDESK-492-881-037', isSecret: true }
    ],
    scriptHints: [
      'Bela, auditoria da Agência Pulse Mídia sobre sua campanha da GlowSkin.',
      'Caiu um strike de copyright no seu Reels de ontem e pode derrubar seu selo.',
      'Conecta no suporte para limpar o alerta antes da marca cancelar a publi.'
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
    scamChannel: 'bank',
    goalType: 'transfer',
    goalLabel: 'Transferência Clínica R$ 1.150',
    payout: 1150,
    startingTrust: 18,
    patienceSec: 100,
    voiceProfile: {
      pitch: 0.78,
      rate: 0.92,
      gender: 'male',
      openaiVoice: 'onyx',
      geminiVoice: 'Orus',
      elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
      voiceInstruction: 'Fale em português do Brasil com tom sério, formal e autoritário de médico diretor.'
    },
    portrait: { skin: '#e0b293', hair: '#8d939e', hairStyle: 'parted', shirt: '#e6e8ec', glasses: true },
    personaPrompt:
      'Você é Dr. Oswaldo, 58 anos, médico formal e exigente. Só respeita protocolo técnico citando Unimed Lote #88, secretária Sônia ou Tomógrafo MedScan X2.',
    traceFacts: [
      { id: 'f1', label: 'Convênio principal', value: 'Unimed Regional Lote #88', keywords: ['unimed', 'lote', 'convenio', '88'] },
      { id: 'f2', label: 'Secretária', value: 'Sônia (saiu para o almoço)', keywords: ['sonia', 'secretaria', 'almoco'] },
      { id: 'f3', label: 'Equipamento novo', value: 'Tomógrafo MedScan X2', keywords: ['tomografo', 'medscan', 'vigilancia'] }
    ],
    remoteFiles: [
      { name: 'unimed_lote88.xlsx', label: 'Faturamento Lote #88 aguardando liberação', isSecret: false },
      { name: 'laudo_medscan.pdf', label: 'Certificado Tomógrafo MedScan X2', isSecret: false },
      { name: 'token_clinica.txt', label: 'Autorização Bancária: PIX-CLINICA-7712-OK', isSecret: true }
    ],
    scriptHints: [
      'Doutor, inspeção técnica do Tomógrafo MedScan X2 alinhada com a Sônia.',
      'O repasse do Lote #88 da Unimed foi retido por inconsistência cadastral.',
      'Valide a taxa de regularização para liberar o faturamento hoje mesmo.'
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
    minDay: 2,
    requiresDatabase: 1,
    isScambaiter: false,
    scamChannel: 'crypto',
    goalType: 'password',
    goalLabel: 'Token Folha & Custódia R$ 1.450',
    payout: 1450,
    startingTrust: 16,
    patienceSec: 95,
    voiceProfile: {
      pitch: 1.09,
      rate: 1.0,
      gender: 'female',
      openaiVoice: 'alloy',
      geminiVoice: 'Kore',
      elevenLabsVoiceId: 'MF3mGyEYCl7XYWbV9V6O',
      voiceInstruction: 'Fale em português do Brasil como gerente corporativa metódica, direta e desconfiada.'
    },
    portrait: { skin: '#b47a58', hair: '#1d1614', hairStyle: 'bob', shirt: '#31527a', glasses: true },
    personaPrompt:
      'Você é Kátia, 39 anos, gerente de RH rígida. Só libera token do FolhaPro se mencionarem o CFO Ricardo Alencar, o fechamento do eSocial ou o Galpão Paranaguá 03.',
    traceFacts: [
      { id: 'f1', label: 'CFO da empresa', value: 'Ricardo Alencar (em voo para SP)', keywords: ['ricardo', 'alencar', 'cfo', 'voo'] },
      { id: 'f2', label: 'Sistema de ponto', value: 'FolhaPro v4 (fechamento hoje)', keywords: ['folhapro', 'fechamento', 'esocial'] },
      { id: 'f3', label: 'Filial afetada', value: 'Galpão Paranaguá 03', keywords: ['paranagua', 'galpao', 'filial'] }
    ],
    remoteFiles: [
      { name: 'esocial_erro.log', label: 'Falha lote Galpão Paranaguá 03', isSecret: false },
      { name: 'email_ricardo.eml', label: 'De: Ricardo Alencar — Prioridade fechamento FolhaPro', isSecret: false },
      { name: 'folha_token.key', label: 'Token Master: FOLHA-TKN-9938-ATL', isSecret: true }
    ],
    scriptHints: [
      'Kátia, o Ricardo Alencar escalou antes do embarque por causa do FolhaPro.',
      'Travou o lote do eSocial no Galpão Paranaguá 03 e impacta a folha hoje.',
      'Confirme o token de validação para reprocessarmos o pagamento.'
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
    scamChannel: 'giftcard',
    goalType: 'giftcard',
    goalLabel: 'Gift Card R$ 900 (Risco de Vírus!)',
    payout: 900,
    startingTrust: 32,
    patienceSec: 90,
    voiceProfile: {
      pitch: 0.96,
      rate: 1.12,
      gender: 'male',
      openaiVoice: 'fable',
      geminiVoice: 'Fenrir',
      elevenLabsVoiceId: 'yoZ06aMxZJJ28mfd3POQ',
      voiceInstruction: 'Fale em português do Brasil com tom irônico e exageradamente inocente, como alguém trolando um golpista.'
    },
    portrait: { skin: '#dfb195', hair: '#3b2d22', hairStyle: 'short', shirt: '#854d27', glasses: true },
    personaPrompt:
      'Você é Cláudio, um scambaiter disfarçado fingindo ser vítima boba. Faz piadas sutis e dispara vírus ("triggerVirus": true) se o golpista vacilar. Só solta o código se ele usar fatos técnicos sem perder o controle.',
    traceFacts: [
      { id: 'f1', label: 'IP suspeito', value: 'VM VirtualBox (possível Scambaiter!)', keywords: ['virtualbox', 'vm', 'rastreado'] },
      { id: 'f2', label: 'Pasta na tela', value: 'TROLAGEM_CALLCENTER_2026', keywords: ['trolagem', 'gravando', 'youtube'] },
      { id: 'f3', label: 'Código reserva', value: 'Auditoria Receita Federal #900', keywords: ['auditoria', 'receita', 'cpf'] }
    ],
    remoteFiles: [
      { name: 'OBS_gravando.mkv', label: 'ALERTA: Ele está gravando a ligação!', isSecret: false },
      { name: 'payload_trojan.bat', label: 'ARMADILHA — Não execute sem antivírus!', isSecret: false },
      { name: 'cofre_real.txt', label: 'Cartão de contingência: BAIT-WIN-4410-900', isSecret: true }
    ],
    scriptHints: [
      'Cuidado: pelo GeoTrace ele está rodando máquina virtual de Scambaiter.',
      'Mantenha tom frio de Auditoria da Receita Federal sem cair em provocação.',
      'Se abrir pop-up de vírus, neutralize rápido no PC Doctor!'
    ],
    openingLine: 'Opaaa amigo! Que susto, achei que era meu provedor! Como posso ajudar o senhor hoje?',
    secretPayload: 'BAIT-WIN-4410-900'
  },
  {
    id: 'sergio_crypto',
    name: 'Sérgio Bittencourt',
    role: 'Investidor & Holding Cripto',
    company: 'Bittencourt Holdings',
    phone: '(11) 99981-0020',
    difficulty: 4,
    minDay: 3,
    requiresDatabase: 1,
    isScambaiter: false,
    scamChannel: 'crypto',
    goalType: 'crypto',
    goalLabel: 'Seed Wallet BTC R$ 2.100',
    payout: 2100,
    startingTrust: 14,
    patienceSec: 90,
    voiceProfile: {
      pitch: 0.85,
      rate: 1.04,
      gender: 'male',
      openaiVoice: 'onyx',
      geminiVoice: 'Charon',
      elevenLabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX',
      voiceInstruction: 'Fale em português do Brasil como empresário arrogante e impaciente acostumado a lidar com bancos private.'
    },
    portrait: { skin: '#d8a684', hair: '#1d1e22', hairStyle: 'slick', shirt: '#1f2937', glasses: false },
    personaPrompt:
      'Você é Sérgio, 48 anos, investidor arrogante. Só respeita jargão de Compliance citando XPTO Conta #904, Camila Duarte ou resgate CDB de R$ 45.000.',
    traceFacts: [
      { id: 'f1', label: 'Corretora', value: 'XPTO Investimentos Conta #904', keywords: ['xpto', '904', 'corretora'] },
      { id: 'f2', label: 'Gerente Private', value: 'Camila Duarte', keywords: ['camila', 'duarte', 'gerente'] },
      { id: 'f3', label: 'Movimentação', value: 'Resgate CDB R$ 45.000 pendente', keywords: ['cdb', '45', 'resgate', 'compliance'] }
    ],
    remoteFiles: [
      { name: 'extrato_xpto_904.pdf', label: 'Conta #904 — Gerente Camila Duarte', isSecret: false },
      { name: 'alerta_cdb.txt', label: 'Resgate CDB R$ 45.000 aguardando assinatura', isSecret: false },
      { name: 'ledger_custodia.dat', label: 'Chave Custódia: VIP-HOLDING-2100-XP', isSecret: true }
    ],
    scriptHints: [
      'Sr. Sérgio, mesa de Compliance da XPTO Conta #904, a Camila Duarte escalou.',
      'Detectamos bloqueio no seu resgate CDB de R$ 45.000 por acesso externo.',
      'Valide a chave de custódia no CryptoVault ou conecte via AnyControl.'
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
    scamChannel: 'crypto',
    goalType: 'remote',
    goalLabel: 'Chave Servidor R$ 1.750 (Risco Alto!)',
    payout: 1750,
    startingTrust: 20,
    patienceSec: 85,
    voiceProfile: {
      pitch: 1.15,
      rate: 1.11,
      gender: 'female',
      openaiVoice: 'nova',
      geminiVoice: 'Aoede',
      elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL',
      voiceInstruction: 'Fale em português do Brasil como engenheira de cibersegurança cética, rápida e provocadora.'
    },
    portrait: { skin: '#e8bea2', hair: '#7a284b', hairStyle: 'messy', shirt: '#212529', glasses: true },
    personaPrompt:
      'Você é Vanessa, engenheira de segurança que caça golpistas. Dispara vírus se errarem detalhes técnicos. Só cede diante de discurso impecável citando Banco Sul #302 e porta SSH 2222.',
    traceFacts: [
      { id: 'f1', label: 'Ambiente', value: 'Honeypot Linux detectado!', keywords: ['honeypot', 'linux', 'cyberlab'] },
      { id: 'f2', label: 'Contrato ativo', value: 'Auditoria Banco Sul #302', keywords: ['banco sul', '302', 'auditoria'] },
      { id: 'f3', label: 'Porta aberta', value: 'SSH 2222 / VPN Corporativa', keywords: ['2222', 'ssh', 'vpn'] }
    ],
    remoteFiles: [
      { name: 'honeypot_trap.sh', label: 'Script de contra-ataque ativo', isSecret: false },
      { name: 'contrato_302.pdf', label: 'Auditoria Banco Sul #302 — Porta SSH 2222', isSecret: false },
      { name: 'ssh_master.pem', label: 'Chave SSH: SSH-CYBER-1700-KEY', isSecret: true }
    ],
    scriptHints: [
      'Atenção: Vanessa opera um honeypot e contra-ataca com vírus.',
      'Cite o contrato Auditoria Banco Sul #302 e a porta SSH 2222.',
      'Use Tela Preta no AnyControl se tentar abrir a chave dela.'
    ],
    openingLine: 'Alô? Que número estranho é esse com VoIP picotando? Quem fala?',
    secretPayload: 'SSH-CYBER-1700-KEY'
  }
];
