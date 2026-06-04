#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const API_BASE = "https://api.tally.so";
const outputRoot = path.join("outputs", "remaining_49_tally_forecasts_variable_n");

const forms = [
  ["Roofing", "roofing", "RGkqdJ"],
  ["Dental", "dental", "Gx5OKo"],
  ["Dermatology", "dermatology", "ODkxl8"],
  ["HVAC", "hvac", "VLDWjv"],
  ["Pest Control", "pest-control", "PdkZDb"],
  ["Plumbing", "plumbing", "EkMo5N"],
  ["Electrical", "electrical", "rjv8Bv"],
  ["Med Spa", "med-spa", "44zlBO"],
  ["Auto Repair", "auto-repair", "jav8bE"],
  ["Garage Door", "garage-door", "WO1a8J"],
  ["Pool Service", "pool-service", "aQvp29"],
  ["Lawn Care", "lawn-care", "68M6Ze"],
  ["Tree Care", "tree-care", "7RM7NL"],
  ["Home Cleaning", "home-cleaning", "b5v1We"],
  ["Carpet Cleaning", "carpet-cleaning", "A7yMBB"],
  ["Restoration", "restoration", "Bz0Jx7"],
  ["Painting", "painting", "kdv8N6"],
  ["Flooring", "flooring", "vGK8PA"],
  ["Windows and Doors", "windows-and-doors", "KYkrVM"],
  ["Kitchen and Bath Remodeling", "kitchen-and-bath-remodeling", "LZk4PG"],
  ["General Contracting", "general-contracting", "pbvYDV"],
  ["Solar Installation", "solar-installation", "1A6Q9M"],
  ["Security Systems", "security-systems", "MeMjEY"],
  ["Moving", "moving", "J9MEOJ"],
  ["Self Storage", "self-storage", "gDv89N"],
  ["Junk Removal", "junk-removal", "yPz8J0"],
  ["Car Wash and Detailing", "car-wash-and-detailing", "Xxz64O"],
  ["Towing", "towing", "81MbZA"],
  ["Veterinary", "veterinary", "0QaqeZ"],
  ["Physical Therapy", "physical-therapy", "zxL871"],
  ["Chiropractic", "chiropractic", "5BMaZM"],
  ["Senior Home Care", "senior-home-care", "dWvJ9z"],
  ["Childcare", "childcare", "Y5k74q"],
  ["Fitness Gyms", "fitness-gyms", "D4MR7b"],
  ["Restaurants", "restaurants", "lbv865"],
  ["Coffee Shops", "coffee-shops", "RGkqDl"],
  ["Breweries", "breweries", "obv821"],
  ["Hotels", "hotels", "Gx5ORj"],
  ["Event Venues", "event-venues", "ODkx7K"],
  ["Property Management", "property-management", "VLDWza"],
  ["Real Estate Brokerages", "real-estate-brokerages", "PdkZzQ"],
  ["Mortgage Brokers", "mortgage-brokers", "EkMoxo"],
  ["Insurance Agencies", "insurance-agencies", "rjv8oM"],
  ["Accounting and Tax", "accounting-and-tax", "44zlKb"],
  ["Legal Services", "legal-services", "jav8lR"],
  ["IT Managed Services", "it-managed-services", "2E79Kp"],
  ["Digital Marketing Agencies", "digital-marketing-agencies", "xXv8JG"],
  ["Staffing Agencies", "staffing-agencies", "RGkqDp"],
  ["Private Schools and Tutoring", "private-schools-and-tutoring", "obv82X"],
];

const presets = {
  highTicketProject: {
    category: "high-ticket home project",
    frequencyLabel: "one-time/project-based",
    ticketLabel: "very high",
    urgencyLabel: "medium",
    trustLabel: "very high",
    priceLabel: "high",
    recentUse: 0.24,
    futureIntent: 0.38,
    spend: 0.86,
    frequency: 0.18,
    urgency: 0.45,
    trust: 0.86,
    price: 0.73,
    review: 0.84,
    referral: 0.66,
    labor: 0.67,
    season: 0.68,
    recurring: 0.18,
    satisfaction: 0.64,
    switchRisk: 0.43,
    wage: 0.66,
    benefits: 0.43,
    training: 0.58,
    revenue: 0.72,
    employees: 0.55,
    acv: 0.88,
    cac: 0.74,
    growth: 0.53,
    margin: 0.52,
    retention: 0.51,
    competition: 0.70,
    ownerBias: 0.10,
    residential: 0.78,
    urban: 0.22,
    suburban: 0.65,
    rural: 0.13,
  },
  emergencyTrade: {
    category: "urgent home repair",
    frequencyLabel: "emergency/occasional",
    ticketLabel: "mid to high",
    urgencyLabel: "high",
    trustLabel: "high",
    priceLabel: "medium",
    recentUse: 0.47,
    futureIntent: 0.55,
    spend: 0.64,
    frequency: 0.32,
    urgency: 0.88,
    trust: 0.78,
    price: 0.56,
    review: 0.76,
    referral: 0.48,
    labor: 0.72,
    season: 0.46,
    recurring: 0.24,
    satisfaction: 0.67,
    switchRisk: 0.46,
    wage: 0.62,
    benefits: 0.41,
    training: 0.62,
    revenue: 0.58,
    employees: 0.45,
    acv: 0.67,
    cac: 0.57,
    growth: 0.57,
    margin: 0.49,
    retention: 0.50,
    competition: 0.66,
    ownerBias: 0.08,
    residential: 0.82,
    urban: 0.27,
    suburban: 0.60,
    rural: 0.13,
  },
  recurringHome: {
    category: "recurring residential service",
    frequencyLabel: "recurring",
    ticketLabel: "low to mid",
    urgencyLabel: "medium",
    trustLabel: "medium to high",
    priceLabel: "medium",
    recentUse: 0.58,
    futureIntent: 0.64,
    spend: 0.45,
    frequency: 0.73,
    urgency: 0.42,
    trust: 0.64,
    price: 0.58,
    review: 0.68,
    referral: 0.52,
    labor: 0.76,
    season: 0.64,
    recurring: 0.70,
    satisfaction: 0.69,
    switchRisk: 0.49,
    wage: 0.44,
    benefits: 0.30,
    training: 0.44,
    revenue: 0.43,
    employees: 0.50,
    acv: 0.40,
    cac: 0.42,
    growth: 0.54,
    margin: 0.47,
    retention: 0.62,
    competition: 0.74,
    ownerBias: 0.05,
    residential: 0.88,
    urban: 0.26,
    suburban: 0.61,
    rural: 0.13,
  },
  healthcareTrust: {
    category: "clinical/trust-based service",
    frequencyLabel: "recurring/episodic",
    ticketLabel: "mid",
    urgencyLabel: "medium",
    trustLabel: "very high",
    priceLabel: "low to medium",
    recentUse: 0.45,
    futureIntent: 0.50,
    spend: 0.56,
    frequency: 0.55,
    urgency: 0.52,
    trust: 0.92,
    price: 0.42,
    review: 0.82,
    referral: 0.72,
    labor: 0.69,
    season: 0.20,
    recurring: 0.58,
    satisfaction: 0.74,
    switchRisk: 0.31,
    wage: 0.68,
    benefits: 0.70,
    training: 0.78,
    revenue: 0.56,
    employees: 0.50,
    acv: 0.54,
    cac: 0.50,
    growth: 0.48,
    margin: 0.58,
    retention: 0.72,
    competition: 0.61,
    ownerBias: 0.07,
    residential: 0.62,
    urban: 0.38,
    suburban: 0.54,
    rural: 0.08,
  },
  discretionaryLocal: {
    category: "discretionary local consumer service",
    frequencyLabel: "frequent/discretionary",
    ticketLabel: "low to mid",
    urgencyLabel: "low",
    trustLabel: "medium",
    priceLabel: "medium to high",
    recentUse: 0.68,
    futureIntent: 0.66,
    spend: 0.34,
    frequency: 0.82,
    urgency: 0.24,
    trust: 0.48,
    price: 0.62,
    review: 0.82,
    referral: 0.36,
    labor: 0.78,
    season: 0.34,
    recurring: 0.36,
    satisfaction: 0.70,
    switchRisk: 0.60,
    wage: 0.32,
    benefits: 0.26,
    training: 0.36,
    revenue: 0.42,
    employees: 0.56,
    acv: 0.28,
    cac: 0.42,
    growth: 0.52,
    margin: 0.38,
    retention: 0.45,
    competition: 0.83,
    ownerBias: 0.05,
    residential: 0.70,
    urban: 0.42,
    suburban: 0.50,
    rural: 0.08,
  },
  hospitality: {
    category: "hospitality and venue",
    frequencyLabel: "frequent or event-driven",
    ticketLabel: "low to high",
    urgencyLabel: "medium",
    trustLabel: "medium to high",
    priceLabel: "high",
    recentUse: 0.56,
    futureIntent: 0.55,
    spend: 0.48,
    frequency: 0.62,
    urgency: 0.44,
    trust: 0.58,
    price: 0.68,
    review: 0.88,
    referral: 0.38,
    labor: 0.86,
    season: 0.55,
    recurring: 0.24,
    satisfaction: 0.66,
    switchRisk: 0.61,
    wage: 0.35,
    benefits: 0.27,
    training: 0.45,
    revenue: 0.52,
    employees: 0.72,
    acv: 0.45,
    cac: 0.50,
    growth: 0.44,
    margin: 0.34,
    retention: 0.42,
    competition: 0.86,
    ownerBias: 0.06,
    residential: 0.50,
    urban: 0.45,
    suburban: 0.45,
    rural: 0.10,
  },
  professionalTrust: {
    category: "professional advisory service",
    frequencyLabel: "episodic/relationship-based",
    ticketLabel: "mid to high",
    urgencyLabel: "medium",
    trustLabel: "very high",
    priceLabel: "medium",
    recentUse: 0.32,
    futureIntent: 0.37,
    spend: 0.62,
    frequency: 0.38,
    urgency: 0.42,
    trust: 0.93,
    price: 0.47,
    review: 0.66,
    referral: 0.84,
    labor: 0.56,
    season: 0.28,
    recurring: 0.64,
    satisfaction: 0.72,
    switchRisk: 0.29,
    wage: 0.77,
    benefits: 0.74,
    training: 0.72,
    revenue: 0.58,
    employees: 0.34,
    acv: 0.69,
    cac: 0.62,
    growth: 0.47,
    margin: 0.63,
    retention: 0.76,
    competition: 0.58,
    ownerBias: 0.20,
    residential: 0.42,
    urban: 0.44,
    suburban: 0.47,
    rural: 0.09,
  },
  b2bService: {
    category: "B2B operating service",
    frequencyLabel: "recurring/contract-based",
    ticketLabel: "high",
    urgencyLabel: "medium to high",
    trustLabel: "high",
    priceLabel: "medium",
    recentUse: 0.25,
    futureIntent: 0.32,
    spend: 0.72,
    frequency: 0.50,
    urgency: 0.58,
    trust: 0.82,
    price: 0.54,
    review: 0.58,
    referral: 0.76,
    labor: 0.74,
    season: 0.22,
    recurring: 0.78,
    satisfaction: 0.68,
    switchRisk: 0.34,
    wage: 0.72,
    benefits: 0.66,
    training: 0.70,
    revenue: 0.70,
    employees: 0.55,
    acv: 0.78,
    cac: 0.68,
    growth: 0.50,
    margin: 0.55,
    retention: 0.74,
    competition: 0.62,
    ownerBias: 0.22,
    residential: 0.30,
    urban: 0.42,
    suburban: 0.49,
    rural: 0.09,
  },
};

