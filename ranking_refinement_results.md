# Conservative Ranking Refinement Results

## Implementation

The scorer no longer includes the startup's own industry and technology fields in the opportunity text. This removes self-matching, which previously made unrelated opportunities appear relevant. It now derives domain-specific signals for healthcare, water, cybersecurity, and manufacturing; requires concrete domain evidence or domain-plus-agency evidence; penalizes explicit semantic mismatches and institution-focused programs; and raises thresholds for Likely Fit and Potential Fit. The design intentionally favors false negatives over false positives.

## Regression tests

Added three ranking tests: healthcare-specific opportunity outranks generic cybersecurity infrastructure; an irrelevant feral-swine program is Probably Not a Fit for a municipal water-loss startup; and a WaterSMART municipal water program remains Likely Fit when domain and agency evidence agree. Type checking, 11 Vitest tests, and the production build pass.

## Live regression results

Healthcare report: https://3000-iv47ex8ltrfwf73vb0r97-0160afbb.us3.manus.computer/report/MzvBxqVUxytZ. Screenshot: /home/ubuntu/screenshots/3000-iv47ex8ltrfwf73_2026-08-15_17-10-09_4299.webp. The report now shows 0 Likely Fit results, with NIH SBIR Phase IIB as the top Potential Fit and healthcare-specific opportunities appearing first. This is conservative and avoids overclaiming; it may be too strict for a startup without prior SBIR Phase II history, but it is safer than promoting unrelated cybersecurity results.

Climate/water report: https://3000-iv47ex8ltrfwf73vb0r97-0160afbb.us3.manus.computer/report/ALaknObd9-1c. Screenshot: /home/ubuntu/screenshots/3000-iv47ex8ltrfwf73_2026-08-15_17-12-04_7466.webp. The report now puts WaterSMART Enhancing Water Resources Projects first as Potential Fit, demotes the unrelated wildland-fire program to Probably Not a Fit, and returns 0 Likely Fit results. This is materially better domain ordering and meets the false-negative preference.
