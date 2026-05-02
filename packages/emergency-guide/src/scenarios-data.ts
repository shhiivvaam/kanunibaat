import type { ContextQuestion, EmergencyScenario, GuideSections } from './types';

function g(partial: GuideSections): GuideSections {
  return partial;
}

function q(id: string, labelEn: string, labelHi: string, required = true): ContextQuestion {
  return { id, labelEn, labelHi, required };
}

/** Phase 1 — 20 core scenarios (Module 3.2). Content is general information; not case-specific advice. */
export const EMERGENCY_SCENARIOS: readonly EmergencyScenario[] = [
  {
    slug: 'legal-notice',
    urgency: 'serious',
    titleEn: 'Received a legal notice',
    titleHi: 'कानूनी नोटिस मिला',
    lawyerSearchHint: 'civil litigation notice reply',
    contextQuestions: [
      q('notice_type', 'What kind of notice is it?', 'यह किस प्रकार का नोटिस है?', true),
      q(
        'deadline',
        'Is there a reply deadline mentioned?',
        'क्या जवाब देने की तारीख लिखी है?',
        true,
      ),
      q(
        'sender',
        'Who sent it (advocate / company / authority)?',
        'किसने भेजा (वकील / कंपनी / विभाग)?',
        false,
      ),
    ],
    base: g({
      rightNow: [
        'Read the notice calmly end-to-end; note dates and demands.',
        'Make a copy (scan + print) and note the mode of service.',
        'Do not ignore deadlines — missing a deadline can weaken your position.',
      ],
      rights: [
        'You generally have the right to understand what is alleged and what is demanded.',
        'You can seek legal help before replying; replies are often prepared by advocates.',
      ],
      documents: [
        'The notice and envelope / email trail',
        'Contracts, messages, or payment proofs related to the dispute',
        'Identity and address proof',
      ],
      whatNotToDo: [
        'Do not verbally abuse the sender or destroy evidence.',
        'Do not sign undertakings or settlements under pressure without understanding them.',
      ],
      policeOrCourt: [
        'Police: usually not the first step for a civil demand notice unless a cognizable offence is involved.',
        'Court: follow timelines in court summons; consult an advocate for filing/defence.',
      ],
      timeline: [
        'Same day: preserve documents and list facts chronologically.',
        'Within days: consult an advocate if a deadline is near.',
      ],
      applicableLaws: [
        'Depends on notice type — contract law, CPC for civil suits, specific statutes named in the notice.',
      ],
    }),
  },
  {
    slug: 'road-accident',
    urgency: 'urgent',
    titleEn: 'Road accident',
    titleHi: 'सड़क दुर्घटना',
    lawyerSearchHint: 'motor accident insurance motor vehicles',
    contextQuestions: [
      q('injuries', 'Were there injuries? How serious?', 'क्या चोटें आईं? कितनी गंभीर?', true),
      q('fir', 'Was an FIR registered?', 'क्या FIR दर्ज हुई?', true),
      q(
        'insurance',
        'Do you have insurance details (self / other party)?',
        'बीमा विवरण है?',
        false,
      ),
    ],
    base: g({
      rightNow: [
        'Ensure safety: move to a safe spot if possible; call emergency medical help if needed.',
        'Note vehicle numbers, photos of scene, and witness contacts if safe to collect.',
        'Inform insurance as per policy timelines.',
      ],
      rights: [
        'You may have rights to medical care and to file/obtain a copy of an FIR where applicable.',
        'Insurance and compensation paths depend on facts and policy terms.',
      ],
      documents: [
        'Driving licence, RC, insurance policy',
        'Photos, medical papers, FIR copy if any',
        'Repair estimates',
      ],
      whatNotToDo: [
        'Do not flee the scene (hit-and-run has serious consequences).',
        'Do not admit fault in writing or under pressure without legal guidance.',
      ],
      policeOrCourt: [
        'Police may record the incident; cooperate with factual information.',
        'Claims and disputes may go to tribunals/courts depending on severity and insurance.',
      ],
      timeline: ['Immediate: medical needs first.', 'Soon: notify insurer and preserve evidence.'],
      applicableLaws: [
        'Motor Vehicles Act and related rules; insurance contract terms; IPC/BNS provisions if injuries/death.',
      ],
    }),
  },
  {
    slug: 'police-arrest',
    urgency: 'urgent',
    titleEn: 'Arrested or detained by police',
    titleHi: 'पुलिस द्वारा गिरफ्तारी या हिरासत',
    lawyerSearchHint: 'criminal bail police custody',
    contextQuestions: [
      q('where', 'Where are you / is the person held?', 'कहाँ रखा गया है?', true),
      q('offence', 'What offence was mentioned (if known)?', 'कौन सा अपराध बताया गया?', false),
      q(
        'legal_help',
        'Has a lawyer or family been informed?',
        'क्या वकील या परिवार को सूचित किया गया?',
        true,
      ),
    ],
    base: g({
      rightNow: [
        'If there is immediate danger to life, call emergency services.',
        'Family should locate the police station and ask for grounds of detention/arrest as permitted by law.',
        'Engage a criminal lawyer urgently for remand/bail steps.',
      ],
      rights: [
        'Rights on arrest and legal representation are governed by law; insist on procedure being followed.',
        'Do not assume you must answer every question without a lawyer — follow lawyer advice.',
      ],
      documents: [
        'ID proofs, address proof',
        'Any papers shown by police',
        'Medical prescriptions if health issues',
      ],
      whatNotToDo: [
        'Do not obstruct lawful police duties or tamper with evidence.',
        'Do not sign blank papers or confessions under coercion.',
      ],
      policeOrCourt: [
        'Police: procedural steps for arrest, custody, and production before a magistrate.',
        'Court: bail and trial processes — advocate-led.',
      ],
      timeline: [
        'First hours: locate person and engage counsel.',
        'Early days: remand/bail hearings may be time-sensitive.',
      ],
      applicableLaws: [
        'CrPC/BNSS procedures; constitutional protections; specific offence sections if alleged.',
      ],
    }),
  },
  {
    slug: 'domestic-violence',
    urgency: 'urgent',
    titleEn: 'Domestic violence or harassment',
    titleHi: 'घरेलू हिंसा या उत्पीड़न',
    lawyerSearchHint: 'family domestic violence protection women',
    contextQuestions: [
      q('safe', 'Are you in a safe place right now?', 'क्या आप अभी सुरक्षित स्थान पर हैं?', true),
      q('children', 'Are children involved?', 'क्या बच्चे शामिल हैं?', true),
      q(
        'help',
        'Do you need emergency shelter / helpline?',
        'क्या आपको आश्रय / हेल्पलाइन चाहिए?',
        true,
      ),
    ],
    base: g({
      rightNow: [
        'If in immediate danger, move to safety and call national helpline 1091 (women) / police 100.',
        'Preserve evidence: messages, photos of injuries (medically documented), threats.',
        'Contact a trusted person and a family-law advocate.',
      ],
      rights: [
        'Protection orders and police help may be available depending on facts and law.',
        'You have dignity and safety rights; procedures vary by statute used.',
      ],
      documents: [
        'Medical records, photos (where appropriate)',
        'Threat messages, call logs',
        'Marriage / ID documents if relevant',
      ],
      whatNotToDo: [
        'Do not retaliate with violence or illegal recordings where law restricts them.',
        'Do not isolate children unlawfully — take legal advice.',
      ],
      policeOrCourt: [
        'Police can be approached for protection; follow advocate guidance for complaints/orders.',
        'Courts may grant protection/restraining relief depending on jurisdiction and facts.',
      ],
      timeline: ['Immediate: safety first.', 'Soon: legal steps with documented evidence.'],
      applicableLaws: [
        'Protection of Women from Domestic Violence Act and related provisions; IPC/BNS where applicable.',
      ],
    }),
  },
  {
    slug: 'cheque-bounce',
    urgency: 'serious',
    titleEn: 'Cheque bounce or financial fraud',
    titleHi: 'चेक बाउंस या वित्तीय धोखाधड़ी',
    lawyerSearchHint: 'NI Act cheque dishonour civil recovery',
    contextQuestions: [
      q('cheque', 'Was a cheque dishonoured (yes/no)?', 'क्या चेक डिसऑनर हुआ?', true),
      q('amount', 'Approximate amount involved?', 'लगभग राशि?', false),
      q(
        'notice_138',
        'Did you receive/send a legal notice under NI Act?',
        'क्या NI अधिनियम की नोटिस मिली/भेजी?',
        false,
      ),
    ],
    base: g({
      rightNow: [
        'Collect cheque copy, dishonour memo, and bank statements.',
        'Understand limitation periods for legal notices under the Negotiable Instruments Act where applicable.',
        'Consult an advocate for civil recovery and/or NI Act process.',
      ],
      rights: [
        'Payee may have remedies for dishonour; drawer has defences depending on facts.',
        'Fraud may involve separate criminal processes — only police/prosecution can pursue.',
      ],
      documents: ['Cheque, dishonour memo', 'Ledger / agreement proving debt', 'Correspondence'],
      whatNotToDo: [
        'Do not issue threats of violence for recovery.',
        'Do not forge documents to prove debt.',
      ],
      policeOrCourt: [
        'Police for fraud/forgery complaints where cognizable.',
        'Courts for NI complaints and civil suits as advised.',
      ],
      timeline: ['NI Act: strict timelines for notice and complaint — act quickly with a lawyer.'],
      applicableLaws: [
        'Negotiable Instruments Act, 1881; Indian Contract Act; IPC/BNS for fraud where relevant.',
      ],
    }),
  },
  {
    slug: 'property-dispute',
    urgency: 'serious',
    titleEn: 'Property or land dispute',
    titleHi: 'संपत्ति या जमीन विवाद',
    lawyerSearchHint: 'property civil land title dispute',
    contextQuestions: [
      q(
        'title',
        'Do you have sale deed / title documents?',
        'क्या बिक्री पत्र / टाइटल दस्तावेज हैं?',
        true,
      ),
      q('possession', 'Who is in possession now?', 'अभी कब्जा किसके पास है?', true),
      q('court', 'Is there already a court case?', 'क्या पहले से कोर्ट केस है?', false),
    ],
    base: g({
      rightNow: [
        'Do not take law into your own hands (forceful possession is risky).',
        'Collect chain-of-title documents and revenue records.',
        'Consult a property lawyer before any settlement.',
      ],
      rights: [
        'Title and possession disputes are fact-heavy; rights depend on documents and local records.',
      ],
      documents: [
        'Sale deeds, gift wills, partition deeds',
        'Khata / mutation / survey maps as applicable',
        'Tax receipts',
      ],
      whatNotToDo: ['Avoid self-help evictions or breaking locks without legal process.'],
      policeOrCourt: [
        'Police may intervene in specific offences; civil disputes usually go to civil courts.',
      ],
      timeline: ['Civil suits and injunctions can take time — plan with your advocate.'],
      applicableLaws: [
        'Transfer of Property Act; state revenue laws; CPC procedures; specific local statutes.',
      ],
    }),
  },
  {
    slug: 'unpaid-salary',
    urgency: 'serious',
    titleEn: 'Employer not paying salary',
    titleHi: 'नियोक्ता वेतन नहीं दे रहा',
    lawyerSearchHint: 'labour employment salary recovery',
    contextQuestions: [
      q('employment', 'Are you on payroll / contract?', 'क्या पेरोल / कॉन्ट्रैक्ट है?', true),
      q('months', 'How many months unpaid?', 'कितने महीने बकाया?', true),
      q('written', 'Any written offer / payslips?', 'क्या लिखित ऑफर / पेस्लिप है?', false),
    ],
    base: g({
      rightNow: [
        'Gather payslips, bank credits, emails, and appointment letters.',
        'Raise written demand to HR / management.',
        'Explore labour department / industrial tribunal routes with a lawyer.',
      ],
      rights: [
        'Statutory and contractual rights depend on establishment type (factory, shop, IT firm, etc.).',
      ],
      documents: [
        'Employment contract, offer letter',
        'Payslips, attendance, resignation/termination letters',
      ],
      whatNotToDo: [
        'Do not delete work emails that are evidence.',
        'Do not damage employer property — it hurts your case.',
      ],
      policeOrCourt: [
        'Usually labour forums; criminal law only if specific offences like wrongful confinement are alleged with facts.',
      ],
      timeline: ['Many forums have limitation periods — consult quickly.'],
      applicableLaws: [
        'Industrial Disputes Act; state Shops Act; Payment of Wages Act; contract law.',
      ],
    }),
  },
  {
    slug: 'consumer-fraud',
    urgency: 'serious',
    titleEn: 'Consumer product or service fraud',
    titleHi: 'उपभोक्ता धोखाधड़ी',
    lawyerSearchHint: 'consumer forum defective service',
    contextQuestions: [
      q('seller', 'Who is the seller / service provider?', 'विक्रेता कौन?', true),
      q('proof', 'Do you have bills and warranty?', 'बिल और वारंटी है?', true),
      q('amount', 'Amount paid?', 'कितनी राशि?', false),
    ],
    base: g({
      rightNow: [
        'Preserve invoices, warranty cards, packaging, and communication.',
        'File a structured written complaint to the company first (recorded).',
        'Consider consumer commission with lawyer help for larger disputes.',
      ],
      rights: ['Consumer protection remedies exist for defects/deficiency; timelines apply.'],
      documents: ['Invoices, warranty, photos/videos of defect', 'Emails to support'],
      whatNotToDo: ['Do not make false public allegations — stick to facts.'],
      policeOrCourt: [
        'Police for cheating only with strong evidence; consumer forums for service defects.',
      ],
      timeline: ['Company grievance window first; then legal forum within limitation.'],
      applicableLaws: [
        'Consumer Protection Act; contract law; IPC/BNS for fraud where applicable.',
      ],
    }),
  },
  {
    slug: 'cyber-crime',
    urgency: 'urgent',
    titleEn: 'Cyber crime, online fraud, or sextortion',
    titleHi: 'साइबर अपराध या ऑनलाइन धोखा',
    lawyerSearchHint: 'cyber crime IT Act online fraud',
    contextQuestions: [
      q('platform', 'Which platform / bank was involved?', 'कौन सा प्लेटफॉर्म / बैंक?', true),
      q('money_lost', 'Was money transferred?', 'क्या पैसा ट्रांसफर हुआ?', true),
      q('screenshots', 'Do you have screenshots / URLs?', 'स्क्रीनशॉट / URL हैं?', true),
    ],
    base: g({
      rightNow: [
        'Stop further payments; change passwords from a clean device if accounts compromised.',
        'Call bank helpline for transfer reversal where possible.',
        'Report on National Cyber Crime Reporting Portal and preserve digital evidence.',
      ],
      rights: [
        'You can report cyber offences; follow police/lawyer guidance on preservation of evidence.',
      ],
      documents: ['Transaction IDs, screenshots, device details', 'Chat logs (lawfully obtained)'],
      whatNotToDo: [
        'Do not pay blackmailers — it often escalates.',
        'Do not delete evidence before reporting.',
      ],
      policeOrCourt: [
        'Cyber police cells for FIR/investigation; courts later for recovery/prosecution support.',
      ],
      timeline: ['Immediate: freeze/limit damage; early reporting improves tracing chances.'],
      applicableLaws: [
        'Information Technology Act; IPC/BNS provisions; RBI/banking fraud processes.',
      ],
    }),
  },
  {
    slug: 'eviction',
    urgency: 'serious',
    titleEn: 'Eviction or landlord dispute',
    titleHi: 'बेदखली या मकान मालिक विवाद',
    lawyerSearchHint: 'rent tenancy eviction civil',
    contextQuestions: [
      q('lease', 'Is there a written lease?', 'क्या लिखित लीज है?', true),
      q('notice', 'Did you receive a termination/eviction notice?', 'क्या नोटिस मिला?', true),
      q('state_city', 'City / state of property?', 'शहर / राज्य?', false),
    ],
    base: g({
      rightNow: [
        'Read lease terms and local rent control laws if applicable.',
        'Avoid forceful self-help by either side.',
        'Consult a civil/rent lawyer before vacating or locking out.',
      ],
      rights: ['Rights differ for protected tenants vs leave-and-license; documentation matters.'],
      documents: ['Lease, rent receipts', 'Notices, correspondence'],
      whatNotToDo: [
        'Landlords: illegal lockouts can backfire legally.',
        'Tenants: withholding rent without legal advice can weaken position.',
      ],
      policeOrCourt: ['Police may attend breaches of peace; civil courts for possession suits.'],
      timeline: ['Eviction suits can be lengthy — interim orders may matter.'],
      applicableLaws: ['State rent acts; Transfer of Property Act; CPC.'],
    }),
  },
  {
    slug: 'fir-against-me',
    urgency: 'urgent',
    titleEn: 'FIR filed against me',
    titleHi: 'मेरे खिलाफ FIR',
    lawyerSearchHint: 'criminal defence FIR bail',
    contextQuestions: [
      q('sections', 'Do you know sections alleged (if any)?', 'कौन से धाराएँ?', false),
      q(
        'arrest',
        'Are you arrested / anticipatory bail needed?',
        'गिरफ्तारी / अग्रिम जमानत?',
        true,
      ),
      q('station', 'Which police station?', 'कौन सा थाना?', true),
    ],
    base: g({
      rightNow: [
        'Engage a criminal lawyer immediately.',
        'Obtain FIR copy through legal channels when available.',
        'Do not discuss the case publicly on social media.',
      ],
      rights: [
        'Right to legal defence and fair procedure; follow lawyer instructions on statements.',
      ],
      documents: ['FIR copy, summons', 'Alibi evidence if any (lawfully)'],
      whatNotToDo: ['Do not tamper with witnesses or evidence.'],
      policeOrCourt: ['Police investigation; courts for bail and trial.'],
      timeline: ['Early legal intervention often matters for bail and charge framing stages.'],
      applicableLaws: ['CrPC/BNSS; IPC/BNS sections as alleged; special statutes if any.'],
    }),
  },
  {
    slug: 'marriage-divorce',
    urgency: 'serious',
    titleEn: 'Marriage or divorce situation',
    titleHi: 'विवाह या तलाक की स्थिति',
    lawyerSearchHint: 'family law divorce matrimonial',
    contextQuestions: [
      q('stage', 'Are you considering separation, filed case, or mediation?', 'किस चरण में?', true),
      q('children', 'Children involved?', 'बच्चे?', true),
      q('assets', 'Major joint assets?', 'संयुक्त संपत्ति?', false),
    ],
    base: g({
      rightNow: [
        'Avoid impulsive agreements; document finances calmly.',
        'Consult a family lawyer before signing settlements.',
        'If violence risk exists, prioritise safety resources.',
      ],
      rights: [
        'Matrimonial remedies depend on personal laws and facts; information is general only.',
      ],
      documents: ['Marriage certificate, IDs', 'Financial statements, property papers'],
      whatNotToDo: [
        'Do not use children as leverage.',
        'Do not hide assets — courts may draw adverse inferences.',
      ],
      policeOrCourt: [
        'Family courts / mediation where applicable; police for protection in violence cases.',
      ],
      timeline: ['Mutual consent can be faster; contested matters may take longer.'],
      applicableLaws: [
        'Hindu Marriage Act / Special Marriage Act / personal laws as applicable; DV Act where relevant.',
      ],
    }),
  },
  {
    slug: 'death-procedures',
    urgency: 'informational',
    titleEn: 'Death in the family — legal procedures',
    titleHi: 'परिवार में मृत्यु — कानूनी प्रक्रिया',
    lawyerSearchHint: 'succession will probate family',
    contextQuestions: [
      q('death_cert', 'Is death certificate obtained?', 'मृत्यु प्रमाणपत्र मिला?', true),
      q('assets', 'Bank accounts / property in deceased name?', 'संपत्ति किस नाम?', true),
      q('will', 'Is there a will?', 'क्या वसीयत है?', true),
    ],
    base: g({
      rightNow: [
        'Obtain medical death certificate and municipal death registration.',
        'Secure originals of IDs, property papers, and bank passbooks safely.',
        'Notify banks/insurers with death certificate as per their process.',
      ],
      rights: ['Legal heirs have succession rights as per will or intestate succession laws.'],
      documents: ['Death certificate, ID proofs of heirs', 'Will (if any), property documents'],
      whatNotToDo: ['Do not withdraw funds without proper legal process if accounts are disputed.'],
      policeOrCourt: [
        'Court may be needed for probate/letters of administration in some cases — lawyer-guided.',
      ],
      timeline: [
        'Immediate: certificates and safe custody of documents.',
        'Weeks: succession certificates / mutation steps vary by asset type.',
      ],
      applicableLaws: [
        'Indian Succession Act / personal succession laws; Registration Act where relevant.',
      ],
    }),
  },
  {
    slug: 'workplace-posh',
    urgency: 'urgent',
    titleEn: 'Workplace sexual harassment (POSH)',
    titleHi: 'कार्यस्थल यौन उत्पीड़न (POSH)',
    lawyerSearchHint: 'POSH workplace sexual harassment labour',
    contextQuestions: [
      q('employer', 'Employer name and workplace location?', 'नियोक्ता और स्थान?', true),
      q('ic', 'Is there an Internal Committee (IC)?', 'क्या आंतरिक समिति है?', true),
      q('incident', 'Brief factual timeline (dates)?', 'घटनाओं की तारीख?', true),
    ],
    base: g({
      rightNow: [
        'If in immediate danger, seek safety and emergency help.',
        'Preserve messages, emails, and witness names confidentially.',
        'You may approach IC as per POSH policy timelines; consult a lawyer for drafting.',
      ],
      rights: ['Law provides for inquiry and confidentiality norms in workplace complaints.'],
      documents: ['Complaint draft, evidence copies', 'Employment contract, HR policy'],
      whatNotToDo: ['Do not publicise names in ways that could violate inquiry fairness or law.'],
      policeOrCourt: [
        'Workplace route via IC; criminal law route separate if cognizable offence — lawyer-led.',
      ],
      timeline: [
        'IC inquiries have timelines; also check limitation for any criminal complaint if advised.',
      ],
      applicableLaws: [
        'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013.',
      ],
    }),
  },
  {
    slug: 'bank-frozen',
    urgency: 'urgent',
    titleEn: 'Bank account frozen',
    titleHi: 'बैंक खाता फ्रीज',
    lawyerSearchHint: 'banking freeze attachment tax criminal',
    contextQuestions: [
      q('reason', 'Did the bank cite a reason (police / court / tax)?', 'कारण क्या बताया?', true),
      q('letter', 'Do you have a freeze letter or email?', 'क्या पत्र मिला?', true),
    ],
    base: g({
      rightNow: [
        'Collect written communication from the bank.',
        'Do not attempt structuring transactions to bypass lawful freezes.',
        'Engage a lawyer specialising in banking/tax/criminal as the reason suggests.',
      ],
      rights: [
        'You may be entitled to reasons and remedies depending on whether freeze is by bank policy, court, or agency.',
      ],
      documents: ['Bank correspondence, account statements', 'Any notices from authorities'],
      whatNotToDo: ['Do not use third-party accounts to hide proceeds if under investigation.'],
      policeOrCourt: [
        'Courts/agencies that ordered freeze; bank grievance as parallel where appropriate.',
      ],
      timeline: ['Act quickly — freezes often follow investigations with tight response windows.'],
      applicableLaws: [
        'Banking contracts; CrPC/BNSS attachment provisions; tax statutes if revenue department.',
      ],
    }),
  },
  {
    slug: 'tax-raid',
    urgency: 'urgent',
    titleEn: 'GST or Income Tax raid / survey',
    titleHi: 'जीएसटी या आयकर छापा / सर्वे',
    lawyerSearchHint: 'tax GST income tax search seizure',
    contextQuestions: [
      q('which', 'GST, Income Tax, or both?', 'GST, आयकर, या दोनों?', true),
      q('pan', 'PAN / GSTIN available?', 'PAN / GSTIN?', true),
    ],
    base: g({
      rightNow: [
        'Cooperate with lawful processes; ask for identity and authorisation papers.',
        'Call a tax lawyer immediately; avoid signing summaries you do not understand.',
        'Preserve copies of inventories and panchnamas when provided.',
      ],
      rights: [
        'Tax laws prescribe rights and duties during search/survey; follow professional advice.',
      ],
      documents: ['Books of account, invoices (as required)', 'Authorisation copies, inventories'],
      whatNotToDo: ['Do not destroy books or hide assets during proceedings.'],
      policeOrCourt: ['Tax department processes; courts for writs/challenges as advised.'],
      timeline: [
        'Immediate: professional representation.',
        'Follow-up: replies and assessments may have strict timelines.',
      ],
      applicableLaws: ['Income Tax Act, 1961; CGST/SGST Acts and rules; evidence procedures.'],
    }),
  },
  {
    slug: 'child-custody',
    urgency: 'serious',
    titleEn: 'Child custody dispute',
    titleHi: 'बच्चे की कस्टडी विवाद',
    lawyerSearchHint: 'family child custody guardianship',
    contextQuestions: [
      q('court', 'Is a case already pending?', 'क्या केस चल रहा है?', true),
      q('age', 'Child age (approx)?', 'बच्चे की उम्र?', true),
    ],
    base: g({
      rightNow: [
        'Prioritise child welfare; avoid confrontations in front of children.',
        'Do not unilaterally relocate without legal advice.',
        'Engage a family lawyer for interim custody/access applications if needed.',
      ],
      rights: ['Courts decide custody/access based on welfare principle — varies by facts.'],
      documents: ['Birth certificate, school records', 'Existing court orders'],
      whatNotToDo: ['Do not withhold visitation illegally if a court order exists.'],
      policeOrCourt: ['Family courts; mediation where ordered.'],
      timeline: ['Interim orders can come earlier; final disposal may take time.'],
      applicableLaws: [
        'Guardians and Wards Act; Hindu Minority and Guardianship Act; personal laws as applicable.',
      ],
    }),
  },
  {
    slug: 'loan-recovery-harassment',
    urgency: 'urgent',
    titleEn: 'Loan recovery agent harassment',
    titleHi: 'लोन रिकवरी एजेंट उत्पीड़न',
    lawyerSearchHint: 'debt recovery RBI harassment banking',
    contextQuestions: [
      q('lender', 'Bank or NBFC name?', 'बैंक / NBFC?', true),
      q('abuse', 'What kind of harassment (calls, visits, threats)?', 'किस प्रकार?', true),
    ],
    base: g({
      rightNow: [
        'Log calls (time, number, summary) and preserve recordings where lawful.',
        'Send written complaint to lender grievance officer.',
        'RBI ombudsman / NBFC complaint mechanisms may apply — lawyer helps draft.',
      ],
      rights: [
        'Fair recovery practices norms may apply; criminal threats should be reported with evidence.',
      ],
      documents: ['Loan agreement, EMI schedule', 'Call logs, screenshots'],
      whatNotToDo: [
        'Do not use violence against agents.',
        'Do not ignore legitimate dues without restructuring discussion.',
      ],
      policeOrCourt: [
        'Police for criminal intimidation if facts support; civil forums for loan disputes.',
      ],
      timeline: ['Escalate grievance timelines as per lender policy and RBI rules.'],
      applicableLaws: ['RBI fair practices; contract law; IPC/BNS for threats where applicable.'],
    }),
  },
  {
    slug: 'property-registration',
    urgency: 'serious',
    titleEn: 'Property registration dispute',
    titleHi: 'संपत्ति पंजीकरण विवाद',
    lawyerSearchHint: 'property registration stamp duty civil',
    contextQuestions: [
      q('stage', 'Sale completed or only agreement?', 'बिक्री पूर्ण या केवल समझौता?', true),
      q('sub_registrar', 'Which sub-registrar office?', 'कौन सा दफ्तर?', false),
    ],
    base: g({
      rightNow: [
        'Collect draft deed, paid challans, and correspondence with seller/buyer.',
        'Do not pay cash without receipts.',
        'Consult a property lawyer before executing.',
      ],
      rights: ['Registration rights/duties governed by Registration Act and stamp laws.'],
      documents: ['Title chain, encumbrance certificate', 'Tax receipts, ID proofs'],
      whatNotToDo: ['Avoid benami arrangements — serious legal consequences.'],
      policeOrCourt: [
        'Civil courts for specific performance / cancellation; fraud to police if strong evidence.',
      ],
      timeline: ['Registration timelines depend on document clearance and queue.'],
      applicableLaws: [
        'Registration Act, 1908; Indian Stamp Act / state stamp laws; contract law.',
      ],
    }),
  },
  {
    slug: 'will-inheritance',
    urgency: 'informational',
    titleEn: 'Will or inheritance dispute',
    titleHi: 'वसीयत या विरासत विवाद',
    lawyerSearchHint: 'succession will probate inheritance civil',
    contextQuestions: [
      q('will', 'Is there a registered/unregistered will?', 'वसीयत है?', true),
      q('heirs', 'How many legal heirs?', 'कितने वारिस?', false),
    ],
    base: g({
      rightNow: [
        'Secure original will safely; make controlled copies.',
        'List assets and liabilities of the estate.',
        'Consult a succession lawyer before distributions.',
      ],
      rights: [
        'Heirs and legatees have rights as per applicable succession law and will validity.',
      ],
      documents: ['Will, death certificate', 'Property papers, bank statements'],
      whatNotToDo: ['Do not forge or alter wills — criminal offences.'],
      policeOrCourt: ['Civil court for probate/caveats; criminal only for forgery with evidence.'],
      timeline: ['Probate/letters can take months; interim injunctions possible in disputes.'],
      applicableLaws: [
        'Indian Succession Act; personal laws; Registration Act for registered wills.',
      ],
    }),
  },
] as const satisfies readonly EmergencyScenario[];
