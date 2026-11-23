/** Two boxes: the site sends page code once; your files never travel back. */
export function PrivacyDiagram() {
  return (
    <figure className="lt-flow" style={{ margin: 0 }}>
      <svg viewBox="0 0 520 300" role="img" aria-labelledby="privacy-diagram-title">
        <title id="privacy-diagram-title">
          Localtools sends the page to your browser once. Your files and numbers stay in your browser and are not sent back.
        </title>
        <defs>
          <marker id="pd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#15201b" />
          </marker>
        </defs>

        {/* Your device */}
        <rect x="12" y="20" width="250" height="260" rx="16" fill="#e6f1eb" stroke="#0c6b4e" strokeWidth="1.5" />
        <text x="32" y="52" fontSize="15" fontWeight="700" fill="#15201b">Your browser</text>
        <rect x="32" y="74" width="92" height="112" rx="8" fill="#fff" stroke="#c3cac2" />
        <path d="M48 96h60M48 112h60M48 128h44" stroke="#c3cac2" strokeWidth="4" strokeLinecap="round" />
        <rect x="46" y="146" width="64" height="14" rx="3" fill="#f2e35b" />
        <text x="78" y="208" fontSize="12" fill="#56615b" textAnchor="middle">Your file</text>
        <rect x="150" y="74" width="92" height="112" rx="8" fill="#15201b" />
        <text x="196" y="122" fontSize="22" fill="#f2e35b" textAnchor="middle" fontWeight="800">ƒ(x)</text>
        <text x="196" y="150" fontSize="11" fill="#b8c3bc" textAnchor="middle">tool runs here</text>
        <text x="196" y="208" fontSize="12" fill="#56615b" textAnchor="middle">The tool</text>
        <path d="M124 130h22" stroke="#15201b" strokeWidth="2" markerEnd="url(#pd-arrow)" />
        <text x="32" y="254" fontSize="13" fill="#0c6b4e" fontWeight="700">Result appears here, too.</text>

        {/* Server */}
        <rect x="350" y="70" width="158" height="160" rx="16" fill="#fff" stroke="#c3cac2" strokeDasharray="5 5" />
        <text x="370" y="102" fontSize="15" fontWeight="700" fill="#15201b">Localtools</text>
        <text x="370" y="122" fontSize="12" fill="#56615b">web server</text>
        <text x="370" y="196" fontSize="12" fill="#56615b">Only hosts the</text>
        <text x="370" y="212" fontSize="12" fill="#56615b">page itself.</text>

        {/* Page code: server -> browser */}
        <path d="M346 120H270" stroke="#15201b" strokeWidth="2" markerEnd="url(#pd-arrow)" />
        <text x="308" y="110" fontSize="11" fill="#15201b" textAnchor="middle">page code</text>

        {/* Files: browser -/-> server */}
        <path d="M270 176h72" stroke="#a3341c" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M298 164l20 24M318 164l-20 24" stroke="#a3341c" strokeWidth="3" strokeLinecap="round" />
        <text x="308" y="210" fontSize="11" fill="#a3341c" textAnchor="middle">your data</text>
      </svg>
    </figure>
  );
}
