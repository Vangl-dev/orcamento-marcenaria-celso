/**
 * LocalStorage wrapper for persistence of estimates and configuration settings.
 */

const STORAGE_KEYS = {
  SETTINGS: 'celso_marcenaria_settings',
  ESTIMATES: 'celso_marcenaria_estimates'
};

const DEFAULT_SETTINGS = {
  company: {
    name: 'Celso Marcenaria',
    owner: 'Celso',
    cnpj: '',
    phone: '(11) 98915-6503',
    whatsapp: '(11) 98915-6503',
    email: '',
    instagram: '',
    website: '',
    address: '',
    logo: '' // Base64 representation of logo image
  },
  appearance: {
    pdfStyle: 'moderno', // 'minimalista' | 'premium' | 'moderno'
    primaryColor: '#7c5332', // Wood brown
    secondaryColor: '#dcb386', // Oak tan
    textColor: '#2d2016', // Deep walnut
    backgroundColor: '#faf6f0' // Warm cream
  },
  pricing: {
    compositionMarkup: 120, // 120% factor
    labor: {
      type: 'percentage', // 'percentage' | 'fixed' | 'unit'
      value: 100 // 100% markup
    },
    useRange: true,
    safetyMargin: 5, // 5% range
    maxDiscount: 10, // 10% max suggested discount
    additionalCosts: [
      { id: 'frete', name: 'Frete', type: 'fixed', value: 300 },
      { id: 'montagem', name: 'Montagem', type: 'included', value: 0 },
      { id: 'instalacao', name: 'Instalação', type: 'included', value: 0 }
    ]
  },
  terms: {
    payment: '50% na aprovação + 50% na entrega',
    daysType: 'uteis', // 'uteis' | 'corridos'
    daysValue: 30, // 30 days
    validityDays: 10 // 10 days validity
  },
  disclaimers: [
    { id: 'natureza', title: 'Natureza da Estimativa', text: 'Esta proposta possui caráter exclusivamente estimativo e foi elaborada com base nas informações e dimensões aproximadas obtidas durante a visita inicial.', active: true },
    { id: 'projeto', title: 'Projeto Definitivo', text: 'O valor definitivo poderá sofrer alteração após o desenvolvimento do projeto, definição dos materiais, ferragens, acessórios, medidas finais e elaboração do plano de corte.', active: true },
    { id: 'aprovacao', title: 'Aprovação Necessária', text: 'A execução somente será iniciada após a aprovação do projeto definitivo e do respectivo orçamento.', active: true },
    { id: 'prazo', title: 'Início do Prazo', text: 'O prazo informado é estimado e terá início após a aprovação do projeto definitivo e o cumprimento das condições de pagamento estabelecidas.', active: true },
    { id: 'medidas', title: 'Medições Técnicas', text: 'As medidas apresentadas nesta estimativa são aproximadas e não substituem a medição técnica necessária para a elaboração do projeto executivo.', active: true },
    { id: 'alteracoes', title: 'Alterações de Escopo', text: 'Alterações de escopo, materiais, dimensões, ferragens, acessórios ou especificações poderão resultar em alteração do valor final.', active: true },
    { id: 'validade', title: 'Validade da Proposta', text: 'Esta estimativa possui validade pelo período indicado e poderá ser revista após o término de sua validade.', active: true }
  ]
};

// Seed estimates if none exist, so the user can see sample data
const DEFAULT_ESTIMATES = [
  {
    id: 'EST-2026-0001',
    date: '2026-08-25',
    status: 'aprovada', // 'rascunho' | 'enviada' | 'aprovada' | 'expirada'
    client: {
      name: 'João da Silva',
      whatsapp: '11999999999',
      email: 'joao@email.com',
      address: 'Rua das Flores, 123'
    },
    items: [
      { id: 'item-1', description: 'Cozinha Planejada', quantity: 5.2, unit: 'm', baseValue: 1000 },
      { id: 'item-2', description: 'Painel de TV', quantity: 3.0, unit: 'm', baseValue: 800 }
    ],
    compositionMarkup: 120,
    labor: { type: 'percentage', value: 100 },
    additionalCosts: [
      { id: 'frete', name: 'Frete', type: 'fixed', value: 300 },
      { id: 'montagem', name: 'Montagem', type: 'included', value: 0 },
      { id: 'instalacao', name: 'Instalação', type: 'included', value: 0 }
    ],
    discount: { type: 'percentage', value: 0 },
    useRange: true,
    safetyMargin: 5,
    terms: {
      payment: '50% na aprovação e 50% na entrega',
      daysType: 'uteis',
      daysValue: 30,
      validityDays: 10
    },
    notes: 'Estimativa realizada considerando MDF padrão e medidas aproximadas informadas durante a visita.'
  },
  {
    id: 'EST-2026-0002',
    date: '2026-08-24',
    status: 'rascunho',
    client: {
      name: 'Maria Rodrigues',
      whatsapp: '11988888888',
      email: 'maria@email.com',
      address: 'Av. Paulista, 456'
    },
    items: [
      { id: 'item-3', description: 'Guarda-roupa Suíte', quantity: 4.0, unit: 'm', baseValue: 1200 }
    ],
    compositionMarkup: 120,
    labor: { type: 'percentage', value: 100 },
    additionalCosts: [
      { id: 'frete', name: 'Frete', type: 'fixed', value: 300 },
      { id: 'montagem', name: 'Montagem', type: 'included', value: 0 },
      { id: 'instalacao', name: 'Instalação', type: 'included', value: 0 }
    ],
    discount: { type: 'fixed', value: 500 },
    useRange: false,
    safetyMargin: 5,
    terms: {
      payment: 'À vista com 5% de desconto',
      daysType: 'uteis',
      daysValue: 20,
      validityDays: 5
    },
    notes: ''
  }
];

export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const settings = JSON.parse(raw);
    // Deep merge to ensure new settings keys are always present
    return {
      company: { ...DEFAULT_SETTINGS.company, ...settings.company },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...settings.appearance },
      pricing: { ...DEFAULT_SETTINGS.pricing, ...settings.pricing },
      terms: { ...DEFAULT_SETTINGS.terms, ...settings.terms },
      disclaimers: settings.disclaimers || DEFAULT_SETTINGS.disclaimers
    };
  } catch (e) {
    console.error('Error reading settings', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Error saving settings', e);
    return false;
  }
}

export function getEstimates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ESTIMATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(DEFAULT_ESTIMATES));
      return DEFAULT_ESTIMATES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading estimates', e);
    return [];
  }
}

export function saveEstimates(estimates) {
  try {
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(estimates));
    return true;
  } catch (e) {
    console.error('Error saving estimates', e);
    return false;
  }
}

export function generateNextEstimateId(estimates) {
  const currentYear = new Date().getFullYear();
  const pattern = new RegExp(`^EST-${currentYear}-(\\d{4})$`);
  
  let maxNum = 0;
  estimates.forEach(est => {
    const match = est.id.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = String(maxNum + 1).padStart(4, '0');
  return `EST-${currentYear}-${nextNum}`;
}
