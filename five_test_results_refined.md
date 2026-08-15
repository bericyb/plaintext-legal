# Refined Five-Case Challenge Rerun

Run date: 2026-08-15 after conservative domain-aware ranking changes.

| Case | Report URL | Screenshot | Updated result |
|---|---|---|---|
| AI healthcare | https://3000-iv47ex8ltrfwf73vb0r97-0160afbb.us3.manus.computer/report/ehZN0KJw_vwn | /home/ubuntu/screenshots/3000-iv47ex8ltrfwf73_2026-08-15_17-16-26_4479.webp | 7 opportunities; 1 Likely Fit. Top result is NIH Research Grants in Clinical Informatics, score 76. Healthcare-specific ordering is now correct and unrelated cybersecurity is absent from the top results.
| Advanced manufacturing / aerospace | https://3000-iv47ex8ltrfwf73vb0r97-0160afbb.us3.manus.computer/report/uM_uuM0mjqEL | /home/ubuntu/screenshots/3000-iv47ex8ltrfwf73_2026-08-15_17-18-23_2643.webp | 7 opportunities; 0 Likely Fit; 2 Potential Fit. Top result is DOE Genesis Mission: Transforming Science and Energy with AI, score 72, followed by NSF Advanced Manufacturing. The engine is conservative and no longer overstates aerospace fit.
| Climate / water | https://3000-iv47ex8ltrfwf73vb0r97-0160afbb.us3.manus.computer/report/0sO9VjubFwFT | /home/ubuntu/screenshots/3000-iv47ex8ltrfwf73_2026-08-15_17-20-22_2282.webp | 7 opportunities; 0 Likely Fit; 1 Adjacent. Top result is NSF Engineering for Civil Infrastructure, score 48. Wildland-fire and unrelated programs are Probably Not a Fit; the prior feral-swine false positive is no longer present.
| Cybersecurity | https://3000-iv47ex8ltrfwf73vb0r97-0160afbb.us3.manus.computer/report/DxN0UTqQCS3N | /home/ubuntu/screenshots/3000-iv47ex8ltrfwf73_2026-08-15_17-22-18_1472.webp | 7 opportunities; 0 Likely Fit; 1 Potential Fit. The top result is an Indonesia supply-chain workshop, score 63, while multiple cybersecurity programs are Probably Not a Fit. This shows the new scorer is conservative but still has a cross-domain ranking issue for cybersecurity.
| Consumer / workforce technology | https://3000-iv47ex8ltrfwf73vb0r97-0160afbb.us3.manus.computer/report/_jz-N_rkxtlN | /home/ubuntu/screenshots/3000-iv47afbb.us3.manus.computer_17-24-17_1288.webp | 7 opportunities; 0 Likely Fit; all visible ranked opportunities are Probably Not a Fit. The top result is a 2018 NASA university/MUREP program, score 11. This is a materially better honest weak-fit outcome, though stale historical results should ideally be filtered out.

## Overall assessment

The refined scorer materially improves healthcare, water, and consumer/workforce behavior by reducing overclaiming and demoting semantic mismatches. The remaining issue is that cybersecurity can still surface a foreign supply-chain workshop above more relevant cybersecurity programs, suggesting the cybersecurity signal vocabulary and foreign-program penalty need another iteration. Manufacturing is also conservative, with no Likely Fit results despite relevant Potential Fit opportunities.