const industryModels = {
  "roofing": ["highTicketProject", { recentUse: 0.33, futureIntent: 0.42, urgency: 0.70, season: 0.82, labor: 0.78, margin: 0.48 }],
  "dental": ["healthcareTrust", { recentUse: 0.62, futureIntent: 0.58, recurring: 0.74, price: 0.36, retention: 0.82, season: 0.12 }],
  "dermatology": ["healthcareTrust", { recentUse: 0.44, futureIntent: 0.50, price: 0.44, spend: 0.64, margin: 0.66, urban: 0.43 }],
  "hvac": ["emergencyTrade", { recentUse: 0.52, futureIntent: 0.63, urgency: 0.90, season: 0.90, recurring: 0.42, labor: 0.79 }],
  "pest-control": ["recurringHome", { recentUse: 0.48, futureIntent: 0.55, urgency: 0.48, recurring: 0.76, spend: 0.36, season: 0.70 }],
  "plumbing": ["emergencyTrade", { recentUse: 0.50, futureIntent: 0.56, urgency: 0.91, recurring: 0.20, labor: 0.74 }],
  "electrical": ["emergencyTrade", { recentUse: 0.37, futureIntent: 0.43, urgency: 0.72, spend: 0.62, trust: 0.84 }],
  "med-spa": ["discretionaryLocal", { recentUse: 0.40, futureIntent: 0.48, trust: 0.78, review: 0.86, price: 0.58, margin: 0.65, urban: 0.50 }],
  "auto-repair": ["emergencyTrade", { recentUse: 0.69, futureIntent: 0.67, urgency: 0.72, spend: 0.50, trust: 0.74, price: 0.60 }],
  "garage-door": ["emergencyTrade", { recentUse: 0.30, futureIntent: 0.36, urgency: 0.86, spend: 0.56, season: 0.25 }],
  "pool-service": ["recurringHome", { recentUse: 0.45, futureIntent: 0.50, recurring: 0.74, season: 0.86, spend: 0.52, suburban: 0.72 }],
  "lawn-care": ["recurringHome", { recentUse: 0.60, futureIntent: 0.66, recurring: 0.82, season: 0.88, price: 0.62 }],
  "tree-care": ["highTicketProject", { recentUse: 0.34, futureIntent: 0.39, urgency: 0.58, season: 0.70, spend: 0.68, recurring: 0.16 }],
  "home-cleaning": ["recurringHome", { recentUse: 0.63, futureIntent: 0.64, frequency: 0.78, trust: 0.72, price: 0.61, retention: 0.64 }],
  "carpet-cleaning": ["recurringHome", { recentUse: 0.30, futureIntent: 0.35, frequency: 0.34, spend: 0.30, urgency: 0.22, season: 0.34 }],
  "restoration": ["emergencyTrade", { recentUse: 0.18, futureIntent: 0.24, urgency: 0.96, spend: 0.86, trust: 0.88, acv: 0.90, season: 0.48 }],
  "painting": ["highTicketProject", { recentUse: 0.31, futureIntent: 0.38, spend: 0.60, price: 0.67, season: 0.74 }],
  "flooring": ["highTicketProject", { recentUse: 0.25, futureIntent: 0.31, spend: 0.74, price: 0.69, season: 0.32 }],
  "windows-and-doors": ["highTicketProject", { recentUse: 0.21, futureIntent: 0.29, spend: 0.82, price: 0.72, urgency: 0.36, season: 0.54 }],
  "kitchen-and-bath-remodeling": ["highTicketProject", { recentUse: 0.17, futureIntent: 0.25, spend: 0.94, price: 0.76, trust: 0.91, acv: 0.95, season: 0.28 }],
  "general-contracting": ["highTicketProject", { recentUse: 0.20, futureIntent: 0.27, spend: 0.92, trust: 0.92, acv: 0.94, recurring: 0.12 }],
  "solar-installation": ["highTicketProject", { recentUse: 0.14, futureIntent: 0.23, spend: 0.96, price: 0.78, trust: 0.88, cac: 0.86, competition: 0.73 }],
  "security-systems": ["recurringHome", { recentUse: 0.29, futureIntent: 0.37, urgency: 0.60, trust: 0.82, recurring: 0.82, spend: 0.58 }],
  "moving": ["highTicketProject", { recentUse: 0.22, futureIntent: 0.25, urgency: 0.66, price: 0.72, review: 0.80, recurring: 0.05, retention: 0.24 }],
  "self-storage": ["recurringHome", { recentUse: 0.32, futureIntent: 0.34, urgency: 0.38, price: 0.64, review: 0.56, recurring: 0.88, labor: 0.34 }],
  "junk-removal": ["emergencyTrade", { recentUse: 0.27, futureIntent: 0.32, urgency: 0.56, spend: 0.34, price: 0.70, recurring: 0.13 }],
  "car-wash-and-detailing": ["discretionaryLocal", { recentUse: 0.73, futureIntent: 0.69, frequency: 0.84, spend: 0.26, trust: 0.42, price: 0.64, season: 0.48 }],
  "towing": ["emergencyTrade", { recentUse: 0.25, futureIntent: 0.29, urgency: 0.98, review: 0.70, trust: 0.66, price: 0.52, retention: 0.20 }],
  "veterinary": ["healthcareTrust", { recentUse: 0.58, futureIntent: 0.58, trust: 0.94, price: 0.46, retention: 0.80, urgency: 0.64 }],
  "physical-therapy": ["healthcareTrust", { recentUse: 0.38, futureIntent: 0.42, frequency: 0.64, referral: 0.80, price: 0.35, retention: 0.70 }],
  "chiropractic": ["healthcareTrust", { recentUse: 0.36, futureIntent: 0.42, frequency: 0.66, price: 0.48, competition: 0.70, review: 0.78 }],
  "senior-home-care": ["healthcareTrust", { recentUse: 0.24, futureIntent: 0.31, trust: 0.97, price: 0.50, labor: 0.88, recurring: 0.86, retention: 0.82 }],
  "childcare": ["healthcareTrust", { recentUse: 0.43, futureIntent: 0.47, trust: 0.98, price: 0.55, labor: 0.86, recurring: 0.90, season: 0.42 }],
  "fitness-gyms": ["discretionaryLocal", { recentUse: 0.56, futureIntent: 0.58, frequency: 0.76, price: 0.67, switchRisk: 0.66, recurring: 0.92, retention: 0.46 }],
  "restaurants": ["discretionaryLocal", { recentUse: 0.83, futureIntent: 0.78, frequency: 0.93, spend: 0.30, review: 0.90, labor: 0.90, margin: 0.30 }],
  "coffee-shops": ["discretionaryLocal", { recentUse: 0.85, futureIntent: 0.79, frequency: 0.95, spend: 0.22, review: 0.86, price: 0.60, margin: 0.34 }],
  "breweries": ["hospitality", { recentUse: 0.47, futureIntent: 0.45, frequency: 0.48, review: 0.84, season: 0.50, margin: 0.36 }],
  "hotels": ["hospitality", { recentUse: 0.54, futureIntent: 0.49, spend: 0.66, review: 0.92, labor: 0.84, season: 0.62 }],
  "event-venues": ["hospitality", { recentUse: 0.24, futureIntent: 0.30, spend: 0.78, trust: 0.74, review: 0.86, season: 0.72, retention: 0.28 }],
  "property-management": ["b2bService", { recentUse: 0.31, futureIntent: 0.34, recurring: 0.90, trust: 0.84, price: 0.48, retention: 0.80 }],
  "real-estate-brokerages": ["professionalTrust", { recentUse: 0.27, futureIntent: 0.25, referral: 0.90, price: 0.52, retention: 0.36, season: 0.48 }],
  "mortgage-brokers": ["professionalTrust", { recentUse: 0.22, futureIntent: 0.23, urgency: 0.58, referral: 0.86, price: 0.44, season: 0.38 }],
  "insurance-agencies": ["professionalTrust", { recentUse: 0.66, futureIntent: 0.53, recurring: 0.94, price: 0.55, retention: 0.84, review: 0.58 }],
  "accounting-and-tax": ["professionalTrust", { recentUse: 0.55, futureIntent: 0.50, season: 0.94, recurring: 0.78, price: 0.43, retention: 0.78 }],
  "legal-services": ["professionalTrust", { recentUse: 0.29, futureIntent: 0.31, urgency: 0.62, trust: 0.96, referral: 0.88, acv: 0.82 }],
  "it-managed-services": ["b2bService", { recentUse: 0.31, futureIntent: 0.34, urgency: 0.78, recurring: 0.92, trust: 0.86, labor: 0.72 }],
  "digital-marketing-agencies": ["b2bService", { recentUse: 0.21, futureIntent: 0.28, price: 0.62, review: 0.52, referral: 0.72, retention: 0.54, competition: 0.82 }],
  "staffing-agencies": ["b2bService", { recentUse: 0.19, futureIntent: 0.25, urgency: 0.76, labor: 0.92, recurring: 0.64, margin: 0.42, retention: 0.58 }],
  "private-schools-and-tutoring": ["healthcareTrust", { recentUse: 0.23, futureIntent: 0.35, trust: 0.94, price: 0.58, season: 0.72, recurring: 0.82, retention: 0.76 }],
};

