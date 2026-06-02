(function () {
  "use strict";

  /*
    Product setup:
    - Keep checkout/API keys out of this file. This file is public frontend code.
    - Stripe Payment Links, Payhip product links, and SendOwl checkout links all
      work here. Paste only the public product or checkout URL into checkoutUrl.
    - Product-level URLs win over plan-level URLs.
    - Empty URLs fall back to the contact page, so unfinished products never send buyers to "#".
    - Product segmentation follows:
      industry | quarter/year | access | cityInclusion
  */
  window.SherlockCatalog = {
    supportEmail: "hello@sherlockresearch.com",
    defaultReportSlug: "landscaping",
    plans: {
      single: {
        name: "Standard Report",
        price: "$497",
        unit: "",
        cadence: "one-time",
        checkoutUrl: ""
      },
      quarterly: {
        name: "Quarterly + Coaching",
        price: "$2,000",
        unit: "/yr",
        cadence: "annual",
        checkoutUrl: ""
      },
      all: {
        name: "All-Access Pass",
        price: "$2,997",
        unit: "",
        cadence: "one-time",
        checkoutUrl: ""
      }
    },
    reports: {
      landscaping: {
        name: "Landscaping",
        page: "landscaping-report.html",
        samplePage: "sample.html",
        products: [
          {
            key: "landscaping-2026-q2-redacted-national",
            plan: "sample",
            industry: "Landscaping",
            quarter: "Q2",
            year: 2026,
            access: "redacted",
            cityInclusion: "national",
            title: "Landscaping Industry Report, Q2 2026, Redacted National Sample",
            checkoutUrl: ""
          },
          {
            key: "landscaping-2026-q2-full-national",
            plan: "single",
            industry: "Landscaping",
            quarter: "Q2",
            year: 2026,
            access: "full",
            cityInclusion: "national",
            title: "Landscaping Industry Report, Q2 2026, Full National PDF",
            checkoutUrl: ""
          },
          {
            key: "landscaping-2026-q2-full-quarterly",
            plan: "quarterly",
            industry: "Landscaping",
            quarter: "Q2",
            year: 2026,
            access: "full",
            cityInclusion: "national",
            title: "Landscaping Quarterly Intelligence, Q2 2026",
            checkoutUrl: ""
          }
        ],
        checkout: {
          single: "",
          quarterly: ""
        }
      },
      roofing: {
        name: "Roofing",
        page: "roofing-report.html",
        samplePage: "sample.html",
        products: [
          {
            key: "roofing-2026-q2-full-national",
            plan: "single",
            industry: "Roofing",
            quarter: "Q2",
            year: 2026,
            access: "full",
            cityInclusion: "national",
            title: "Roofing Industry Report, Q2 2026, Full National PDF",
            checkoutUrl: ""
          }
        ],
        checkout: {
          single: "",
          quarterly: ""
        }
      },
      "pest-control": {
        name: "Pest Control",
        page: "pest-control-report.html",
        samplePage: "sample.html",
        products: [
          {
            key: "pest-control-2026-q2-full-national",
            plan: "single",
            industry: "Pest Control",
            quarter: "Q2",
            year: 2026,
            access: "full",
            cityInclusion: "national",
            title: "Pest Control Industry Report, Q2 2026, Full National PDF",
            checkoutUrl: ""
          }
        ],
        checkout: {
          single: "",
          quarterly: ""
        }
      },
      hvac: {
        name: "HVAC",
        page: "hvac-report.html",
        samplePage: "sample.html",
        products: [
          {
            key: "hvac-2026-q2-full-national",
            plan: "single",
            industry: "HVAC",
            quarter: "Q2",
            year: 2026,
            access: "full",
            cityInclusion: "national",
            title: "HVAC Industry Report, Q2 2026, Full National PDF",
            checkoutUrl: ""
          }
        ],
        checkout: {
          single: "",
          quarterly: ""
        }
      }
    }
  };
})();
