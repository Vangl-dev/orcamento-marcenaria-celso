import React, { useRef, useState } from 'react';
import { 
  Download, 
  Share2, 
  MessageCircle, 
  ChevronLeft, 
  FileText,
  Copy,
  Check
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { formatCurrency, calculateEstimate } from '../utils/calculator';

export default function PdfProposal({ estimate, settings, onBack }) {
  const pdfRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  
  const calculated = calculateEstimate(estimate, settings);
  const appearance = settings.appearance || {};
  const company = settings.company || {};
  const companyWhatsapp = company.whatsapp || '(11) 98915-6503';
  const terms = estimate.terms || settings.terms || {};

  // Formata a data de validade
  const getValidityDate = () => {
    const creationDate = new Date(estimate.date + 'T12:00:00'); // Evita timezone offset shift
    const days = parseInt(terms.validityDays) || 10;
    creationDate.setDate(creationDate.getDate() + days);
    
    return creationDate.toLocaleDateString('pt-BR');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  // Calcula o valor a ser exibido por item (distribuído proporcionalmente)
  const getItemDisplayValue = (item) => {
    const rawItemValue = (parseFloat(item.quantity) || 0) * (parseFloat(item.baseValue) || 0);
    if (calculated.rawMaterialSum === 0) return 0;
    
    // Proporção do item em relação ao total
    const proportion = rawItemValue / calculated.rawMaterialSum;
    
    // Distribui o investimento total proporcionalmente
    return proportion * calculated.totalInvestment;
  };

  // WhatsApp text template
  const getWhatsAppMessage = () => {
    const priceText = calculated.useRange
      ? `${formatCurrency(calculated.range.min)} a ${formatCurrency(calculated.range.max)}`
      : `${formatCurrency(calculated.totalInvestment)}`;
      
    const text = `Olá ${estimate.client.name}! Segue a Estimativa Comercial preliminar de investimento para o seu projeto da *${company.name || 'nossa marcenaria'}*.\n\n*Nº Proposta:* ${estimate.id}\n*Valor Estimado:* ${priceText}\n*Prazo:* ${terms.daysValue} dias ${terms.daysType === 'uteis' ? 'úteis' : 'corridos'}\n\nEstou enviando o PDF completo com todos os detalhes e termos de validade comercial!`;
    return encodeURIComponent(text);
  };

  // Generate PDF file configuration
  const getPdfOptions = () => ({
    margin: [10, 10, 10, 10],
    filename: `${estimate.id}-${estimate.client.name.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true,
      logging: false
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  });

  // Action: Download PDF
  const handleDownload = () => {
    setIsGenerating(true);
    const element = pdfRef.current;
    
    html2pdf()
      .from(element)
      .set(getPdfOptions())
      .save()
      .then(() => setIsGenerating(false))
      .catch((err) => {
        console.error(err);
        setIsGenerating(false);
      });
  };

  // Action: Native Share File
  const handleShare = async () => {
    setIsGenerating(true);
    const element = pdfRef.current;

    try {
      // Generate blob
      const pdfBlob = await html2pdf()
        .from(element)
        .set(getPdfOptions())
        .outputPdf('blob');

      const fileName = `Estimativa-${estimate.id}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Check if Web Share API is available with file support
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Estimativa Comercial ${estimate.id}`,
          text: `Olá! Segue em anexo a estimativa comercial de móveis planejados para o seu projeto.`
        });
      } else {
        // Fallback: Just download and copy text
        handleDownload();
        alert('O compartilhamento direto de arquivos não é suportado pelo seu navegador. O PDF foi baixado.');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
      // Fallback
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  // Action: Share on WhatsApp (Downloads PDF and redirects to chat with prefilled text)
  const handleWhatsAppShare = () => {
    // Download first
    handleDownload();
    // Open WhatsApp link
    const phone = estimate.client.whatsapp ? estimate.client.whatsapp.replace(/\D/g, '') : '';
    const waUrl = phone 
      ? `https://api.whatsapp.com/send?phone=55${phone}&text=${getWhatsAppMessage()}`
      : `https://api.whatsapp.com/send?text=${getWhatsAppMessage()}`;
    
    window.open(waUrl, '_blank');
  };

  // Action: Copy summary text to clipboard
  const handleCopyText = () => {
    const priceText = calculated.useRange
      ? `${formatCurrency(calculated.range.min)} a ${formatCurrency(calculated.range.max)}`
      : `${formatCurrency(calculated.totalInvestment)}`;

    const text = `Estimativa Comercial - ${company.name || 'Marcenaria'}\n` +
      `--------------------------------------\n` +
      `Proposta Nº: ${estimate.id}\n` +
      `Cliente: ${estimate.client.name}\n` +
      `Data: ${formatDate(estimate.date)}\n` +
      `Valor Estimado: ${priceText}\n` +
      `Condições: ${terms.payment}\n` +
      `Prazo: ${terms.daysValue} dias ${terms.daysType === 'uteis' ? 'úteis' : 'corridos'}\n` +
      `--------------------------------------\n` +
      `Gostou da estimativa? Entre em contato para darmos início ao projeto executivo!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  // Render a nice text representation of the units
  const renderItemUnit = (item) => {
    if (item.unit === 'm') return `${item.quantity.toFixed(2)} m (Linear)`;
    if (item.unit === 'm²') return `${item.quantity.toFixed(2)} m²`;
    if (item.unit === 'unidade') return `${item.quantity} un`;
    return 'Valor Fechado';
  };

  // Estilo ativo para injeção de cores dinâmicas no PDF
  const dynamicStyles = {
    '--primary-color': appearance.primaryColor || '#7c5332',
    '--secondary-color': appearance.secondaryColor || '#dcb386',
    '--text-color': appearance.textColor || '#2d2016',
    '--bg-color': appearance.backgroundColor || '#faf6f0',
  };

  return (
    <div className="pdf-preview-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ width: 'auto', padding: '8px 12px' }}>
          <ChevronLeft size={16} /> Editar
        </button>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#8c8279' }}>
          Modelo: {appearance.pdfStyle.toUpperCase()}
        </span>
      </div>

      {/* High Fidelity Scrollable PDF Container */}
      <div className="pdf-preview-outer">
        <div className="pdf-preview-scroll">
          <div 
            id="proposal-pdf-content" 
            ref={pdfRef} 
            className={`pdf-document ${appearance.pdfStyle}`}
            style={dynamicStyles}
          >
            {/* Logo and Company Header */}
            <div className="pdf-header">
              <div>
                {company.logo ? (
                  <img src={company.logo} alt="Logo" className="pdf-logo" />
                ) : (
                  <div className="pdf-company-name-text">{company.name}</div>
                )}
                {company.owner && <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Resp: {company.owner}</p>}
              </div>
              <div className="pdf-company-info">
                {company.cnpj && <p>CNPJ: {company.cnpj}</p>}
                {companyWhatsapp && <p>Whats: {companyWhatsapp}</p>}
                {company.email && <p>Email: {company.email}</p>}
                {company.instagram && <p>Insta: {company.instagram}</p>}
                {company.website && <p>{company.website}</p>}
              </div>
            </div>

            {/* Document Title */}
            <div className="pdf-title-block">
              <h1>ESTIMATIVA DE INVESTIMENTO</h1>
              <p style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
                Nº {estimate.id}
              </p>
            </div>

            {/* Meta Grid */}
            <div className="pdf-meta-grid">
              <div className="pdf-meta-item">
                <strong>Cliente</strong>
                {estimate.client.name}
                {estimate.client.address && (
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                    End: {estimate.client.address}
                  </span>
                )}
              </div>
              <div className="pdf-meta-item">
                <strong>Data de Emissão</strong>
                {formatDate(estimate.date)}
              </div>
              <div className="pdf-meta-item">
                <strong>Validade</strong>
                {getValidityDate()} ({terms.validityDays} dias)
              </div>
            </div>

            {/* Project description card (Moderno style) or simple table */}
            <div className="pdf-section-card">
              <h2 className="pdf-section-title">Projeto Preliminar</h2>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Item / Ambiente</th>
                    <th>Medida Aprox.</th>
                    <th className="align-right">Investimento Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td>{renderItemUnit(item)}</td>
                      <td className="align-right" style={{ fontWeight: 600 }}>
                        {formatCurrency(getItemDisplayValue(item))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Investment Block */}
            {appearance.pdfStyle === 'premium' ? (
              <div className="total-highlight-box">
                <span className="pdf-total-label" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>INVESTIMENTO TOTAL ESTIMADO</span>
                <h1 className="pdf-total-value" style={{ margin: '4px 0 0 0', fontSize: '2.5rem' }}>
                  {calculated.useRange ? (
                    <span>
                      {formatCurrency(calculated.range.min)} a {formatCurrency(calculated.range.max)}
                    </span>
                  ) : (
                    <span>{formatCurrency(calculated.totalInvestment)}</span>
                  )}
                </h1>
              </div>
            ) : (
              <div className="pdf-total-block">
                <span className="pdf-total-label">INVESTIMENTO TOTAL ESTIMADO</span>
                <div className="pdf-total-value">
                  {calculated.useRange ? (
                    <span>
                      {formatCurrency(calculated.range.min)} a {formatCurrency(calculated.range.max)}
                    </span>
                  ) : (
                    <span>{formatCurrency(calculated.totalInvestment)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Conditions Section */}
            <div className="pdf-section-card">
              <h2 className="pdf-section-title">Condições Comerciais</h2>
              <div className="pdf-conditions-grid">
                <div>
                  <strong>Pagamento:</strong> {terms.payment}
                </div>
                <div>
                  <strong>Prazo Estimado:</strong> {terms.daysValue} dias {terms.daysType === 'uteis' ? 'úteis' : 'corridos'}
                </div>
                {calculated.additionalCosts.map(cost => (
                  <div key={cost.id}>
                    <strong>{cost.name}:</strong> {cost.type === 'included' ? 'Incluso' : formatCurrency(cost.calculatedValue)}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes / Comments if any */}
            {estimate.notes && (
              <div className="pdf-section-card" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase', color: '#666', fontSize: '0.75rem' }}>
                  Observações específicas
                </strong>
                <p>{estimate.notes}</p>
              </div>
            )}

            {/* Legal Disclaimers */}
            <div className="pdf-disclaimer-list">
              <strong style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Informações Importantes
              </strong>
              {settings.disclaimers
                .filter(disc => disc.active)
                .map(disc => (
                  <div key={disc.id} className="pdf-disclaimer-item">
                    • {disc.text}
                  </div>
                ))
              }
            </div>

            {/* Call to Action Footer */}
            <div className="pdf-footer">
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-color)' }}>Gostou da estimativa de investimento?</p>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                Entre em contato para agendarmos a medição técnica fina e darmos início ao projeto executivo 3D.
              </p>
              {companyWhatsapp && (
                <a 
                  href={`https://api.whatsapp.com/send?phone=55${companyWhatsapp.replace(/\D/g, '')}&text=Ol%C3%A1!%20Tenho%20interesse%20em%20avancar%20com%20o%20projeto%20comercial!`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="pdf-whatsapp-btn"
                >
                  <MessageCircle size={14} /> Falar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Panel */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Orçamento Gerado!</h3>
      
      <div className="share-action-buttons">
        <button 
          className="btn btn-primary" 
          onClick={handleWhatsAppShare}
          disabled={isGenerating}
        >
          <MessageCircle size={18} /> Enviar pelo WhatsApp
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleDownload}
            disabled={isGenerating}
          >
            <Download size={16} /> Baixar PDF
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleShare}
            disabled={isGenerating}
          >
            <Share2 size={16} /> Compartilhar
          </button>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={handleCopyText}
          style={{ borderStyle: 'dashed' }}
        >
          {copiedText ? (
            <>
              <Check size={16} style={{ color: 'var(--status-approved-text)' }} /> Resumo Copiado!
            </>
          ) : (
            <>
              <Copy size={16} /> Copiar Resumo em Texto
            </>
          )}
        </button>
      </div>
    </div>
  );
}