function requireToken() {
  const token = process.env.TALLY_API_KEY;
  if (!token) throw new Error("Set TALLY_API_KEY before running.");
  return token;
}

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seedText) {
  let a = hashString(seedText);
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function label(value) {
  if (value >= 0.82) return "very high";
  if (value >= 0.64) return "high";
  if (value >= 0.42) return "medium";
  if (value >= 0.24) return "low";
  return "very low";
}

function priorFor(slug) {
  const [presetName, overrides] = industryModels[slug] || ["recurringHome", {}];
  return { ...presets[presetName], ...overrides, presetName };
}

function buildSamples() {
  const usedTotals = new Set();
  const samples = new Map();

  for (const [industryName, slug] of forms) {
    const prior = priorFor(slug);
    const random = rng(`${slug}:variable-sample`);
    let total = 401 + Math.floor(random() * 449);
    while (usedTotals.has(total)) total = 401 + ((total - 401 + 23) % 449);
    usedTotals.add(total);

    let consumerShare = clamp(0.685 - prior.ownerBias * 0.11 + (random() * 2 - 1) * 0.035, 0.62, 0.74);
    let employeeShare = clamp(0.145 + (prior.labor - 0.55) * 0.08 + (random() * 2 - 1) * 0.025, 0.11, 0.20);
    let consumer = Math.round(total * consumerShare);
    let employee = Math.round(total * employeeShare);
    let owner = total - consumer - employee;

    const minOwner = Math.ceil(total * 0.10);
    const maxOwner = Math.floor(total * 0.19);
    const minEmployee = Math.ceil(total * 0.11);
    const maxEmployee = Math.floor(total * 0.20);

    if (employee < minEmployee) {
      consumer -= minEmployee - employee;
      employee = minEmployee;
    } else if (employee > maxEmployee) {
      consumer += employee - maxEmployee;
      employee = maxEmployee;
    }
    owner = total - consumer - employee;
    if (owner < minOwner) {
      consumer -= minOwner - owner;
      owner = minOwner;
    } else if (owner > maxOwner) {
      consumer += owner - maxOwner;
      owner = maxOwner;
    }
    samples.set(slug, { industryName, total, consumer, employee, owner });
  }

  return samples;
}

function branchInfo(sample) {
  return {
    shared: { section: "Shared Screener And Market Profile", n: sample.total },
    consumer: { section: `Consumer Forecast - n=${sample.consumer}`, n: sample.consumer },
    employee: { section: `Employee Forecast - n=${sample.employee}`, n: sample.employee },
    owner: { section: `Owner/Operator Forecast - n=${sample.owner}`, n: sample.owner },
  };
}

function toCsv(rows) {
  const headers = ["section", "question", "denominator_n", "answer", "count", "percent", "value", "notes", "row_type"];
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\r\n") + "\r\n";
}

function pct(count, n) {
  return `${(count / n * 100).toFixed(1)}%`;
}

function addRow(rows, section, question, denominator, answer = "", count = "", percent = "", value = "", notes = "", rowType = "forecast") {
  rows.push({
    section,
    question,
    denominator_n: denominator,
    answer,
    count,
    percent,
    value,
    notes,
    row_type: rowType,
  });
}

function flatTextFromSchema(schema) {
  if (!Array.isArray(schema)) return "";
  const out = [];
  const walk = (value) => {
    if (Array.isArray(value)) {
      if (value.length === 2 && typeof value[0] === "string" && Array.isArray(value[1])) out.push(value[0]);
      else value.forEach(walk);
    } else if (typeof value === "string" && !value.includes("font-weight")) {
      out.push(value);
    }
  };
  walk(schema);
  return out.join("").replace(/\s+/g, " ").trim();
}

function blockText(block) {
  return block.payload?.text || flatTextFromSchema(block.payload?.safeHTMLSchema);
}

async function tally(pathname, token) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${pathname}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "tally-version": "2025-01-15",
        },
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) throw new Error(`GET ${pathname} failed ${response.status}: ${text}`);
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

function parseFormGroups(form) {
  const groups = [];
  let current = null;
  let branch = "shared";
  for (const block of form.blocks || []) {
    const text = blockText(block);
    if (block.type === "TITLE" && block.groupType === "QUESTION") {
      if (/In the last 12 months/i.test(text)) branch = "consumer";
      if (/What is your role/i.test(text)) branch = "employee";
      if (/approximate annual revenue/i.test(text)) branch = "owner";
      if (/Your email/i.test(text)) branch = "final";
      current = { branch, question: text, type: "open", options: [] };
      groups.push(current);
      continue;
    }
    if (!current) continue;
    if (["MULTIPLE_CHOICE_OPTION", "DROPDOWN_OPTION", "CHECKBOX_OPTION"].includes(block.type)) {
      current.options.push(text);
      current.type = block.groupType === "CHECKBOX" ? "multi" : "single";
    } else if (block.type === "LINEAR_SCALE") {
      current.type = "scale";
    }
  }
  return groups.filter((group) => group.branch !== "final");
}

function normalize(weights) {
  const cleaned = weights.map((value) => Math.max(0.01, Number.isFinite(value) ? value : 0.01));
  const total = cleaned.reduce((sum, value) => sum + value, 0);
  return cleaned.map((value) => value / total);
}

function jitterWeights(weights, seedText, maxDelta = 0.14) {
  const random = rng(seedText);
  return normalize(weights.map((weight) => {
    const factor = 1 + (random() * 2 - 1) * maxDelta;
    const additive = (random() * 2 - 1) * 0.018;
    return weight * factor + additive;
  }));
}

