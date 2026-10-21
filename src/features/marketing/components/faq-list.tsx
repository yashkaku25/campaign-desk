"use client";

import { useState } from "react";

const items = [
  {
    q: "Does Simulation spend real money?",
    a: "No. Simulation explores how your ad might perform. The estimate can be wrong, and no money is spent.",
  },
  {
    q: "Where do the real numbers come from?",
    a: "Your Google Sheet. Sync brings spend, clicks, and results onto the desk.",
  },
  {
    q: "Can Chat change a campaign by itself?",
    a: "No. Chat only makes a preview. Nothing is saved until you Approve.",
  },
  {
    q: "What if I do not know what to test?",
    a: "Ask for strategies in Chat. It suggests different tests from your desk and sheet, and can draft a create preview for you to Approve.",
  },
  {
    q: "Is my sheet private?",
    a: "You connect your own Google Sheet. Secrets stay on the server. Campaign writes go through Approve only.",
  },
] as const;

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="landing-faq-list">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q} className="landing-faq-item">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
              id={`faq-question-${index}`}
              onClick={() => setOpen(isOpen ? null : index)}
            >
              <span>{item.q}</span>
              <span className="landing-faq-mark" aria-hidden="true">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={!isOpen}><p>{item.a}</p></div>
          </div>
        );
      })}
    </div>
  );
}

