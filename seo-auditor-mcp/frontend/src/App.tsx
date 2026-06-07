import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import './index.css';

// ASCII Progress Bar Component
const AsciiBar = ({ score, label }: { score: number, label: string }) => {
  const totalBlocks = 20;
  const filledBlocks = Math.round((score / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  
  const barStr = `[${'#'.repeat(filledBlocks)}${'-'.repeat(emptyBlocks)}]`;
  
  let statusClass = '';
  if (score < 50) statusClass = 'danger';
  else if (score < 80) statusClass = 'warning';

  return (
    <div className="ascii-bar-container">
      <div className="ascii-bar-label">
        <span>{label}</span>
        <span className={statusClass}>{score}%</span>
      </div>
      <div className={`ascii-bar ${statusClass}`}>
        {barStr}
      </div>
    </div>
  );
};

// ASCII Loader
const AsciiLoader = () => {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => setFrame(f => (f + 1) % 4), 200);
    return () => clearInterval(timer);
  }, []);

  const spinner = ['|', '/', '-', '\\'][frame];

  return (
    <div className="ascii-loader">
      <p>Establishing secure connection to target... [OK]</p>
      <p>Bypassing standard robots.txt protocols... [OK]</p>
      <p>Extracting DOM node topology... {spinner}</p>
      <br/>
      <p>WAITING FOR AUDIT RESPONSE...</p>
    </div>
  );
};