function countsFromWeights(weights, n) {
  const probs = normalize(weights);
  const raw = probs.map((p) => p * n);
  const floors = raw.map(Math.floor);
  let remaining = n - floors.reduce((sum, value) => sum + value, 0);
  const order = raw.map((value, i) => ({ i, frac: value - Math.floor(value) })).sort((a, b) => b.frac - a.frac);
  for (let j = 0; j < remaining; j += 1) floors[order[j % order.length].i] += 1;
  return floors;
}

function orderedWeights(optionCount, center, spread = 0.24) {
  const maxIndex = Math.max(1, optionCount - 1);
  return Array.from({ length: optionCount }, (_, i) => {
    const x = i / maxIndex;
    return Math.exp(-((x - center) ** 2) / (2 * spread ** 2));
  });
}

function binaryWeights(options, yesRate, unsureRate = 0.14) {
  const hasUnsure = options.some((option) => /unsure|not sure|maybe/i.test(option));
  if (hasUnsure) {
    const yes = clamp(yesRate, 0.05, 0.86);
    const unsure = clamp(unsureRate, 0.04, 0.30);
    const no = Math.max(0.04, 1 - yes - unsure);
    return options.map((option) => {
      if (/^yes\b/i.test(option)) return yes;
      if (/unsure|not sure|maybe/i.test(option)) return unsure;
      if (/^no\b/i.test(option)) return no;
      return 0.04;
    });
  }
  return options.map((option) => /^yes\b/i.test(option) ? yesRate : 1 - yesRate);
}

function channelWeights(options, prior) {
  return options.map((option) => {
    const o = option.toLowerCase();
    if (/google|search|online/.test(o)) return 0.30 + prior.review * 0.26 + prior.urgency * 0.10;
    if (/referral|friend|family|word/.test(o)) return 0.20 + prior.referral * 0.42 + prior.trust * 0.08;
    if (/social|instagram|facebook|tiktok/.test(o)) return 0.12 + (1 - prior.ticketIndex) * 0.20 + prior.review * 0.06;
    if (/vehicle|sign|yard|truck/.test(o)) return 0.10 + prior.residential * 0.16;
    if (/neighborhood|nextdoor|community/.test(o)) return 0.12 + prior.residential * 0.20;
    if (/insurance|doctor|broker|agent|professional|partner/.test(o)) return 0.16 + prior.referral * 0.34;
    return 0.10;
  });
}

function switchReasonWeights(options, prior) {
  return options.map((option) => {
    const o = option.toLowerCase();
    if (/price|cost|value/.test(o)) return 0.18 + prior.price * 0.44;
    if (/quality|work|outcome|result/.test(o)) return 0.18 + prior.trust * 0.28;
    if (/communication|responsive|follow/.test(o)) return 0.18 + prior.urgency * 0.25;
    if (/schedule|availability|delay|slow|time/.test(o)) return 0.16 + prior.labor * 0.25 + prior.urgency * 0.12;
    if (/moved|need|changed/.test(o)) return 0.11 + (1 - prior.recurring) * 0.10;
    if (/review|referral|better/.test(o)) return 0.12 + prior.review * 0.12 + prior.referral * 0.10;
    return 0.10;
  });
}

function priceReactionWeights(options, prior, increase) {
  const severity = increase === 20 ? 1 : 0.55;
  const stay = clamp(0.42 + prior.trust * 0.16 + prior.urgency * 0.10 - prior.price * 0.38 * severity, 0.05, 0.70);
  const stop = clamp(0.06 + prior.price * 0.18 * severity - prior.urgency * 0.08 - prior.trust * 0.04, 0.02, 0.32);
  const switchProvider = clamp(0.12 + prior.price * 0.30 * severity + prior.switchRisk * 0.12 - prior.trust * 0.08, 0.06, 0.48);
  const shop = Math.max(0.08, 1 - stay - stop - switchProvider);
  return options.map((option) => {
    const o = option.toLowerCase();
    if (/stay|pay/.test(o)) return stay;
    if (/shop|quote|around/.test(o)) return shop;
    if (/switch|change/.test(o)) return switchProvider;
    if (/stop|cancel|pause/.test(o)) return stop;
    return 0.06;
  });
}

function frequencyWeights(options, prior) {
  return options.map((option, i) => {
    const o = option.toLowerCase();
    let weight = 0.10;
    if (/daily|weekly|multiple|several/.test(o)) weight = 0.12 + prior.frequency * 0.48;
    else if (/monthly|every month/.test(o)) weight = 0.16 + prior.frequency * 0.32;
    else if (/quarter|few times/.test(o)) weight = 0.15 + (1 - Math.abs(prior.frequency - 0.48)) * 0.26;
    else if (/annual|year|once/.test(o)) weight = 0.14 + (1 - prior.frequency) * 0.28;
    else if (/one-time|project|emergency|as needed/.test(o)) weight = 0.14 + (1 - prior.recurring) * 0.32 + prior.urgency * 0.12;
    else weight = 0.11 + i * 0.01;
    return weight;
  });
}

function challengeWeights(options, prior) {
  return options.map((option) => {
    const o = option.toLowerCase();
    if (/labor|staff|hiring|employee/.test(o)) return 0.12 + prior.labor * 0.56;
    if (/pricing|margin|profit|cost/.test(o)) return 0.12 + (1 - prior.margin) * 0.42 + prior.price * 0.12;
    if (/competition/.test(o)) return 0.10 + prior.competition * 0.38;
    if (/demand|lead|revenue|growth/.test(o)) return 0.10 + (1 - prior.growth) * 0.34;
    if (/cash|capital|financ/.test(o)) return 0.08 + (1 - prior.margin) * 0.22;
    if (/marketing|acquisition/.test(o)) return 0.10 + prior.cac * 0.28;
    if (/supply|material|inventory/.test(o)) return 0.10 + prior.ticketIndex * 0.18;
    return 0.10;
  });
}

function acquisitionWeights(options, prior) {
  return options.map((option) => {
    const o = option.toLowerCase();
    if (/google|search|seo|local/.test(o)) return 0.18 + prior.review * 0.25 + prior.cac * 0.10;
    if (/referral|word|network/.test(o)) return 0.20 + prior.referral * 0.42;
    if (/repeat|existing|retention/.test(o)) return 0.15 + prior.retention * 0.35 + prior.recurring * 0.14;
    if (/paid|ad|facebook|social/.test(o)) return 0.12 + prior.cac * 0.26 + (1 - prior.referral) * 0.10;
    if (/partner|broker|doctor|insurance|channel/.test(o)) return 0.12 + prior.referral * 0.25 + prior.trust * 0.08;
    return 0.10;
  });
}

function differentiationWeights(options, prior) {
  return options.map((option) => {
    const o = option.toLowerCase();
    if (/quality|outcome|expert|clinical|technical/.test(o)) return 0.15 + prior.trust * 0.34;
    if (/speed|response|availability|emergency/.test(o)) return 0.12 + prior.urgency * 0.34;
    if (/price|affordable|value/.test(o)) return 0.12 + prior.price * 0.28;
    if (/review|reputation|referral|brand/.test(o)) return 0.12 + prior.review * 0.20 + prior.referral * 0.18;
    if (/relationship|service|communication/.test(o)) return 0.12 + prior.retention * 0.25;
    if (/special|niche|custom/.test(o)) return 0.12 + prior.ticketIndex * 0.18;
    return 0.10;
  });
}

function growthPriorityWeights(options, prior) {
  return options.map((option) => {
    const o = option.toLowerCase();
    if (/lead|marketing|customer|acquisition/.test(o)) return 0.14 + prior.cac * 0.34 + (1 - prior.recurring) * 0.12;
    if (/hire|staff|team|training/.test(o)) return 0.13 + prior.labor * 0.40;
    if (/price|margin|profit/.test(o)) return 0.12 + (1 - prior.margin) * 0.34;
    if (/retention|repeat|contract|membership/.test(o)) return 0.12 + prior.recurring * 0.32;
    if (/service|expand|new/.test(o)) return 0.12 + prior.growth * 0.24;
    if (/operation|process|capacity|schedule/.test(o)) return 0.12 + prior.urgency * 0.20 + prior.labor * 0.12;
    return 0.10;
  });
}

function roleWeights(options, prior) {
  return options.map((option, i) => {
    const o = option.toLowerCase();
    if (/field|technician|crew|driver|installer|labor/.test(o)) return 0.18 + prior.labor * 0.36 + prior.urgency * 0.08;
    if (/sales|advisor|consultant|agent|broker/.test(o)) return 0.15 + prior.acv * 0.22 + prior.referral * 0.10;
    if (/clinical|provider|therapist|nurse|teacher|attorney|accountant|engineer|developer/.test(o)) return 0.16 + prior.trust * 0.30 + prior.wage * 0.12;
    if (/admin|office|front|support/.test(o)) return 0.13 + prior.retention * 0.10;
    if (/manager|supervisor|lead/.test(o)) return 0.12 + prior.employees * 0.18;
    return 0.10 + i * 0.01;
  });
}

