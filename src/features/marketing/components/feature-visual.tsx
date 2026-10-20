/** Static product panels for zigzag feature rows (Cursor-style). */

export function FeatureVisual({ kind }: { kind: "simulation" | "sheet" | "approve" }) {
  if (kind === "simulation") {
    return (
      <div className="feat-visual">
        <div className="feat-visual-panel">
          <p className="feat-kicker">Simulation</p>
          <p className="feat-big">40 to 70 clicks</p>
          <p className="feat-note">Next 7 days · does not spend</p>
          <div className="feat-ad">
            <p className="feat-ad-title">Quiet hair dryer</p>
            <p className="feat-note">Cold · Feed · Instant Form ready</p>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "sheet") {
    return (
      <div className="feat-visual">
        <div className="feat-visual-panel">
          <p className="feat-kicker">Sheet</p>
          <table className="feat-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Spend</th>
                <th>Results</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Quiet hair dryer</td>
                <td>50.00 $</td>
                <td>10</td>
              </tr>
              <tr>
                <td>Cart 7d</td>
                <td>28.00 $</td>
                <td>6</td>
              </tr>
            </tbody>
          </table>
          <span className="feat-pill">Synced</span>
        </div>
      </div>
    );
  }
  return (
    <div className="feat-visual">
      <div className="feat-visual-panel">
        <p className="feat-kicker">Preview</p>
        <p className="feat-title">Create · Prospect Feed</p>
        <p className="feat-note">Daily budget 40.00 $. Strategy note saved on the preview.</p>
        <div className="feat-actions">
          <span className="feat-pill is-ink">Approve</span>
          <span className="feat-pill is-ghost">Reject</span>
        </div>
      </div>
    </div>
  );
}
