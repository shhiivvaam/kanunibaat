CREATE TABLE "research_judgment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"court" text NOT NULL,
	"decision_at" timestamp with time zone,
	"citation" text NOT NULL,
	"summary_excerpt" text DEFAULT '' NOT NULL,
	"body_for_search" text DEFAULT '' NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_central_act" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"short_title" text NOT NULL,
	"category" text NOT NULL,
	"year" integer,
	"source_url" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "research_central_act_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "research_statute_crosswalk" (
	"source_statute" text NOT NULL,
	"source_section" text NOT NULL,
	"target_statute" text NOT NULL,
	"target_section" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "research_statute_crosswalk_pkey" PRIMARY KEY("source_statute","source_section","target_statute")
);
--> statement-breakpoint
CREATE INDEX "research_judgment_citation_idx" ON "research_judgment" USING btree ("citation");
--> statement-breakpoint
CREATE INDEX "research_central_act_category_idx" ON "research_central_act" USING btree ("category");

INSERT INTO "research_judgment" ("id", "title", "court", "decision_at", "citation", "summary_excerpt", "body_for_search", "topics") VALUES
('44c0ffee-bbab-4144-8ddd-001122334401', 'Kesavananda Bharati v. State of Kerala', 'Supreme Court of India', '1973-04-24', 'AIR 1973 SC 1461', 'Basic structure doctrine; Parliament''s amending power is not unlimited.', 'Constitution amendment power basic structure fundamental rights separation of powers judicial review', '["constitutional","basic structure"]'::jsonb),
('44c0ffee-bbab-4144-8ddd-001122334402', 'Vishaka v. State of Rajasthan', 'Supreme Court of India', '1997-08-13', 'AIR 1997 SC 3011', 'Guidelines on workplace sexual harassment until legislation enacted.', 'sexual harassment workplace women employer guidelines preventive measures POSH', '["labour","women","POSH"]'::jsonb),
('44c0ffee-bbab-4144-8ddd-001122334403', 'Justice K.S. Puttaswamy v. Union of India', 'Supreme Court of India', '2017-08-24', '(2017) 10 SCC 1', 'Right to privacy held a fundamental right under the Constitution.', 'privacy dignity autonomy informational self-determination Aadhaar proportionality', '["privacy","fundamental rights"]'::jsonb),
('44c0ffee-bbab-4144-8ddd-001122334404', 'M.C. Mehta v. Union of India (Oleum Gas)', 'Supreme Court of India', '1986-12-20', 'AIR 1987 SC 965', 'Absolute liability for hazardous industries; enterprise liability.', 'absolute liability hazardous industry environment tort strict liability', '["environment","tort"]'::jsonb);