function benefitsWeights(options, prior) {
  return options.map((option) => {
    const o = option.toLowerCase();
    if (/health|medical|dental|vision/.test(o)) return clamp(0.18 + prior.benefits * 0.62, 0.10, 0.86);
    if (/paid time|pto|vacation/.test(o)) return clamp(0.16 + prior.benefits * 0.54, 0.08, 0.80);
    if (/retirement|401/.test(o)) return clamp(0.10 + prior.benefits * 0.46 + prior.wage * 0.08, 0.05, 0.70);
    if (/bonus|commission|tip/.test(o)) return clamp(0.12 + prior.margin * 0.22 + prior.growth * 0.12, 0.06, 0.62);
    if (/training|education/.test(o)) return clamp(0.12 + prior.training * 0.45, 0.06, 0.72);
    if (/none|no benefits/.test(o)) return clamp(0.38 - prior.benefits * 0.34, 0.08, 0.42);
    return clamp(0.14 + prior.benefits * 0.22, 0.08, 0.58);
  });
}

function servicesWeights(options, prior) {
  return options.map((option, i) => {
    const o = option.toLowerCase();
    if (/maintenance|recurring|membership|contract|management/.test(o)) return clamp(0.20 + prior.recurring * 0.58, 0.12, 0.88);
    if (/repair|emergency|diagnostic|urgent/.test(o)) return clamp(0.18 + prior.urgency * 0.52, 0.10, 0.86);
    if (/installation|replacement|project|remodel|build|construction/.test(o)) return clamp(0.16 + prior.ticketIndex * 0.55, 0.10, 0.84);
    if (/premium|special|custom|advanced|cosmetic/.test(o)) return clamp(0.12 + prior.trust * 0.18 + prior.margin * 0.22, 0.08, 0.68);
    if (/consult|advisory|planning|strategy/.test(o)) return clamp(0.12 + prior.referral * 0.28 + prior.trust * 0.20, 0.08, 0.72);
    return clamp(0.18 + (options.length - i) * 0.025, 0.10, 0.72);
  });
}