function App() {
  const [url, setUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const calculateScore = (issues: number, warnings: number) => {
    let score = 100;
    score -= (issues * 15);
    score -= (warnings * 5);
    return Math.max(0, score);
  };

  const handleAudit = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      const response = await fetch('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, targetKeywords: keywordList })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'SYS_ERR_FETCH_FAILED');
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('blueprint-pdf');
    if (!element) return;
    
    const opt = {
      margin:       1,
      filename:     'SEO_Audit_Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#000000' },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const techScore = result ? calculateScore(result.technicalAuditResult.issues.length, result.technicalAuditResult.warnings.length) : 0;
  const contentScore = result ? calculateScore(result.contentQualityResult.issues.length, result.contentQualityResult.warnings.length) : 0;

  return (
    <div className="app-container">
      
      <header style={{marginBottom: '40px'}}>
        <h1>SEO_AUDITOR_MAINFRAME_v1.0</h1>
        <p>SYSTEM READY. WAITING FOR INPUT.</p>
      </header>
      
      <div className="terminal-box">
        <div className="input-row prompt">
          <label className="input-label">TARGET_URL:</label>
          <input 
            type="url" 
            className="terminal-input" 
            placeholder="https://target-domain.com" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
          />
        </div>
        
        <div className="input-row prompt">
          <label className="input-label">KEYWORD_VECTORS:</label>
          <input 
            type="text" 
            className="terminal-input" 
            placeholder="keyword1, keyword2" 
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
          />
        </div>

        <button className="btn-hack" onClick={handleAudit} disabled={loading || !url}>
          {loading ? 'EXECUTING...' : 'INITIATE_AUDIT'}
        </button>
        
        {error && (
          <div style={{color: 'var(--terminal-red)', marginTop: '15px'}}>
            [CRITICAL ERROR]: {error}
          </div>
        )}
      </div>

      {loading && <AsciiLoader />}

      {result && !loading && (
        <div className="dashboard-grid">
          
          {/* Lighthouse Telemetry Card */}
          {result.lighthouseResult && (
            <div className="module full-width">
              <h2 className="module-title">PERFORMANCE_TELEMETRY (WEB_VITALS)</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px'}}>
                <AsciiBar score={result.lighthouseResult.performanceScore} label="PERFORMANCE_INDEX" />
                <AsciiBar score={result.lighthouseResult.accessibilityScore} label="ACCESSIBILITY_INDEX" />
                <AsciiBar score={result.lighthouseResult.bestPracticesScore} label="BEST_PRACTICES" />
                <AsciiBar score={result.lighthouseResult.seoScore} label="SEO_PRACTICES" />
              </div>
              <div style={{borderTop: '1px dashed var(--terminal-green-dim)', paddingTop: '15px', color: 'var(--terminal-gray)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'}}>
                <span>LCP: <strong style={{color: 'var(--terminal-green)'}}>{result.lighthouseResult.largestContentfulPaint}</strong></span>
                <span>CLS: <strong style={{color: 'var(--terminal-green)'}}>{result.lighthouseResult.cumulativeLayoutShift}</strong></span>
                <span>TBT: <strong style={{color: 'var(--terminal-green)'}}>{result.lighthouseResult.totalBlockingTime}</strong></span>
              </div>
            </div>
          )}

          {/* Technical SEO Card */}
          <div className="module">
            <h2 className="module-title">TECH_ARCHITECTURE_LOG</h2>
            
            <AsciiBar score={techScore} label="INTEGRITY_SCORE" />

            <div className="log-list">
              {result.technicalAuditResult.issues.map((issue: string, i: number) => (
                <div key={i} className="log-entry danger">
                  <span className="log-prefix">[FAIL]</span>
                  <span className="log-content">{issue}</span>
                </div>
              ))}
              {result.technicalAuditResult.warnings.map((warn: string, i: number) => (
                <div key={`w-${i}`} className="log-entry warning">
                  <span className="log-prefix">[WARN]</span>
                  <span className="log-content">{warn}</span>
                </div>
              ))}
              {result.technicalAuditResult.issues.length === 0 && result.technicalAuditResult.warnings.length === 0 && (
                <div className="log-entry success">
                  <span className="log-prefix">[ OK ]</span>
                  <span className="log-content">NO ANOMALIES DETECTED IN ARCHITECTURE.</span>
                </div>
              )}
            </div>
          </div>

          {/* Content Quality Card */}
          <div className="module">
            <h2 className="module-title">CONTENT_MATRIX_SCAN</h2>

            <AsciiBar score={contentScore} label="CONTENT_HEALTH" />
            
            {/* Keyword Densities */}
            {Object.keys(result.contentQualityResult.keywordDensities || {}).length > 0 && (
              <div style={{marginBottom: '20px', borderBottom: '1px dashed var(--terminal-green-dim)', paddingBottom: '15px'}}>
                <div style={{marginBottom: '10px', color: 'var(--terminal-gray)'}}>--- KEYWORD_SATURATION ---</div>
                {Object.entries(result.contentQualityResult.keywordDensities).map(([kw, density]: [string, any]) => (
                  <div key={kw} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                    <span>{kw}</span>
                    <span style={{color: density > 5 ? 'var(--terminal-red)' : 'var(--terminal-green)'}}>{density.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            )}

            <div className="log-list">
              {result.contentQualityResult.issues.map((issue: string, i: number) => (
                <div key={i} className="log-entry danger">
                  <span className="log-prefix">[FAIL]</span>
                  <span className="log-content">{issue}</span>
                </div>
              ))}
              {result.contentQualityResult.warnings.map((warn: string, i: number) => (
                <div key={`w-${i}`} className="log-entry warning">
                  <span className="log-prefix">[WARN]</span>
                  <span className="log-content">{warn}</span>
                </div>
              ))}
              {result.contentQualityResult.issues.length === 0 && result.contentQualityResult.warnings.length === 0 && (
                <div className="log-entry success">
                  <span className="log-prefix">[ OK ]</span>
                  <span className="log-content">CONTENT METRICS OPTIMAL.</span>
                </div>
              )}
            </div>
          </div>

          {/* Blueprint Card */}
          <div className="module full-width">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--terminal-green-dim)', marginBottom: '20px', paddingBottom: '10px'}}>
              <h2 className="module-title" style={{borderBottom: 'none', margin: 0, padding: 0}}>REMEDIATION_BLUEPRINT.MD</h2>
              <button className="btn-hack" style={{marginTop: 0, padding: '8px 16px', fontSize: '0.9rem'}} onClick={handleDownloadPdf}>
                [ EXPORT_PDF ]
              </button>
            </div>
            
            <div className="markdown-body" id="blueprint-pdf" style={{padding: '20px', background: '#050505'}}>
              <ReactMarkdown>{result.blueprint}</ReactMarkdown>
            </div>
          </div>
          
        </div>
      )}
      
      <div style={{marginTop: '40px', color: 'var(--terminal-green-dim)', fontSize: '0.8rem'}}>
        SEO_AUDITOR_MAINFRAME END OF TRANSMISSION<span className="blinking-cursor"></span>
      </div>
    </div>
  );
}

export default App;
