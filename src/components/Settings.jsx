import React, { useState } from 'react';
import { 
  Building2, 
  DollarSign, 
  Paintbrush, 
  FileText, 
  Save, 
  Upload, 
  Trash2,
  ScrollText
} from 'lucide-react';

const WOOD_COLOR_PRESETS = [
  {
    name: 'Walnut / Nogueira (Padrão)',
    primary: '#7c5332',
    secondary: '#dcb386',
    text: '#2d2016',
    bg: '#faf6f0'
  },
  {
    name: 'Cherry / Cerejeira',
    primary: '#8b3a24',
    secondary: '#e6b39a',
    text: '#361810',
    bg: '#fdfaf8'
  },
  {
    name: 'Charcoal Oak / Carvalho Escuro',
    primary: '#423c37',
    secondary: '#bfae9f',
    text: '#1f1c19',
    bg: '#f8f7f5'
  },
  {
    name: 'Maple / Marfim',
    primary: '#9c7c5d',
    secondary: '#e2d3c1',
    text: '#3b2f23',
    bg: '#fefdfb'
  }
];

export default function Settings({ settings, onSave }) {
  const [activeTab, setActiveTab] = useState('company');
  const [localSettings, setLocalSettings] = useState(JSON.parse(JSON.stringify(settings)));

  const handleCompanyChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value }
    }));
  };

  const handleAppearanceChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value }
    }));
  };

  const handlePresetSelect = (preset) => {
    setLocalSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        primaryColor: preset.primary,
        secondaryColor: preset.secondary,
        textColor: preset.text,
        backgroundColor: preset.bg
      }
    }));
  };

  const handlePricingChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [field]: value }
    }));
  };

  const handleLaborChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        labor: { ...prev.pricing.labor, [field]: value }
      }
    }));
  };

  const handleAdditionalCostChange = (serviceId, field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        services: {
          ...prev.pricing.services,
          [serviceId]: { ...prev.pricing.services[serviceId], [field]: value }
        }
      }
    }));
  };

  const handleServiceValueChange = (serviceId, value) => {
    setLocalSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        services: {
          ...prev.pricing.services,
          [serviceId]: { ...prev.pricing.services[serviceId], value: parseFloat(value) || 0 }
        }
      }
    }));
  };

  const handleTermsChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      terms: { ...prev.terms, [field]: value }
    }));
  };

  const handleDisclaimerChange = (id, field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      disclaimers: prev.disclaimers.map(disc => 
        disc.id === id ? { ...disc, [field]: value } : disc
      )
    }));
  };

  const handleContractDefaultsChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      contractDefaults: { ...prev.contractDefaults, [field]: value }
    }));
  };

  const handleContractPaymentChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      contractDefaults: {
        ...prev.contractDefaults,
        payment: { ...prev.contractDefaults.payment, [field]: value }
      }
    }));
  };

  const handleContractDefaultRateChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      contractDefaults: {
        ...prev.contractDefaults,
        defaultRate: { ...prev.contractDefaults.defaultRate, [field]: value }
      }
    }));
  };

  const handleContractDeadlineChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      contractDefaults: {
        ...prev.contractDefaults,
        deadline: { ...prev.contractDefaults.deadline, [field]: value }
      }
    }));
  };

  // Logo file upload handler
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleCompanyChange('logo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const saved = onSave(localSettings);
    if (saved) {
      alert('Configurações salvas com sucesso!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="settings-panel">
      {/* Navigation tabs */}
      <div className="settings-tabs">
        <button 
          type="button"
          className={`settings-tab-btn ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          <Building2 size={16} style={{ display: 'block', margin: '0 auto 4px' }} />
          Empresa
        </button>
        <button 
          type="button"
          className={`settings-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          <DollarSign size={16} style={{ display: 'block', margin: '0 auto 4px' }} />
          Preços
        </button>
        <button 
          type="button"
          className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <Paintbrush size={16} style={{ display: 'block', margin: '0 auto 4px' }} />
          Aparência
        </button>
        <button 
          type="button"
          className={`settings-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          <FileText size={16} style={{ display: 'block', margin: '0 auto 4px' }} />
          Cláusulas
        </button>
        <button 
          type="button"
          className={`settings-tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          <ScrollText size={16} style={{ display: 'block', margin: '0 auto 4px' }} />
          Contratos
        </button>
      </div>

      {/* Tab 1: Company Details */}
      {activeTab === 'company' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 className="section-title">Dados da Marcenaria</h3>

          <div className="form-group">
            <span className="form-label">Logotipo da Empresa</span>
            <label className="logo-upload-box">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                style={{ display: 'none' }} 
              />
              {localSettings.company.logo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <img 
                    src={localSettings.company.logo} 
                    alt="Logo preview" 
                    className="logo-preview-img"
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--status-expired-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleCompanyChange('logo', '');
                        }}>
                    <Trash2 size={12} /> Remover Logo
                  </span>
                </div>
              ) : (
                <>
                  <Upload size={24} style={{ color: '#8c8279' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Carregar Imagem (Logo)</span>
                  <span style={{ fontSize: '0.75rem', color: '#8c8279' }}>Recomendado: PNG ou JPG com fundo transparente</span>
                </>
              )}
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Nome da Marcenaria</label>
            <input 
              type="text" 
              className="form-input" 
              value={localSettings.company.name}
              onChange={(e) => handleCompanyChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nome do Responsável comercial</label>
            <input 
              type="text" 
              className="form-input" 
              value={localSettings.company.owner}
              onChange={(e) => handleCompanyChange('owner', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CNPJ (Opcional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="00.000.000/0001-00"
                value={localSettings.company.cnpj}
                onChange={(e) => handleCompanyChange('cnpj', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="(11) 99999-9999"
                value={localSettings.company.whatsapp}
                onChange={(e) => handleCompanyChange('whatsapp', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefone Fixo</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="(11) 5555-5555"
                value={localSettings.company.phone}
                onChange={(e) => handleCompanyChange('phone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail de contato</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="contato@empresa.com"
                value={localSettings.company.email}
                onChange={(e) => handleCompanyChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Instagram (@usuario)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="@celso.marcenaria"
                value={localSettings.company.instagram}
                onChange={(e) => handleCompanyChange('instagram', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Site / Portfólio</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="www.celso.com.br"
                value={localSettings.company.website}
                onChange={(e) => handleCompanyChange('website', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Endereço da Oficina / Showroom</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Rua, Número, Bairro, Cidade - UF"
              value={localSettings.company.address}
              onChange={(e) => handleCompanyChange('address', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Pricing Defaults */}
      {activeTab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 className="section-title">Composição de Preços (Padrões)</h3>
          
          <div className="info-box">
            Estes parâmetros definem as bases de cálculo automáticas da estimativa. Você pode alterá-los em orçamentos específicos se necessário.
          </div>

          <div className="form-group">
            <label className="form-label">
              Fator de Composição de Insumos (%)
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#8c8279', fontWeight: 'normal' }}>
                Percentual sobre a matéria-prima para cobrir ferragens, fita de borda, perdas, cola e variações.
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                className="form-input" 
                value={localSettings.pricing.compositionMarkup}
                onChange={(e) => handlePricingChange('compositionMarkup', parseFloat(e.target.value) || 0)}
                style={{ paddingRight: '40px' }}
              />
              <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>%</span>
            </div>
          </div>

          <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <label className="form-label">Mão de Obra Padrão</label>
            <div className="form-row" style={{ marginBottom: '10px' }}>
              <select 
                className="form-input select-unit"
                value={localSettings.pricing.labor.type}
                onChange={(e) => handleLaborChange('type', e.target.value)}
              >
                <option value="percentage">% sobre Base de Materiais</option>
                <option value="fixed">Valor Fixo Comercial</option>
                <option value="unit">Valor por Metro (Linear ou m²)</option>
              </select>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                className="form-input" 
                value={localSettings.pricing.labor.value}
                onChange={(e) => handleLaborChange('value', parseFloat(e.target.value) || 0)}
                style={{ paddingRight: '40px' }}
              />
              <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>
                {localSettings.pricing.labor.type === 'percentage' ? '%' : 'R$'}
              </span>
            </div>
          </div>

          <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <div className="cost-toggle-row">
              <div>
                <label style={{ display: 'block' }}>Faixa de Investimento</label>
                <span style={{ fontSize: '0.75rem', color: '#8c8279' }}>
                  Mostrar margem de variação de segurança (ex: R$ 9.500 a R$ 10.500) em vez de valor único.
                </span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={localSettings.pricing.useRange}
                  onChange={(e) => handlePricingChange('useRange', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {localSettings.pricing.useRange && (
            <div className="form-group" style={{ paddingLeft: '12px', borderLeft: '3px solid var(--secondary-color)' }}>
              <label className="form-label">Margem de Segurança (%)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.pricing.safetyMargin}
                  onChange={(e) => handlePricingChange('safetyMargin', parseFloat(e.target.value) || 0)}
                  style={{ paddingRight: '40px' }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>%</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Sugestão de Desconto Máximo (%)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                className="form-input" 
                value={localSettings.pricing.maxDiscount}
                onChange={(e) => handlePricingChange('maxDiscount', parseFloat(e.target.value) || 0)}
                style={{ paddingRight: '40px' }}
              />
              <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>%</span>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '10px' }}>Serviços Padronizados</h4>
          
          <div className="form-group" style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Frete</span>
            <div className="form-row" style={{ marginBottom: '8px' }}>
              <select 
                className="form-input select-unit"
                value={localSettings.pricing.services?.freight?.type || 'included'}
                onChange={(e) => handleAdditionalCostChange('freight', 'type', e.target.value)}
              >
                <option value="included">Incluso no valor</option>
                <option value="separate">Valor separado</option>
              </select>
            </div>
            {(localSettings.pricing.services?.freight?.type || 'included') === 'separate' && (
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.pricing.services?.freight?.value || 0}
                  onChange={(e) => handleServiceValueChange('freight', e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>R$</span>
              </div>
            )}
          </div>

          <div className="form-group" style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Montagem</span>
            <div className="form-row" style={{ marginBottom: '8px' }}>
              <select 
                className="form-input select-unit"
                value={localSettings.pricing.services?.assembly?.type || 'included'}
                onChange={(e) => handleAdditionalCostChange('assembly', 'type', e.target.value)}
              >
                <option value="included">Inclusa no valor</option>
                <option value="separate">Valor separado</option>
              </select>
            </div>
            {(localSettings.pricing.services?.assembly?.type || 'included') === 'separate' && (
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.pricing.services?.assembly?.value || 0}
                  onChange={(e) => handleServiceValueChange('assembly', e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>R$</span>
              </div>
            )}
          </div>

          <div className="form-group" style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Instalação</span>
            <div className="form-row" style={{ marginBottom: '8px' }}>
              <select 
                className="form-input select-unit"
                value={localSettings.pricing.services?.installation?.type || 'included'}
                onChange={(e) => handleAdditionalCostChange('installation', 'type', e.target.value)}
              >
                <option value="included">Inclusa no valor</option>
                <option value="separate">Valor separado</option>
              </select>
            </div>
            {(localSettings.pricing.services?.installation?.type || 'included') === 'separate' && (
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.pricing.services?.installation?.value || 0}
                  onChange={(e) => handleServiceValueChange('installation', e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>R$</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Appearance and Design */}
      {activeTab === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 className="section-title">Design & Identidade Visual</h3>

          <div className="form-group">
            <label className="form-label">Modelo de PDF Padrão</label>
            <select 
              className="form-input select-unit"
              value={localSettings.appearance.pdfStyle}
              onChange={(e) => handleAppearanceChange('pdfStyle', e.target.value)}
            >
              <option value="moderno">Estilo 3 — Moderno (Cards e destaques)</option>
              <option value="premium">Estilo 2 — Premium (Impacto e cor cheia)</option>
              <option value="minimalista">Estilo 1 — Minimalista (Tipografia clássica)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Paleta de Cores da Marca (Tons de Madeira)</label>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#8c8279', marginBottom: '8px' }}>
              Escolha uma combinação padrão de cores inspiradas em acabamentos de madeira:
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {WOOD_COLOR_PRESETS.map((preset) => {
                const isSelected = localSettings.appearance.primaryColor === preset.primary;
                return (
                  <div 
                    key={preset.name} 
                    className={`added-item-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handlePresetSelect(preset)}
                    style={{ 
                      cursor: 'pointer', 
                      borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-color)',
                      borderWidth: isSelected ? '2px' : '1px',
                      padding: '10px 14px'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{preset.name}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.primary, display: 'inline-block', border: '1px solid #fff' }}></span>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.secondary, display: 'inline-block', border: '1px solid #fff' }}></span>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.bg, display: 'inline-block', border: '1px solid #ddd' }}></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <label className="form-label">Ajuste de Cor Personalizado (Primária)</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={localSettings.appearance.primaryColor}
                onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                style={{ width: '50px', height: '40px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px', cursor: 'pointer' }}
              />
              <input 
                type="text" 
                className="form-input" 
                value={localSettings.appearance.primaryColor}
                onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ajuste de Cor Personalizado (Secundária)</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={localSettings.appearance.secondaryColor}
                onChange={(e) => handleAppearanceChange('secondaryColor', e.target.value)}
                style={{ width: '50px', height: '40px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px', cursor: 'pointer' }}
              />
              <input 
                type="text" 
                className="form-input" 
                value={localSettings.appearance.secondaryColor}
                onChange={(e) => handleAppearanceChange('secondaryColor', e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Terms, Deadlines & Disclaimers */}
      {activeTab === 'terms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 className="section-title">Condições de Venda Padrão</h3>

          <div className="form-group">
            <label className="form-label">Condição de Pagamento Padrão</label>
            <input 
              type="text" 
              className="form-input" 
              value={localSettings.terms.payment}
              onChange={(e) => handleTermsChange('payment', e.target.value)}
              placeholder="ex: 50% na aprovação e 50% na entrega"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prazo de Entrega Padrão</label>
              <input 
                type="number" 
                className="form-input" 
                value={localSettings.terms.daysValue}
                onChange={(e) => handleTermsChange('daysValue', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unidade do Prazo</label>
              <select 
                className="form-input select-unit"
                value={localSettings.terms.daysType}
                onChange={(e) => handleTermsChange('daysType', e.target.value)}
              >
                <option value="uteis">Dias Úteis</option>
                <option value="corridos">Dias Corridos</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Validade Padrão da Proposta (Dias)</label>
            <input 
              type="number" 
              className="form-input" 
              value={localSettings.terms.validityDays}
              onChange={(e) => handleTermsChange('validityDays', parseInt(e.target.value) || 0)}
            />
          </div>

          <h3 className="section-title" style={{ marginTop: '16px' }}>Cláusulas Comerciais (PDF)</h3>
          
          <div className="info-box" style={{ marginBottom: '8px' }}>
            Estes textos de caráter jurídico/técnico são exibidos no rodapé do PDF para deixar claro que a proposta é preliminar. Habilite ou edite os textos abaixo.
          </div>

          {localSettings.disclaimers.map((disc) => (
            <div key={disc.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '8px' }}>
              <div className="cost-toggle-row" style={{ borderBottom: 'none', paddingBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                  {disc.title}
                </span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={disc.active}
                    onChange={(e) => handleDisclaimerChange(disc.id, 'active', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              {disc.active && (
                <textarea 
                  className="form-input" 
                  rows="3"
                  style={{ fontSize: '0.8rem', resize: 'vertical', width: '100%', padding: '8px 12px' }}
                  value={disc.text}
                  onChange={(e) => handleDisclaimerChange(disc.id, 'text', e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Contract Defaults */}
      {activeTab === 'contracts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 className="section-title">Configurações Padrão de Contratos</h3>

          <div className="info-box">
            Estes valores serão usados como padrão ao criar novos contratos. Você pode alterá-los em contratos específicos.
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Pagamento</h4>
            
            <div className="form-group">
              <label className="form-label">Forma de Pagamento Padrão</label>
              <select 
                className="form-input select-unit"
                value={localSettings.contractDefaults?.payment?.paymentType || 'entrada_saldo'}
                onChange={(e) => handleContractPaymentChange('paymentType', e.target.value)}
              >
                <option value="a_vista">À Vista</option>
                <option value="entrada_saldo">Entrada + Saldo</option>
                <option value="parcelado">Parcelado</option>
                <option value="entrada_parcelas">Entrada + Parcelas</option>
              </select>
            </div>

            {localSettings.contractDefaults?.payment?.paymentType !== 'a_vista' && (
              <div className="form-group">
                <label className="form-label">Percentual Padrão de Entrada (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.contractDefaults?.payment?.entryPercentage || 50}
                  onChange={(e) => handleContractPaymentChange('entryPercentage', parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            {(localSettings.contractDefaults?.payment?.paymentType === 'parcelado' || localSettings.contractDefaults?.payment?.paymentType === 'entrada_parcelas') && (
              <div className="form-group">
                <label className="form-label">Número de Parcelas</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.contractDefaults?.payment?.installments || 2}
                  onChange={(e) => handleContractPaymentChange('installments', parseInt(e.target.value) || 1)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Descrição da Forma de Pagamento</label>
              <input 
                type="text" 
                className="form-input" 
                value={localSettings.contractDefaults?.payment?.paymentDescription || '50% na aprovação + 50% na entrega'}
                onChange={(e) => handleContractPaymentChange('paymentDescription', e.target.value)}
                placeholder="ex: 50% na aprovação + 50% na entrega"
              />
            </div>

            {localSettings.contractDefaults?.payment?.paymentType !== 'a_vista' && (
              <div className="form-group">
                <label className="form-label">Condição do Saldo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={localSettings.contractDefaults?.payment?.balanceCondition || 'saldo na entrega dos móveis'}
                  onChange={(e) => handleContractPaymentChange('balanceCondition', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Inadimplência</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Multa Padrão (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.contractDefaults?.defaultRate?.lateFeePercentage || 2}
                  onChange={(e) => handleContractDefaultRateChange('lateFeePercentage', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Juros Padrão (% ao mês)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.contractDefaults?.defaultRate?.monthlyInterest || 1}
                  onChange={(e) => handleContractDefaultRateChange('monthlyInterest', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="cost-toggle-row" style={{ borderBottom: 'none', padding: '0' }}>
              <span style={{ fontSize: '0.85rem' }}>Correção Monetária Padrão</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={localSettings.contractDefaults?.defaultRate?.monetaryCorrection !== false}
                  onChange={(e) => handleContractDefaultRateChange('monetaryCorrection', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Prazos</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prazo Padrão Fabricação (dias)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.contractDefaults?.deadline?.fabricationDays || 30}
                  onChange={(e) => handleContractDeadlineChange('fabricationDays', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prazo Padrão Instalação (dias)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={localSettings.contractDefaults?.deadline?.installationDays || 1}
                  onChange={(e) => handleContractDeadlineChange('installationDays', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="cost-toggle-row" style={{ borderBottom: 'none', padding: '0' }}>
              <span style={{ fontSize: '0.85rem' }}>Apenas Dias Úteis</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={localSettings.contractDefaults?.deadline?.workingDaysOnly !== false}
                  onChange={(e) => handleContractDeadlineChange('workingDaysOnly', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Serviços Padrão</h4>
            
            <div className="form-group">
              <label className="form-label">Frete</label>
              <select 
                className="form-input select-unit"
                value={localSettings.contractDefaults?.services?.freight?.type || 'included'}
                onChange={(e) => handleContractDefaultsChange('freight', e.target.value)}
              >
                <option value="included">Incluso</option>
                <option value="separate">Valor separado</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Montagem</label>
              <select 
                className="form-input select-unit"
                value={localSettings.contractDefaults?.services?.assembly?.type || 'included'}
                onChange={(e) => handleContractDefaultsChange('assembly', e.target.value)}
              >
                <option value="included">Inclusa</option>
                <option value="separate">Valor separado</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Instalação</label>
              <select 
                className="form-input select-unit"
                value={localSettings.contractDefaults?.services?.installation?.type || 'included'}
                onChange={(e) => handleContractDefaultsChange('installation', e.target.value)}
              >
                <option value="included">Inclusa</option>
                <option value="separate">Valor separado</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Destino das Sobras</label>
              <select 
                className="form-input select-unit"
                value={localSettings.contractDefaults?.surplus || 'company'}
                onChange={(e) => handleContractDefaultsChange('surplus', e.target.value)}
              >
                <option value="company">Ficam com a marcenaria</option>
                <option value="client">Entregar ao cliente</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Save Button Sticky Footer */}
      <div style={{ marginTop: '20px', padding: '10px 0', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn btn-primary">
          <Save size={18} /> Salvar Parâmetros
        </button>
      </div>
    </form>
  );
}