function optionWeights(question, options, branch, prior, seedText) {
  const q = question.toLowerCase();
  const enrichedPrior = {
    ...prior,
    ticketIndex: prior.spend,
    healthcareBias: prior.category.includes("clinical") ? 0.75 : 0,
  };

  if (/describe that area/.test(q)) return options.map((option) => {
    const o = option.toLowerCase();
    if (/suburban/.test(o)) return prior.suburban;
    if (/urban/.test(o)) return prior.urban;
    if (/rural/.test(o)) return prior.rural;
    return 0.10;
  });

  if (/optional email|raffle/.test(q)) {
    const optIn = clamp(0.24 + prior.trust * 0.14 + prior.review * 0.08, 0.24, 0.50);
    return options.map((option) => /leave|provide|yes|email/i.test(option) && !/does not|no/i.test(option) ? optIn : 1 - optIn);
  }
  if (/last 12 months|paid for/.test(q)) return binaryWeights(options, prior.recentUse);
  if (/switched .*last 2 years|have you switched/.test(q)) return binaryWeights(options, clamp(0.16 + prior.switchRisk * 0.44 + prior.price * 0.08 - prior.trust * 0.09, 0.12, 0.58));
  if (/plan to raise prices/.test(q)) return binaryWeights(options, clamp(0.30 + (1 - prior.margin) * 0.24 + prior.price * 0.16 + prior.labor * 0.10, 0.26, 0.74), 0.20);

  if (/how did you find/.test(q)) return channelWeights(options, enrichedPrior);
  if (/#1 reason|reason .*switch|consider switching/.test(q)) return switchReasonWeights(options, enrichedPrior);
  if (/10%/.test(q) && /price|raised/.test(q)) return priceReactionWeights(options, enrichedPrior, 10);
  if (/20%/.test(q) && /price|raised/.test(q)) return priceReactionWeights(options, enrichedPrior, 20);
  if (/frequency|how often/.test(q)) return frequencyWeights(options, enrichedPrior);
  if (/what matters|choosing|choose a provider/.test(q)) return differentiationWeights(options, enrichedPrior);
  if (/premium|pay more/.test(q)) return differentiationWeights(options, { ...enrichedPrior, trust: clamp(prior.trust + 0.08, 0, 1) });
  if (/household income/.test(q)) return orderedWeights(options.length, clamp(0.44 + prior.spend * 0.24 - prior.price * 0.07, 0.22, 0.78), 0.28);
  if (/age/.test(q)) return orderedWeights(options.length, clamp(0.42 + prior.trust * 0.10 + enrichedPrior.healthcareBias * 0.12 - (prior.category.includes("discretionary") ? 0.10 : 0), 0.25, 0.72), 0.30);
  if (/spend|spent|annual consumer/.test(q)) return orderedWeights(options.length, clamp(prior.spend, 0.12, 0.92), 0.24);
  if (/outdoor improvement|most likely to pay|next/.test(q) && branch === "consumer") return differentiationWeights(options, enrichedPrior);

  if (/what is your role/.test(q)) return roleWeights(options, enrichedPrior);
  if (/tenure|years.*industry/.test(q)) return orderedWeights(options.length, clamp(0.48 + prior.retention * 0.18 - prior.labor * 0.10, 0.22, 0.78), 0.27);
  if (/reason.*leave|would leave/.test(q)) return challengeWeights(options, { ...enrichedPrior, margin: prior.wage * 0.8, price: prior.price });
  if (/hourly wage|wage/.test(q)) return orderedWeights(options.length, clamp(prior.wage, 0.20, 0.86), 0.25);
  if (/benefits/.test(q)) return benefitsWeights(options, enrichedPrior);
  if (/improve.*job/.test(q)) return challengeWeights(options, { ...enrichedPrior, margin: prior.wage * 0.8, labor: clamp(prior.labor + 0.08, 0, 1) });
  if (/productivity|peak season|limits/.test(q)) return challengeWeights(options, enrichedPrior);

  if (/annual revenue/.test(q)) return orderedWeights(options.length, clamp(prior.revenue, 0.15, 0.92), 0.26);
  if (/employees/.test(q)) return orderedWeights(options.length, clamp(prior.employees, 0.14, 0.88), 0.28);
  if (/services.*offer|services offered/.test(q)) return servicesWeights(options, enrichedPrior);
  if (/share of revenue.*recurring|contract-based|recurring/.test(q)) return orderedWeights(options.length, clamp(prior.recurring, 0.04, 0.94), 0.26);
  if (/average customer|contract value|average.*value/.test(q)) return orderedWeights(options.length, clamp(prior.acv, 0.10, 0.96), 0.24);
  if (/challenge/.test(q)) return challengeWeights(options, enrichedPrior);
  if (/acquisition|customer acquisition|channels/.test(q)) return acquisitionWeights(options, enrichedPrior);
  if (/cost to acquire|cac/.test(q)) return orderedWeights(options.length, clamp(prior.cac, 0.10, 0.88), 0.25);
  if (/revenue change|revenue.*last 12 months|changed/.test(q)) return orderedWeights(options.length, clamp(prior.growth, 0.18, 0.82), 0.26);
  if (/gross margin|margin/.test(q)) return orderedWeights(options.length, clamp(prior.margin, 0.12, 0.88), 0.25);
  if (/retention/.test(q)) return orderedWeights(options.length, clamp(prior.retention, 0.08, 0.92), 0.24);
  if (/new services|being considered/.test(q)) return servicesWeights(options, { ...enrichedPrior, growth: clamp(prior.growth + 0.10, 0, 1) });
  if (/growth priority/.test(q)) return growthPriorityWeights(options, enrichedPrior);
  if (/competitors|competition/.test(q)) return orderedWeights(options.length, clamp(prior.competition, 0.12, 0.92), 0.26);
  if (/differentiation|differentiate/.test(q)) return differentiationWeights(options, enrichedPrior);
  if (/best-margin|best margin/.test(q)) return servicesWeights(options, { ...enrichedPrior, margin: clamp(prior.margin + 0.14, 0, 1) });
  if (/seasonality|seasonal/.test(q)) return orderedWeights(options.length, clamp(prior.season, 0.06, 0.94), 0.26);

  if (options.length >= 3) return jitterWeights(orderedWeights(options.length, 0.48, 0.36), `${seedText}:fallback`, 0.22);
  return Array.from({ length: options.length }, () => 1);
}

function scaleMean(question, branch, prior) {
  const q = question.toLowerCase();
  if (/purchase|pay for/.test(q)) return clamp(2.2 + prior.futureIntent * 7.1, 1.8, 9.4);
  if (/satisfied|satisfaction/.test(q) && branch === "consumer") return clamp(3.8 + prior.satisfaction * 6.1 - prior.urgency * 0.4, 2.5, 9.3);
  if (/switch/.test(q)) return clamp(2.1 + prior.switchRisk * 6.1 + prior.price * 0.8 - prior.trust * 0.5, 1.8, 8.8);
  if (/online reviews|review/.test(q)) return clamp(2.0 + prior.review * 7.4 + prior.trust * 0.4, 2.0, 9.8);
  if (/recommend/.test(q)) return clamp(3.1 + prior.satisfaction * 5.6 + prior.trust * 0.8 - prior.switchRisk * 0.9, 2.2, 9.4);
  if (/job satisfaction|satisfied.*job/.test(q)) return clamp(3.6 + (1 - prior.labor) * 1.2 + prior.wage * 2.0 + prior.benefits * 1.6, 2.8, 8.8);
  if (/leave/.test(q)) return clamp(2.4 + prior.labor * 4.1 + (1 - prior.wage) * 1.2 + (1 - prior.benefits) * 0.9, 2.0, 8.9);
  if (/training/.test(q)) return clamp(3.2 + prior.training * 5.4, 2.4, 9.1);
  return clamp(4.0 + prior.satisfaction * 4.2, 2.2, 9.2);
}

function scaleCounts(question, branch, n, prior, seedText) {
  const mean = scaleMean(question, branch, prior);
  const mids = [1.7, 5.1, 7.5, 9.4];
  const sigma = 1.55 + (prior.price + prior.switchRisk) * 0.55;
  const weights = mids.map((mid) => Math.exp(-((mid - mean) ** 2) / (2 * sigma ** 2)));
  const jittered = jitterWeights(weights, seedText, 0.12);
  const counts = countsFromWeights(jittered, n);
  const predictedMean = counts.reduce((sum, count, i) => sum + count * mids[i], 0) / n;
  return { mean: predictedMean, counts };
}

function addScaleForecast(rows, sections, branch, group, sample, prior, slug, index) {
  const n = sections[branch].n;
  const bands = ["0-3", "4-6", "7-8", "9-10"];
  const { mean, counts } = scaleCounts(group.question, branch, n, prior, `${slug}:scale:${branch}:${index}:${group.question}`);
  addRow(rows, sections[branch].section, group.question, n, "Predicted mean", "", "", `${mean.toFixed(1)} / 10`, "", "metric");
  bands.forEach((answer, i) => addRow(rows, sections[branch].section, group.question, n, answer, counts[i], pct(counts[i], n)));
}

function addSingleForecast(rows, sections, branch, group, sample, prior, slug, index) {
  const n = sections[branch].n;
  const baseWeights = optionWeights(group.question, group.options, branch, prior, `${slug}:${branch}:${index}`);
  const weights = jitterWeights(baseWeights, `${slug}:single:${branch}:${index}:${group.question}`, 0.16);
  const counts = countsFromWeights(weights, n);
  group.options.forEach((answer, i) => addRow(rows, sections[branch].section, group.question, n, answer, counts[i], pct(counts[i], n)));
}

function addMultiForecast(rows, sections, branch, group, sample, prior, slug, index) {
  const n = sections[branch].n;
  const rawRates = optionWeights(group.question, group.options, branch, prior, `${slug}:${branch}:${index}`);
  const maxRaw = Math.max(...rawRates);
  const random = rng(`${slug}:multi:${branch}:${index}:${group.question}`);
  group.options.forEach((answer, i) => {
    const scaled = 0.16 + (rawRates[i] / maxRaw) * 0.52;
    const rate = clamp(scaled + (random() * 2 - 1) * 0.08, 0.08, 0.86);
    const count = Math.round(rate * n);
    addRow(rows, sections[branch].section, `${group.question} - Multi-Select`, n, answer, count, pct(count, n), "", "% selecting; totals can exceed 100%.", "forecast");
  });
}

function addRespondentMix(rows, sections, group, sample) {
  const counts = group.options.map((answer) => {
    if (/consumer/i.test(answer)) return sample.consumer;
    if (/employee/i.test(answer)) return sample.employee;
    if (/owner|executive/i.test(answer)) return sample.owner;
    return 0;
  });
  const missing = sample.total - counts.reduce((sum, value) => sum + value, 0);
  if (missing !== 0 && counts.length) counts[counts.length - 1] += missing;
  group.options.forEach((answer, i) => {
    addRow(rows, sections.shared.section, group.question, sample.total, answer, counts[i], pct(counts[i], sample.total));
  });
}

function addZipProfile(rows, sections, prior, sample) {
  const weights = normalize([prior.suburban, prior.urban, prior.rural]);
  const counts = countsFromWeights(weights, sample.total);
  addRow(rows, sections.shared.section, "ZIP code market profile", sample.total, "Suburban and exurban ZIP codes", counts[0], pct(counts[0], sample.total), "", "ZIP codes are not individually forecast.", "forecast");
  addRow(rows, sections.shared.section, "ZIP code market profile", sample.total, "Urban ZIP codes", counts[1], pct(counts[1], sample.total), "", "ZIP codes are not individually forecast.", "forecast");
  addRow(rows, sections.shared.section, "ZIP code market profile", sample.total, "Rural ZIP codes", counts[2], pct(counts[2], sample.total), "", "ZIP codes are not individually forecast.", "forecast");
}

function addSwitchThemes(rows, sections, sample, prior, slug) {
  const n = Math.max(12, Math.round(sample.consumer * clamp(0.16 + prior.switchRisk * 0.44 + prior.price * 0.08 - prior.trust * 0.09, 0.12, 0.58)));
  const options = [
    "Price increase or poor value",
    "Poor communication or follow-through",
    "Quality, outcome, or trust issue",
    "Scheduling, availability, or response time problem",
    "Needs changed or one-time job ended",
    "Found a provider with stronger referral or reviews",
  ];
  const weights = jitterWeights(switchReasonWeights(options, prior), `${slug}:switch-themes`, 0.14);
  const counts = countsFromWeights(weights, n);
  options.forEach((answer, i) => addRow(rows, sections.consumer.section, "What made switchers switch last time - Themes", n, answer, counts[i], pct(counts[i], n), "", "Forecast themes, not fake verbatim responses.", "forecast"));
}

function addPriorRows(rows, industryName, prior) {
  const section = "Industry Prior Model";
  const dimensions = [
    ["Industry category", prior.category],
    ["Purchase frequency", prior.frequencyLabel],
    ["Average ticket", prior.ticketLabel],
    ["Urgency", prior.urgencyLabel],
    ["Trust requirement", prior.trustLabel],
    ["Price elasticity", prior.priceLabel],
    ["Review importance", label(prior.review)],
    ["Referral dependence", label(prior.referral)],
    ["Labor constraint", label(prior.labor)],
    ["Seasonality", label(prior.season)],
    ["Owner margin pressure", label(1 - prior.margin)],
  ];
  for (const [dimension, value] of dimensions) {
    addRow(rows, section, "Industry prior", "", dimension, "", "", value, `${industryName} forecast is shaped from this prior before random deltas are applied.`, "note");
  }
}

function addNarrative(rows, industryName, prior) {
  const demand = prior.recentUse > 0.70
    ? `${industryName} should show broad recent usage and frequent repeat purchase behavior.`
    : prior.recentUse < 0.25
      ? `${industryName} should show a narrower recent-buyer base, with demand concentrated around trigger events and high-intent projects.`
      : `${industryName} should show moderate demand, with intent shaped by timing, need severity, and local trust signals.`;
  const pricing = prior.price > 0.65
    ? "Pricing power is limited unless the provider can prove quality, speed, risk reduction, or a clearly better outcome."
    : "Pricing power is stronger because trust, continuity, and outcome confidence matter more than the lowest quote.";
  const labor = prior.labor > 0.75
    ? "Labor availability, training, scheduling, and retention should be visible constraints in employee and owner responses."
    : "Labor still matters, but the sharper operator constraints should come from acquisition, retention, differentiation, and margin discipline.";
  const margin = prior.margin < 0.45
    ? "Margin opportunity depends on price architecture, scheduling discipline, mix management, and reducing low-value work."
    : "Margin opportunity should come from premium positioning, better conversion, and holding retention while selectively raising price.";
  const seasonality = prior.season > 0.70
    ? "Seasonality should create clear peaks, staffing strain, and cash-flow planning needs."
    : "Seasonality should be less dominant, so operators can focus more on retention systems and steady pipeline quality.";
  addRow(rows, "Likely Sherlock Report Narrative", "Demand signal", "", "", "", "", "", demand, "narrative");
  addRow(rows, "Likely Sherlock Report Narrative", "Pricing power", "", "", "", "", "", pricing, "narrative");
  addRow(rows, "Likely Sherlock Report Narrative", "Labor risk", "", "", "", "", "", labor, "narrative");
  addRow(rows, "Likely Sherlock Report Narrative", "Margin opportunity", "", "", "", "", "", margin, "narrative");
  addRow(rows, "Likely Sherlock Report Narrative", "Seasonality", "", "", "", "", "", seasonality, "narrative");
  addRow(rows, "Likely Sherlock Report Narrative", "Recommended operator actions", "", "", "", "", "", "Prioritize the two or three constraints surfaced by the forecast before scaling ad spend: conversion quality, proof of trust, workforce capacity, retention, and price packaging.", "narrative");
}

function buildForecast(formMeta, formGroups, industryName, slug, sample) {
  const rows = [];
  const prior = priorFor(slug);
  const sections = branchInfo(sample);
  const groupsByBranch = {
    shared: formGroups.filter((g) => g.branch === "shared"),
    consumer: formGroups.filter((g) => g.branch === "consumer"),
    employee: formGroups.filter((g) => g.branch === "employee"),
    owner: formGroups.filter((g) => g.branch === "owner"),
  };

  addRow(rows, "Assumptions", "Respondent mix", sample.total, "Consumers", sample.consumer, pct(sample.consumer, sample.total));
  addRow(rows, "Assumptions", "Respondent mix", sample.total, "Employees", sample.employee, pct(sample.employee, sample.total));
  addRow(rows, "Assumptions", "Respondent mix", sample.total, "Owners/operators", sample.owner, pct(sample.owner, sample.total));
  addRow(rows, "Assumptions", "Respondent mix", sample.total, "Total completed responses", sample.total, "100.0%");

  addRow(rows, "Form Review", "Form Review", "", "", "", "", "", `Modeled prediction for ${formMeta.url}; this is not collected survey data.`, "note");
  addRow(rows, "Form Review", "Form Review", "", "", "", "", "", `This version uses variable n=${sample.total}, split into n=${sample.consumer} consumers, n=${sample.employee} employees, and n=${sample.owner} owners/operators.`, "note");
  addRow(rows, "Form Review", "Form Review", "", "", "", "", "", "Each industry starts from a distinct economic prior, then receives deterministic bounded random variation.", "note");
  addRow(rows, "Form Review", "Form Review", "", "", "", "", "", "Checkbox questions show % selecting, so totals can exceed 100%; open text is forecast as themes, not fake individual responses.", "note");
  addPriorRows(rows, industryName, prior);

  const sharedRespondent = groupsByBranch.shared.find((g) => /consumer, employee/i.test(g.question));
  if (sharedRespondent) addRespondentMix(rows, sections, sharedRespondent, sample);
  addZipProfile(rows, sections, prior, sample);
  const areaGroup = groupsByBranch.shared.find((g) => /describe that area/i.test(g.question));
  if (areaGroup) addSingleForecast(rows, sections, "shared", areaGroup, sample, prior, slug, 1);
  addSingleForecast(rows, sections, "shared", { question: "Optional Email / Raffle Opt-In", options: ["Leaves email", "Does not leave email"], type: "single" }, sample, prior, slug, 2);

  for (const branch of ["consumer", "employee", "owner"]) {
    let index = 0;
    for (const group of groupsByBranch[branch]) {
      if (/ZIP code/i.test(group.question)) continue;
      if (group.type === "scale") {
        addScaleForecast(rows, sections, branch, group, sample, prior, slug, index);
      } else if (group.options.length >= 2) {
        if (group.type === "multi") addMultiForecast(rows, sections, branch, group, sample, prior, slug, index);
        else addSingleForecast(rows, sections, branch, group, sample, prior, slug, index);
      } else if (/made you switch/i.test(group.question)) {
        addSwitchThemes(rows, sections, sample, prior, slug);
      }
      index += 1;
    }
  }

  addNarrative(rows, industryName, prior);
  return rows;
}

function markdownTable(records) {
  if (!records.length) return "";
  const clean = (value) => String(value || "").replaceAll("|", "/");
  return [
    "| Answer | Count | Share | Value | Notes |",
    "|---|---:|---:|---|---|",
    ...records.map((r) => `| ${clean(r.answer)} | ${clean(r.count)} | ${clean(r.percent)} | ${clean(r.value)} | ${clean(r.notes)} |`),
  ].join("\n");
}

function writeMarkdown(industryName, formId, rows, sample) {
  const sections = [...new Set(rows.map((r) => r.section))];
  const lines = [
    `# ${industryName} Tally Forecast - n=${sample.total} Modeled Responses`,
    "",
    `This is a modeled prediction, not collected survey data. It forecasts likely responses for the live ${industryName} form at \`https://tally.so/r/${formId}\`.`,
    "",
  ];
  for (const section of sections) {
    lines.push(`## ${section}`, "");
    const sectionRows = rows.filter((r) => r.section === section);
    const questions = [...new Set(sectionRows.map((r) => r.question))];
    for (const question of questions) {
      const qRows = sectionRows.filter((r) => r.question === question);
      if (sectionRows.length > 1 || question !== section) lines.push(`### ${question}`, "");
      if (qRows.every((r) => r.row_type === "note" || r.row_type === "narrative")) {
        qRows.forEach((r) => lines.push(`- ${r.answer ? `${r.answer}: ` : ""}${r.value || r.notes}`));
      } else {
        lines.push(markdownTable(qRows), "");
      }
      lines.push("");
    }
  }
  return lines.join("\n").replace(/\n{4,}/g, "\n\n\n");
}

function safeSheetName(name) {
  return name.slice(0, 31).replace(/[\\/?*[\]:]/g, " ");
}

function chartSection(section) {
  if (section.startsWith("Shared")) return "Shared Charts";
  if (section.startsWith("Consumer")) return "Consumer Charts";
  if (section.startsWith("Employee")) return "Employee Charts";
  if (section.startsWith("Owner")) return "Owner Charts";
  return "Other Charts";
}

function addTitle(sheet, title, subtitle = "") {
  sheet.getRange("A1:M1").merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 16 } };
  sheet.getRange("A2:M2").merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange("A2").format = { fill: "#EAF2F8", font: { color: "#17324D", italic: true } };
}

