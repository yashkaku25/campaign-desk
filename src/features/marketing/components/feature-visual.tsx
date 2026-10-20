/** Dense product windows for zigzag + feature cards — full desk UI, no eyebrows. */

export function FeatureVisual({ kind }: { kind: "simulation" | "sheet" | "approve" }) {
  if (kind === "simulation") {
    return (
      <div className="feat-frame">
        <div className="feat-chrome">
          <span className="feat-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Campaign desk — Simulation</span>
        </div>
        <div className="feat-desk">
          <aside className="feat-side" aria-hidden="true">
            <span className="is-on">Simulation</span>
            <span>Overview</span>
            <span>Campaigns</span>
            <span>Chat</span>
          </aside>
          <div className="feat-main feat-main-triple">
            <div className="feat-col">
              <p className="feat-title">Ad set</p>
              <div className="feat-steps">
                <span className="is-done">Campaign</span>
                <span className="is-on">Ad set</span>
                <span>Ad</span>
                <span>Analyse</span>
              </div>
              <ul className="feat-list">
                <li>
                  <span>Audience</span>
                  <strong>Cold · Hair care</strong>
                </li>
                <li>
                  <span>Placements</span>
                  <strong>Feed · Reels</strong>
                </li>
                <li>
                  <span>Devices</span>
                  <strong>Mobile · Desktop</strong>
                </li>
                <li>
                  <span>Goal</span>
                  <strong>Instant Form</strong>
                </li>
              </ul>
            </div>
            <div className="feat-col is-panel">
              <p className="feat-title">Quiet hair dryer</p>
              <p className="feat-note">It dries hair without the roar.</p>
              <div className="feat-media" />
              <span className="feat-btn is-ghost">Learn more</span>
            </div>
            <div className="feat-col is-panel">
              <p className="feat-title">40–70 clicks</p>
              <p className="feat-note">Next 7 days · does not spend</p>
              <div className="feat-band">
                <span style={{ width: "40%" }} />
                <span style={{ width: "60%" }} />
              </div>
              <p className="feat-note">Marketer: try Instant Form on Feed first.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "sheet") {
    return (
      <div className="feat-frame">
        <div className="feat-chrome">
          <span className="feat-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Campaign desk — Sheet sync</span>
        </div>
        <div className="feat-desk">
          <aside className="feat-side" aria-hidden="true">
            <span>Overview</span>
            <span className="is-on">Campaigns</span>
            <span>Simulation</span>
            <span>Chat</span>
          </aside>
          <div className="feat-main feat-main-split">
            <div className="feat-col">
              <p className="feat-title">Google Sheet sync</p>
              <p className="feat-mono">docs.google.com/spreadsheets/d/1aB…xY9</p>
              <div className="feat-actions">
                <span className="feat-btn is-ink">Sync now</span>
                <span className="feat-btn is-ghost">Change link</span>
              </div>
              <ul className="feat-checks">
                <li>Spend mapped</li>
                <li>Results mapped</li>
                <li>Creative hints ready</li>
              </ul>
            </div>
            <div className="feat-col is-panel">
              <table className="feat-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Spend</th>
                    <th>Clicks</th>
                    <th>Results</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Quiet hair dryer</td>
                    <td>50.00 $</td>
                    <td>312</td>
                    <td>18</td>
                  </tr>
                  <tr>
                    <td>Cart 7d</td>
                    <td>28.00 $</td>
                    <td>190</td>
                    <td>11</td>
                  </tr>
                  <tr>
                    <td>Prospect Feed</td>
                    <td>41.00 $</td>
                    <td>340</td>
                    <td>22</td>
                  </tr>
                  <tr>
                    <td>Lookalike 1%</td>
                    <td>12.00 $</td>
                    <td>88</td>
                    <td>3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feat-frame">
      <div className="feat-chrome">
        <span className="feat-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>Campaign desk — Chat</span>
      </div>
      <div className="feat-desk">
        <aside className="feat-side" aria-hidden="true">
          <span>Overview</span>
          <span>Campaigns</span>
          <span>Simulation</span>
          <span className="is-on">Chat</span>
        </aside>
        <div className="feat-main feat-main-split">
          <div className="feat-col">
            <div className="feat-chat is-user">
              Create a cold Feed campaign for the hair dryer, daily budget 40.
            </div>
            <div className="feat-chat">
              Draft ready. Strategy: Prospect Feed. Expect learning for a few days.
            </div>
            <div className="feat-chat is-user">Show the preview.</div>
            <div className="feat-chat">
              Create · Prospect Feed is ready. Approve writes it. Reject leaves campaigns alone.
            </div>
          </div>
          <div className="feat-col is-panel">
            <p className="feat-title">Create · Prospect Feed</p>
            <p className="feat-note">Quiet hair dryer — cold Feed</p>
            <dl className="feat-dl">
              <div>
                <dt>Budget</dt>
                <dd>40.00 $</dd>
              </div>
              <div>
                <dt>Strategy</dt>
                <dd>Cold · Feed</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>9 min</dd>
              </div>
            </dl>
            <div className="feat-actions">
              <span className="feat-btn is-ink">Approve</span>
              <span className="feat-btn is-ghost">Reject</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