INSERT INTO "research_central_act" ("id", "slug", "short_title", "category", "year", "source_url", "description") VALUES
('55d0ffee-bbab-4144-8ddd-001122334401', 'bharatiya-nyaya-sanhita-2023', 'Bharatiya Nyaya Sanhita, 2023', 'criminal', 2023, 'https://www.indiacode.nic.in/', 'Replaces substantial parts of the Indian Penal Code, 1860.'),
('55d0ffee-bbab-4144-8ddd-001122334402', 'bharatiya-nagrik-suraksha-sanhita-2023', 'Bharatiya Nagarik Suraksha Sanhita, 2023', 'criminal_procedure', 2023, 'https://www.indiacode.nic.in/', 'Replaces the Code of Criminal Procedure, 1973.'),
('55d0ffee-bbab-4144-8ddd-001122334403', 'bharatiya-sakshya-adhiniyam-2023', 'Bharatiya Sakshya Adhiniyam, 2023', 'evidence', 2023, 'https://www.indiacode.nic.in/', 'Replaces the Indian Evidence Act, 1872.'),
('55d0ffee-bbab-4144-8ddd-001122334404', 'ipc-1860', 'Indian Penal Code, 1860', 'criminal', 1860, 'https://www.indiacode.nic.in/', 'Substantive criminal law (being superseded by BNS in stages).'),
('55d0ffee-bbab-4144-8ddd-001122334405', 'crpc-1973', 'Code of Criminal Procedure, 1973', 'criminal_procedure', 1973, 'https://www.indiacode.nic.in/', 'Procedure for investigation and trial (being superseded by BNSS).'),
('55d0ffee-bbab-4144-8ddd-001122334406', 'cpc-1908', 'Code of Civil Procedure, 1908', 'civil_procedure', 1908, 'https://www.indiacode.nic.in/', 'Civil suits, appeals, and execution.'),
('55d0ffee-bbab-4144-8ddd-001122334407', 'contract-act-1872', 'Indian Contract Act, 1872', 'commercial', 1872, 'https://www.indiacode.nic.in/', 'Formation and discharge of contracts.'),
('55d0ffee-bbab-4144-8ddd-001122334408', 'companies-act-2013', 'Companies Act, 2013', 'corporate', 2013, 'https://www.indiacode.nic.in/', 'Incorporation, governance, and winding up of companies.'),
('55d0ffee-bbab-4144-8ddd-001122334409', 'negotiable-instruments-1881', 'Negotiable Instruments Act, 1881', 'commercial', 1881, 'https://www.indiacode.nic.in/', 'Cheques, promissory notes, and bills of exchange.'),
('55d0ffee-bbab-4144-8ddd-001122334410', 'transfer-of-property-1882', 'Transfer of Property Act, 1882', 'property', 1882, 'https://www.indiacode.nic.in/', 'Sale, mortgage, lease, and gift of immovable property.'),
('55d0ffee-bbab-4144-8ddd-001122334411', 'hindu-marriage-act-1955', 'Hindu Marriage Act, 1955', 'family', 1955, 'https://www.indiacode.nic.in/', 'Marriage, restitution, and matrimonial remedies.'),
('55d0ffee-bbab-4144-8ddd-001122334412', 'special-marriage-act-1954', 'Special Marriage Act, 1954', 'family', 1954, 'https://www.indiacode.nic.in/', 'Civil marriages irrespective of religion.'),
('55d0ffee-bbab-4144-8ddd-001122334413', 'domestic-violence-act-2005', 'Protection of Women from Domestic Violence Act, 2005', 'family', 2005, 'https://www.indiacode.nic.in/', 'Protection orders and reliefs for aggrieved persons.'),
('55d0ffee-bbab-4144-8ddd-001122334414', 'rti-act-2005', 'Right to Information Act, 2005', 'governance', 2005, 'https://www.indiacode.nic.in/', 'Access to information held by public authorities.'),
('55d0ffee-bbab-4144-8ddd-001122334415', 'consumer-protection-2019', 'Consumer Protection Act, 2019', 'consumer', 2019, 'https://www.indiacode.nic.in/', 'Consumer rights, commissions, and product liability.'),
('55d0ffee-bbab-4144-8ddd-001122334416', 'it-act-2000', 'Information Technology Act, 2000', 'technology', 2000, 'https://www.indiacode.nic.in/', 'Electronic records, digital signatures, and cyber offences.');

INSERT INTO "research_statute_crosswalk" ("source_statute", "source_section", "target_statute", "target_section", "note") VALUES
('IPC', '302', 'BNS', '103', 'Illustrative mapping; verify with official Gazette / conversion tables.'),
('IPC', '304', 'BNS', '105', 'Illustrative.'),
('IPC', '307', 'BNS', '109', 'Illustrative.'),
('IPC', '323', 'BNS', '118', 'Illustrative.'),
('IPC', '354', 'BNS', '78', 'Illustrative.'),
('IPC', '376', 'BNS', '64', 'Illustrative.'),
('IPC', '420', 'BNS', '318', 'Illustrative.'),
('IPC', '499', 'BNS', '356', 'Illustrative.'),
('IPC', '500', 'BNS', '357', 'Illustrative.'),
('CrPC', '41', 'BNSS', '35', 'Illustrative.'),
('CrPC', '125', 'BNSS', '144', 'Illustrative.'),
('CrPC', '154', 'BNSS', '173', 'Illustrative.'),
('CrPC', '439', 'BNSS', '483', 'Illustrative.'),
('IEA', '3', 'BSA', '57', 'Illustrative; BSA replaces IEA.'),
('IEA', '65B', 'BSA', '63', 'Illustrative.');