function writeMatrix(sheet, startRow, startCol, matrix) {
  const range = sheet.getRangeByIndexes(startRow, startCol, matrix.length, matrix[0].length);
  range.values = matrix;
  return range;
}

function styleTable(range) {
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2EC" };
  range.format.wrapText = true;
  range.getRow(0).format = { fill: "#D9EAF7", font: { bold: true, color: "#102A43" } };
}

function chartBlocks(rows) {
  const byQuestion = new Map();
  const metrics = new Map();
  for (const row of rows) {
    const key = `${row.section}|||${row.question}`;
    if (row.row_type === "metric") {
      metrics.set(key, `${row.answer}: ${row.value}`);
      continue;
    }
    if (row.row_type !== "forecast" || !row.count || row.answer === "Total completed responses") continue;
    if (!byQuestion.has(key)) byQuestion.set(key, { section: row.section, question: row.question, rows: [] });
    byQuestion.get(key).rows.push({ ...row, percentValue: percentAsDecimal(row.percent) });
  }
  return [...byQuestion.entries()].map(([key, block]) => ({ ...block, metric: metrics.get(key) || "" })).filter((block) => block.rows.length >= 2);
}

function percentAsDecimal(value) {
  const parsed = Number(String(value || "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed / 100 : 0;
}

function addQuestionChart(sheet, block, startRow, chartRow) {
  const title = `${block.question.slice(0, 75)}${block.metric ? ` (${block.metric})` : ""}`;
  const source = writeMatrix(sheet, startRow, 0, [["Answer", "Percent"], ...block.rows.map((r) => [r.answer, r.percentValue])]);
  styleTable(source);
  sheet.getRangeByIndexes(startRow, 0, block.rows.length + 1, 1).format.columnWidthPx = 220;
  sheet.getRangeByIndexes(startRow + 1, 1, block.rows.length, 1).format.numberFormat = "0.0%";
  const chart = sheet.charts.add("bar", source);
  chart.title = title;
  chart.hasLegend = false;
  chart.xAxis = { axisType: "textAxis" };
  chart.yAxis = { numberFormatCode: "0%" };
  chart.setPosition(`D${chartRow}`, `M${chartRow + 15}`);
}

async function writeWorkbook(industryName, rows, outDir, slug, sample, renderPreview = false) {
  const workbook = Workbook.create();
  const blocks = chartBlocks(rows);

  const dashboard = workbook.worksheets.add("Dashboard");
  dashboard.showGridLines = false;
  addTitle(dashboard, `${industryName} Forecast Charts`, `Modeled results for n=${sample.total} responses with industry priors and bounded random deltas.`);
  const kpis = [
    ["Metric", "Value"],
    ["Total responses", sample.total],
    ["Consumers", sample.consumer],
    ["Employees", sample.employee],
    ["Owners/operators", sample.owner],
  ];
  const kpiRange = writeMatrix(dashboard, 4, 0, kpis);
  styleTable(kpiRange);
  dashboard.getRange("A:B").format.columnWidthPx = 185;
  let helperRow = 12;
  const featured = blocks.filter((block) => /consumer, employee|describe that area|purchase|price|challenge|raise prices|paid for/i.test(block.question)).slice(0, 6);
  featured.forEach((block, i) => {
    const source = writeMatrix(dashboard, helperRow, 0, [["Answer", "Percent"], ...block.rows.map((r) => [r.answer, r.percentValue])]);
    styleTable(source);
    dashboard.getRangeByIndexes(helperRow + 1, 1, block.rows.length, 1).format.numberFormat = "0.0%";
    const chart = dashboard.charts.add("bar", source);
    chart.title = block.question.slice(0, 70);
    chart.hasLegend = false;
    chart.xAxis = { axisType: "textAxis" };
    chart.yAxis = { numberFormatCode: "0%" };
    const left = i % 2 === 0 ? "E" : "J";
    const right = i % 2 === 0 ? "I" : "N";
    const row = i < 2 ? 4 : i < 4 ? 22 : 40;
    chart.setPosition(`${left}${row}`, `${right}${row + 14}`);
    helperRow += Math.max(block.rows.length + 2, 7);
  });

  const data = workbook.worksheets.add("Forecast Data");
  data.showGridLines = false;
  const headers = ["section", "question", "denominator_n", "answer", "count", "percent", "value", "notes", "row_type"];
  const sourceRange = writeMatrix(data, 0, 0, [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))]);
  styleTable(sourceRange);
  data.freezePanes.freezeRows(1);
  data.getRange("A:I").format.columnWidthPx = 145;
  data.getRange("B:B").format.columnWidthPx = 260;
  data.getRange("D:D").format.columnWidthPx = 220;
  data.getRange("H:H").format.columnWidthPx = 360;

  const grouped = new Map();
  blocks.forEach((block) => {
    const sheetName = chartSection(block.section);
    if (!grouped.has(sheetName)) grouped.set(sheetName, []);
    grouped.get(sheetName).push(block);
  });
  for (const [sheetName, sheetBlocks] of grouped.entries()) {
    const sheet = workbook.worksheets.add(safeSheetName(sheetName));
    sheet.showGridLines = false;
    addTitle(sheet, sheetName, "Each chart plots modeled respondent percentages; source mini-tables are shown at left.");
    let startRow = 4;
    for (const block of sheetBlocks) {
      addQuestionChart(sheet, block, startRow, startRow + 1);
      startRow += Math.max(18, block.rows.length + 4);
    }
    sheet.getRange("A:B").format.columnWidthPx = 220;
  }

  const notes = workbook.worksheets.add("Notes");
  notes.showGridLines = false;
  addTitle(notes, "Notes", "Forecast interpretation notes.");
  const noteRows = rows.filter((r) => r.row_type === "note" || r.row_type === "narrative").map((r) => [r.section, r.question, r.answer ? `${r.answer}: ${r.value || r.notes}` : r.notes]);
  const notesRange = writeMatrix(notes, 4, 0, [["Section", "Topic", "Note"], ...noteRows]);
  styleTable(notesRange);
  notes.getRange("A:A").format.columnWidthPx = 210;
  notes.getRange("B:B").format.columnWidthPx = 220;
  notes.getRange("C:C").format.columnWidthPx = 620;

  const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 20 } });
  if (!errors.ndjson.includes("matched 0")) throw new Error(errors.ndjson);

  if (renderPreview) {
    const preview = await workbook.render({ sheetName: "Dashboard", autoCrop: "all", scale: 1, format: "png" });
    await fs.writeFile(path.join(outDir, `${slug}_Dashboard.png`), new Uint8Array(await preview.arrayBuffer()));
  }

  const output = await SpreadsheetFile.exportXlsx(workbook);
  const chartsSuffix = process.env.CHARTS_FILENAME_SUFFIX || "";
  await output.save(path.join(outDir, `${slug.toUpperCase()}_TALLY_N${sample.total}_FORECAST${chartsSuffix}_CHARTS.xlsx`));
}

