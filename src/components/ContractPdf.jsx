import React, { useRef, useState } from 'react';
import { 
  Download, 
  Share2, 
  MessageCircle, 
  ChevronLeft, 
  Copy,
  Check
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { formatCurrency } from '../utils/calculator';

export default function ContractPdf({ contract, settings, onBack }) {
  const pdfRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  
  const appearance = settings.appearance || {};
  const company = settings.company || {};
  const companyWhatsapp = company.whatsapp || '';
  const terms = contract.contractTerms || {};

  const entryValue = contract.totalValue * ((terms.entryPercentage || 0) / 100);
  const balanceValue = contract.totalValue - entryValue;
  const hasEntry = (terms.entryPercentage || 0) > 0;

  const services = contract.services || {};
  const freightType = services.freight?.type || 'included';
  const freightValue = services.freight?.value || 0;
  const assemblyType = services.assembly?.type || 'included';
  const assemblyValue = services.assembly?.value || 0;
  const installationType = services.installation?.type || 'included';
  const installationValue = services.installation?.value || 0;

  const calculateServicesTotal = () => {
    const freight = freightType === 'separate' ? freightValue : 0;
    const assembly = assemblyType === 'separate' ? assemblyValue : 0;
    const installation = installationType === 'separate' ? installationValue : 0;
    return freight + assembly + installation;
  };

  const calculateGrandTotal = () => {
    return contract.totalValue + calculateServicesTotal();
  };

  const calculateInstallmentValue = () => {
    const remaining = contract.totalValue - entryValue;
    const installments = terms.installments || 1;
    return remaining / installments;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  const getFreightText = () => {
    switch (freightType) {
      case 'included': return 'Incluso';
      case 'separate': return formatCurrency(freightValue);
      default: return 'Incluso';
    }
  };

  const getPdfOptions = () => ({
    margin: [12, 12, 15, 12],
    filename: `Contrato-${contract.id}-${contract.client.name.replace(/\s+/g, '_')}.pdf`,
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

  const handleShare = async () => {
    setIsGenerating(true);
    const element = pdfRef.current;

    try {
      const pdfBlob = await html2pdf()
        .from(element)
        .set(getPdfOptions())
        .outputPdf('blob');

      const fileName = `Contrato-${contract.id}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Contrato ${contract.id}`,
          text: `Segue o contrato de fabricação, fornecimento e instalação de móveis planejados.`
        });
      } else {
        handleDownload();
        alert('O compartilhamento direto de arquivos não é suportado pelo seu navegador. O PDF foi baixado.');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = () => {
    handleDownload();
    const phone = contract.client.whatsapp ? contract.client.whatsapp.replace(/\D/g, '') : '';
    const message = encodeURIComponent(
      `Olá ${contract.client.name}! Segue o contrato de fabricação, fornecimento e instalação de móveis planejados.\n\n` +
      `*Contrato:* ${contract.id}\n` +
      `*Valor:* ${formatCurrency(contract.totalValue)}\n\n` +
      `Por favor, leia atentamente e confirme seu aceite.`
    );
    const waUrl = phone 
      ? `https://api.whatsapp.com/send?phone=55${phone}&text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;
    
    window.open(waUrl, '_blank');
  };

  const handleCopyText = () => {
    const text = `Contrato de Fabricação - ${company.name}\n` +
      `--------------------------------------\n` +
      `Contrato: ${contract.id}\n` +
      `Cliente: ${contract.client.name}\n` +
      `Data: ${formatDate(contract.date)}\n` +
      `Valor: ${formatCurrency(contract.totalValue)}\n` +
      `Entrada: ${formatCurrency(entryValue)} (${terms.entryPercentage}%)\n` +
      `Saldo: ${formatCurrency(balanceValue)}\n` +
      `Prazo: ${terms.fabricationDays} dias ${terms.workingDaysOnly ? 'úteis' : 'corridos'}\n` +
      `--------------------------------------\n` +
      `Aguardamos seu aceite para dar início à produção!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  const dynamicStyles = {
    '--primary-color': appearance.primaryColor || '#7c5332',
    '--primary-color-rgb': (() => {
      const hex = (appearance.primaryColor || '#7c5332').replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    })(),
    '--secondary-color': appearance.secondaryColor || '#dcb386',
    '--text-color': appearance.textColor || '#2d2016',
    '--bg-color': appearance.backgroundColor || '#faf6f0',
  };

  const getClauseNum = (baseNum) => {
    return contract.estimateReference ? baseNum + 1 : baseNum;
  };

  return (
    <div className="pdf-preview-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ width: 'auto', padding: '8px 12px' }}>
          <ChevronLeft size={16} /> Editar
        </button>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#8c8279' }}>
          Contrato: {contract.id}
        </span>
      </div>

      <div className="pdf-preview-outer">
        <div className="pdf-preview-scroll">
          <div 
            id="contract-pdf-content" 
            ref={pdfRef} 
            className="pdf-document contract-style"
            style={dynamicStyles}
          >
            {/* ===== PAGE 1: COVER ===== */}
            <div className="ct-page ct-page-cover">

              {/* Compact header (only on page 1 as full version) */}
              <div className="ct-header-full">
                <div className="ct-header-full-left">
                  {company.logo ? (
                    <img src={company.logo} alt="Logo" className="ct-logo-full" />
                  ) : (
                    <div className="ct-logo-text">{company.name}</div>
                  )}
                </div>
                <div className="ct-header-full-right">
                  {company.name && <p className="ct-company-name">{company.name}</p>}
                  {company.owner && <p>Resp: {company.owner}</p>}
                  {company.cnpj && <p>CNPJ: {company.cnpj}</p>}
                  {companyWhatsapp && <p>{companyWhatsapp}</p>}
                  {company.email && <p>{company.email}</p>}
                </div>
              </div>

              <div className="ct-title-block">
                <h1 className="ct-main-title">CONTRATO DE FABRICAÇÃO, FORNECIMENTO E INSTALAÇÃO DE MÓVEIS PLANEJADOS</h1>
                <div className="ct-contract-id">Contrato nº <strong>{contract.id}</strong></div>
                {contract.estimateReference && (
                  <div className="ct-estimate-ref">Origem: Estimativa {contract.estimateReference}</div>
                )}
                <div className="ct-date">Data: {formatDate(contract.date)}</div>
              </div>

              {/* Parties */}
              <div className="ct-parties">
                <div className="ct-party">
                  <div className="ct-party-label">CONTRATANTE</div>
                  <p className="ct-party-name">{contract.client.name}</p>
                  {contract.client.cpf && <p>CPF/CNPJ: {contract.client.cpf}</p>}
                  {contract.client.whatsapp && <p>Tel: {contract.client.whatsapp}</p>}
                  {contract.client.email && <p>{contract.client.email}</p>}
                  {contract.client.address && <p className="ct-party-address">{contract.client.address}</p>}
                </div>
                <div className="ct-party">
                  <div className="ct-party-label">CONTRATADA</div>
                  <p className="ct-party-name">{company.name}</p>
                  {company.cnpj && <p>CNPJ: {company.cnpj}</p>}
                  {company.whatsapp && <p>Tel: {company.whatsapp}</p>}
                  {company.email && <p>{company.email}</p>}
                  {company.address && <p className="ct-party-address">{company.address}</p>}
                </div>
              </div>

              {/* Summary highlight boxes */}
              <div className="ct-summary-boxes">
                <div className="ct-box ct-box-main">
                  <span className="ct-box-label">VALOR TOTAL</span>
                  <span className="ct-box-value">{formatCurrency(calculateGrandTotal())}</span>
                </div>
                <div className="ct-box-row">
                  {hasEntry && (
                    <div className="ct-box ct-box-sm">
                      <span className="ct-box-label">ENTRADA ({terms.entryPercentage}%)</span>
                      <span className="ct-box-value-sm">{formatCurrency(entryValue)}</span>
                    </div>
                  )}
                  <div className="ct-box ct-box-sm">
                    <span className="ct-box-label">PRAZO</span>
                    <span className="ct-box-value-sm">{terms.fabricationDays} dias {terms.workingDaysOnly ? 'úteis' : 'corridos'}</span>
                  </div>
                </div>
                {(freightType === 'separate' || assemblyType === 'separate' || installationType === 'separate') && (
                  <div className="ct-box-row">
                    {freightType === 'separate' && (
                      <div className="ct-box ct-box-xs">
                        <span className="ct-box-label">FRETE</span>
                        <span className="ct-box-value-xs">{formatCurrency(freightValue)}</span>
                      </div>
                    )}
                    {assemblyType === 'separate' && (
                      <div className="ct-box ct-box-xs">
                        <span className="ct-box-label">MONTAGEM</span>
                        <span className="ct-box-value-xs">{formatCurrency(assemblyValue)}</span>
                      </div>
                    )}
                    {installationType === 'separate' && (
                      <div className="ct-box ct-box-xs">
                        <span className="ct-box-label">INSTALAÇÃO</span>
                        <span className="ct-box-value-xs">{formatCurrency(installationValue)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Items table if any */}
              {contract.items.length > 0 && (
                <div className="ct-section ct-page-break-avoid">
                  <div className="ct-section-header">
                    <span className="ct-section-num">00</span>
                    <span className="ct-section-name">ITENS CONTRATADOS</span>
                  </div>
                  <table className="ct-table">
                    <thead>
                      <tr>
                        <th>Item / Ambiente</th>
                        <th>Medida</th>
                        <th className="align-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contract.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.description}</td>
                          <td>{item.quantity} {item.unit}</td>
                          <td className="align-right">{formatCurrency(item.quantity * item.baseValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ===== CLAUSES ===== */}
            <div className="ct-clauses">

              {/* 01. OBJETO */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">01</span>
                  <span className="ct-clause-title">OBJETO</span>
                </div>
                <p>A CONTRATADA realizará a fabricação, fornecimento, entrega, montagem e instalação dos móveis descritos na proposta e no projeto aprovado pelo CONTRATANTE.</p>
                <p>A proposta, o projeto aprovado e eventuais alterações posteriormente aprovadas integram este contrato.</p>
              </div>

              {/* 02. PROJETO E MEDIDAS */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">02</span>
                  <span className="ct-clause-title">PROJETO E MEDIDAS</span>
                </div>
                <p>A fabricação será iniciada após a definição das medidas finais e a aprovação do projeto pelo CONTRATANTE.</p>
                <p>O CONTRATANTE deverá conferir as medidas, materiais, cores, acabamentos, divisões, ferragens e demais características do projeto antes da aprovação.</p>
                <p>Após a aprovação, alterações solicitadas pelo CONTRATANTE poderão implicar alteração de preço e prazo, que serão informados previamente.</p>
              </div>

              {/* 03. VALOR */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">03</span>
                  <span className="ct-clause-title">VALOR</span>
                </div>
                <p>O valor total contratado é:</p>
                <div className="ct-value-highlight">{formatCurrency(calculateGrandTotal())}</div>
                {calculateServicesTotal() > 0 && (
                  <p>Este valor inclui: Móveis ({formatCurrency(contract.totalValue)}){freightType === 'separate' ? ` + Frete (${formatCurrency(freightValue)})` : ''}{assemblyType === 'separate' ? ` + Montagem (${formatCurrency(assemblyValue)})` : ''}{installationType === 'separate' ? ` + Instalação (${formatCurrency(installationValue)})` : ''}.</p>
                )}
                <p>O preço inclui somente os materiais e serviços expressamente descritos na proposta e no projeto aprovado.</p>
                <p>Serviços ou materiais adicionais dependerão de prévia aprovação do CONTRATANTE.</p>
              </div>

              {/* 04. PAGAMENTO */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">04</span>
                  <span className="ct-clause-title">PAGAMENTO E SINAL/ENTRADA</span>
                </div>
                <p>O pagamento será realizado da seguinte forma:</p>
                <div className="ct-payment-highlight">
                  <span className="ct-payment-method">{terms.payment}</span>
                </div>
                {hasEntry && (
                  <>
                    <div className="ct-info-grid">
                      <div className="ct-info-item">
                        <span className="ct-info-label">SINAL/ENTRADA</span>
                        <span className="ct-info-value">{formatCurrency(entryValue)}</span>
                        <span className="ct-info-sub">{terms.entryPercentage}% do valor dos móveis</span>
                      </div>
                      {terms.paymentMethod === 'entrada_parcelas' && terms.installments > 0 && (
                        <div className="ct-info-item">
                          <span className="ct-info-label">PARCELAS</span>
                          <span className="ct-info-value">{terms.installments}× {formatCurrency(calculateInstallmentValue())}</span>
                          <span className="ct-info-sub">conforme cronograma acordado</span>
                        </div>
                      )}
                      <div className="ct-info-item">
                        <span className="ct-info-label">SALDO</span>
                        <span className="ct-info-value">{formatCurrency(balanceValue)}</span>
                        <span className="ct-info-sub">{terms.balanceCondition || 'condições acordadas'}</span>
                      </div>
                    </div>
                    <p>Quando houver pagamento de sinal/entrada, sua finalidade será possibilitar o início da contratação, incluindo a preparação do projeto, aquisição de materiais e programação da produção, conforme o caso.</p>
                    <p>A fabricação terá início após a confirmação do pagamento do sinal/entrada e a aprovação do projeto.</p>
                    <p>O valor pago será posteriormente abatido do preço total contratado.</p>
                  </>
                )}
                {!hasEntry && terms.paymentMethod === 'a_vista' && (
                  <p>O pagamento será realizado integralmente antes do início da fabricação.</p>
                )}
                {!hasEntry && terms.paymentMethod !== 'a_vista' && (
                  <p>O pagamento será realizado conforme a forma acima estabelecida.</p>
                )}
                <p>Em caso de cancelamento ou rescisão, os valores pagos serão tratados de acordo com as condições deste contrato e com a legislação aplicável, considerando os serviços realizados, materiais adquiridos e demais despesas efetivamente assumidas.</p>
              </div>

              {/* 05. ATRASO NO PAGAMENTO */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">05</span>
                  <span className="ct-clause-title">ATRASO NO PAGAMENTO</span>
                </div>
                <p>O atraso de qualquer parcela acarretará:</p>
                <ul className="ct-list">
                  <li><span className="ct-bullet"></span>multa de {terms.lateFeePercentage}% sobre o valor em atraso;</li>
                  <li><span className="ct-bullet"></span>juros de {terms.monthlyInterest}% ao mês, calculados proporcionalmente aos dias de atraso;</li>
                  {terms.monetaryCorrection && <li><span className="ct-bullet"></span>correção monetária, quando aplicável.</li>}
                </ul>
                <p>Enquanto houver parcela vencida, a CONTRATADA poderá suspender a fabricação, entrega, montagem ou instalação.</p>
                <p>Nesse caso, o prazo de entrega será ajustado de acordo com o período de suspensão.</p>
              </div>

              {/* 06. PRAZO */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">06</span>
                  <span className="ct-clause-title">PRAZO</span>
                </div>
                <p>O prazo estimado para fabricação e entrega é de {terms.fabricationDays} dias {terms.workingDaysOnly ? 'úteis' : 'corridos'}, contado após:</p>
                <ul className="ct-list">
                  <li><span className="ct-bullet"></span>aprovação do projeto;</li>
                  <li><span className="ct-bullet"></span>confirmação das medidas finais;</li>
                  <li><span className="ct-bullet"></span>pagamento da entrada;</li>
                  <li><span className="ct-bullet"></span>definição dos materiais e acabamentos.</li>
                </ul>
                <p>A montagem/instalação será realizada conforme programação previamente combinada.</p>
                <p>O prazo poderá ser ajustado quando houver alterações solicitadas pelo CONTRATANTE, atraso de pagamento, impossibilidade de acesso ao imóvel, necessidade de adequação do local ou situações de caso fortuito ou força maior.</p>
              </div>

              {/* 07. ENTREGA E INSTALAÇÃO */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">07</span>
                  <span className="ct-clause-title">ENTREGA E INSTALAÇÃO</span>
                </div>
                <p>A entrega e instalação serão realizadas no endereço:</p>
                <div className="ct-address-highlight">{contract.address || contract.client.address || 'A definir'}</div>
                <p>O CONTRATANTE deverá garantir o acesso ao imóvel e as condições necessárias para a realização do serviço.</p>
                <p>Serviços de elétrica, hidráulica, pintura, alvenaria, gesso, revestimentos, retirada de móveis existentes ou outros serviços não previstos na proposta não estão incluídos.</p>
              </div>

              {/* 08. FRETE */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">08</span>
                  <span className="ct-clause-title">FRETE</span>
                </div>
                <div className="ct-service-box">
                  <div className="ct-service-row">
                    <span className="ct-service-label">Frete</span>
                    <span className="ct-service-value">{getFreightText()}</span>
                  </div>
                </div>
                <p>Custos extraordinários de transporte, içamento, estacionamento ou equipamentos especiais não previstos na proposta serão previamente informados ao CONTRATANTE.</p>
              </div>

              {/* 09. SOBRAS DE MATERIAL */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">09</span>
                  <span className="ct-clause-title">SOBRAS DE MATERIAL</span>
                </div>
                {terms.surplus === 'company' ? (
                  <>
                    <p>As sobras, retalhos e materiais remanescentes resultantes da fabricação ficarão com a CONTRATADA, que poderá destiná-los ou reaproveitá-los livremente.</p>
                    <p>Materiais fornecidos diretamente pelo CONTRATANTE permanecerão de sua propriedade.</p>
                  </>
                ) : (
                  <>
                    <p>As sobras e retalhos aproveitáveis resultantes da fabricação serão entregues ao CONTRATANTE juntamente com a conclusão do serviço.</p>
                    <p>A entrega ficará limitada aos materiais efetivamente remanescentes após a fabricação, não havendo obrigação de produzir ou separar materiais exclusivamente para gerar sobras.</p>
                    <p>Materiais fornecidos diretamente pelo CONTRATANTE permanecerão de sua propriedade.</p>
                  </>
                )}
              </div>

              {/* 10. CANCELAMENTO */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">10</span>
                  <span className="ct-clause-title">CANCELAMENTO</span>
                </div>
                <p>O cancelamento deverá ser comunicado à outra parte.</p>
                <p>Caso a fabricação já tenha sido iniciada ou tenham sido adquiridos materiais específicos para o projeto, serão considerados os serviços realizados e os custos efetivamente incorridos, observada a legislação aplicável.</p>
              </div>

              {/* 11. GARANTIA */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">11</span>
                  <span className="ct-clause-title">GARANTIA</span>
                </div>
                <p>A CONTRATADA responderá pela qualidade dos serviços e pelos defeitos de fabricação nos termos da legislação aplicável.</p>
                <p>A garantia não abrange danos decorrentes de mau uso, alterações realizadas por terceiros, desgaste natural ou utilização em desacordo com as orientações de conservação.</p>
              </div>

              {/* 12. RESPONSABILIDADES DO CLIENTE */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">12</span>
                  <span className="ct-clause-title">RESPONSABILIDADES DO CLIENTE</span>
                </div>
                <p>O CONTRATANTE se compromete a:</p>
                <ul className="ct-list">
                  <li><span className="ct-bullet"></span>realizar os pagamentos nos prazos acordados;</li>
                  <li><span className="ct-bullet"></span>conferir e aprovar o projeto;</li>
                  <li><span className="ct-bullet"></span>disponibilizar o imóvel para medição, entrega e instalação;</li>
                  <li><span className="ct-bullet"></span>informar previamente eventuais restrições de acesso, condomínio ou horários;</li>
                  <li><span className="ct-bullet"></span>comunicar qualquer problema identificado após a entrega.</li>
                </ul>
              </div>

              {/* 13. ALTERAÇÕES */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">13</span>
                  <span className="ct-clause-title">ALTERAÇÕES</span>
                </div>
                <p>Qualquer alteração de projeto, material, medida, acabamento ou serviço após a aprovação deverá ser previamente aprovada pelas partes.</p>
                <p>Quando houver alteração de valor ou prazo, o CONTRATANTE será informado antes da execução.</p>
              </div>

              {/* 14. ESTIMATIVA (conditional) */}
              {contract.estimateReference && (
                <div className="ct-clause ct-page-break-avoid">
                  <div className="ct-clause-header">
                    <span className="ct-clause-num">14</span>
                    <span className="ct-clause-title">ESTIMATIVA E PROJETO DEFINITIVO</span>
                  </div>
                  <p>Quando este contrato decorrer de uma estimativa preliminar ({contract.estimateReference}), o CONTRATANTE reconhece que o valor inicial foi calculado com base em medidas e informações aproximadas.</p>
                  <p>O valor definitivo será aquele aprovado após a elaboração do projeto e definição dos materiais, medidas, ferragens e demais especificações.</p>
                </div>
              )}

              {/* COMUNICAÇÕES */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">{String(getClauseNum(14)).padStart(2, '0')}</span>
                  <span className="ct-clause-title">COMUNICAÇÕES E ACEITE ELETRÔNICO</span>
                </div>
                <p>As partes reconhecem como válidas as comunicações realizadas por WhatsApp, e-mail ou outros meios eletrônicos utilizados durante a contratação.</p>
                <p>Este contrato poderá ser assinado ou aceito eletronicamente, sendo válidos os registros eletrônicos capazes de demonstrar a manifestação de vontade das partes.</p>
              </div>

              {/* DISPOSIÇÕES FINAIS */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">{String(getClauseNum(15)).padStart(2, '0')}</span>
                  <span className="ct-clause-title">DISPOSIÇÕES FINAIS</span>
                </div>
                <p>Este contrato, juntamente com a proposta e o projeto aprovado, representa o acordo entre as partes.</p>
                <p>Eventuais alterações deverão ser previamente aprovadas.</p>
                <p>A tolerância quanto ao descumprimento de qualquer obrigação não representa renúncia ao direito de exigir seu cumprimento posteriormente.</p>
              </div>

              {/* FORO */}
              <div className="ct-clause ct-page-break-avoid">
                <div className="ct-clause-header">
                  <span className="ct-clause-num">{String(getClauseNum(16)).padStart(2, '0')}</span>
                  <span className="ct-clause-title">FORO</span>
                </div>
                <p>Fica eleito o <strong>Foro da Comarca de {company.address ? company.address.split('-').pop().trim() : 'São Paulo/SP'}</strong>, com ressalva das regras legais de competência aplicáveis às relações de consumo.</p>
              </div>
            </div>

            {/* ===== SIGNATURE PAGE ===== */}
            <div className="ct-signatures-page">
              <div className="ct-signatures-header">
                <div className="ct-signatures-line-accent"></div>
                <h2 className="ct-signatures-main-title">ACEITE E ASSINATURAS</h2>
                <p className="ct-signatures-declaration">
                  Declaro que li e compreendi este contrato e estou de acordo com as condições estabelecidas.
                </p>
              </div>

              <div className="ct-signatures-primary">
                <div className="ct-sig-block">
                  <div className="ct-sig-role">CONTRATADA</div>
                  <div className="ct-sig-line"></div>
                  <div className="ct-sig-name">{company.name}</div>
                  <div className="ct-sig-detail">{company.owner || ''}</div>
                </div>
                <div className="ct-sig-block">
                  <div className="ct-sig-role">CONTRATANTE</div>
                  <div className="ct-sig-line"></div>
                  <div className="ct-sig-name">{contract.client.name}</div>
                  <div className="ct-sig-detail">CPF/CNPJ: {contract.client.cpf || 'Não informado'}</div>
                </div>
              </div>

              <div className="ct-signatures-witnesses">
                <div className="ct-sig-divider"></div>
                <div className="ct-witnesses-title">TESTEMUNHAS</div>
                <div className="ct-witnesses-grid">
                  <div className="ct-sig-block ct-sig-witness">
                    <div className="ct-sig-line ct-sig-line-thin"></div>
                    <div className="ct-sig-name">{contract.witnesses[0]?.name || ''}</div>
                    <div className="ct-sig-detail">CPF: {contract.witnesses[0]?.cpf || ''}</div>
                  </div>
                  <div className="ct-sig-block ct-sig-witness">
                    <div className="ct-sig-line ct-sig-line-thin"></div>
                    <div className="ct-sig-name">{contract.witnesses[1]?.name || ''}</div>
                    <div className="ct-sig-detail">CPF: {contract.witnesses[1]?.cpf || ''}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== REPEATING FOOTER ===== */}
            <div className="ct-footer-repeat">
              <div className="ct-footer-line"></div>
              <div className="ct-footer-content">
                <span className="ct-footer-left">{company.name} · {companyWhatsapp} · {company.email}</span>
                <span className="ct-footer-right">Contrato {contract.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Contrato Gerado!</h3>
      
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