function validateRows(rows, industryName, sample) {
  const issues = [];
  if (!(sample.total > 400 && sample.total < 850)) issues.push(`${industryName}: sample n out of range: ${sample.total}`);
  if (sample.consumer + sample.employee + sample.owner !== sample.total) issues.push(`${industryName}: branch counts do not sum`);

  const groups = new Map();
  for (const row of rows) {
    if (row.row_type !== "forecast") continue;
    if (row.section === "Assumptions") continue;
    if (row.question.includes(" - Multi-Select")) continue;
    if (!row.denominator_n || !row.count) continue;
    if (row.answer === "Total completed responses") continue;
    const key = `${row.section}|||${row.question}|||${row.denominator_n}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  for (const [key, groupRows] of groups.entries()) {
    if (groupRows.length < 2) continue;
    const denominator = Number(groupRows[0].denominator_n);
    const sum = groupRows.reduce((total, row) => total + Number(row.count), 0);
    if (Number.isFinite(denominator) && sum !== denominator) {
      const [, question] = key.split("|||");
      issues.push(`${industryName}: ${question} sums to ${sum}, expected ${denominator}`);
    }
  }
  return issues;
}

async function writeIndex(indexRows, samples) {
  const lines = [
    "# Variable-N Tally Forecast Reports",
    "",
    "Each report models a different completed-response count where n is greater than 400 and less than 850. Each industry starts from a distinct market prior before deterministic bounded random deltas are applied.",
    "",
    "| Industry | Modeled n | Branch split | Public form | Report | Data | Charts |",
    "|---|---:|---|---|---|---|---|",
  ];
  for (const row of indexRows) {
    const sample = samples.get(row.slug);
    lines.push(`| ${row.industryName} | ${sample.total} | C ${sample.consumer} / E ${sample.employee} / O ${sample.owner} | https://tally.so/r/${row.formId} | [Markdown](${row.slug}/${row.mdName}) | [CSV](${row.slug}/${row.csvName}) | [Charts XLSX](${row.slug}/${row.xlsxName}) |`);
  }
  lines.push("");
  await fs.writeFile(path.join(outputRoot, "INDEX.md"), lines.join("\n"), "utf8");
}

async function main() {
  const token = requireToken();
  const samples = buildSamples();
  const start = Number(process.env.BATCH_START || "0");
  const limit = Number(process.env.BATCH_LIMIT || String(forms.length));
  const selected = forms.slice(start, start + limit);
  await fs.mkdir(outputRoot, { recursive: true });
  const indexRows = [];

  for (let i = 0; i < selected.length; i += 1) {
    const [industryName, slug, formId] = selected[i];
    const sample = samples.get(slug);
    const form = await tally(`/forms/${formId}`, token);
    const groups = parseFormGroups(form);
    const rows = buildForecast({ url: `https://tally.so/r/${formId}` }, groups, industryName, slug, sample);
    const validationIssues = validateRows(rows, industryName, sample);
    if (validationIssues.length) throw new Error(validationIssues.slice(0, 10).join("\n"));

    const outDir = path.join(outputRoot, slug);
    await fs.mkdir(outDir, { recursive: true });
    const mdName = `${slug.toUpperCase()}_TALLY_N${sample.total}_FORECAST.md`;
    const csvName = `${slug.toUpperCase()}_TALLY_N${sample.total}_FORECAST.csv`;
    const chartsSuffix = process.env.CHARTS_FILENAME_SUFFIX || "";
    const xlsxName = `${slug.toUpperCase()}_TALLY_N${sample.total}_FORECAST${chartsSuffix}_CHARTS.xlsx`;
    await fs.writeFile(path.join(outDir, mdName), writeMarkdown(industryName, formId, rows, sample), "utf8");
    await fs.writeFile(path.join(outDir, csvName), toCsv(rows), "utf8");
    await writeWorkbook(industryName, rows, outDir, slug, sample, i === 0 && start === 0);
    indexRows.push({ industryName, slug, formId, mdName, csvName, xlsxName });
    console.log(`${start + i + 1}/${forms.length} ${industryName}: n=${sample.total}, forecast, csv, charts`);
  }

  if (start === 0 && selected.length === forms.length) {
    await writeIndex(indexRows, samples);
    console.log(`wrote ${path.join(outputRoot, "INDEX.md")}`);
  } else {
    const batchPath = path.join(outputRoot, `INDEX_${start}_${start + selected.length - 1}.md`);
    const lines = [
      "# Variable-N Tally Forecast Batch",
      "",
      "| Industry | Modeled n | Output folder |",
      "|---|---:|---|",
      ...indexRows.map((row) => `| ${row.industryName} | ${samples.get(row.slug).total} | ${path.join(outputRoot, row.slug).replaceAll("\\", "/")} |`),
      "",
    ];
    await fs.writeFile(batchPath, lines.join("\n"), "utf8");
    console.log(`wrote ${batchPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
