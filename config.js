/**
 * PTW System — Permit Type Configuration
 * Each permit type has its own distinct multi-stage approval workflow.
 */

const PTW_CONFIG = {

  // ── PERMIT TYPE METADATA ────────────────────────────────────────────
  types: {
    WAH: {
      label: 'Work at Height',
      icon:  '🪜',
      color: '#E53935',
      bg:    '#FFEBEE',
      badgeClass: 'badge-WAH',
    },
    CS: {
      label: 'Confined Space',
      icon:  '🕳️',
      color: '#7B1FA2',
      bg:    '#F3E5F5',
      badgeClass: 'badge-CS',
    },
    LOTO: {
      label: 'LOTO',
      icon:  '🔒',
      color: '#F57C00',
      bg:    '#FFF3E0',
      badgeClass: 'badge-LOTO',
    },
    HW: {
      label: 'Hot Work',
      icon:  '🔥',
      color: '#D84315',
      bg:    '#FBE9E7',
      badgeClass: 'badge-HW',
    },
    ELEC: {
      label: 'Electrical Work',
      icon:  '⚡',
      color: '#1565C0',
      bg:    '#E3F2FD',
      badgeClass: 'badge-ELEC',
    },
  },

  // ── DISTINCT APPROVAL WORKFLOWS PER PERMIT TYPE ─────────────────────
  // Each type has a unique stages array with specific roles and requirements.
  workflows: {

    WAH: {
      name: 'Work at Height — 3-Stage Approval',
      stages: [
        {
          key:   'wah_assessor',
          label: 'Stage 1 — WAH Assessor',
          role:  'WAH Certified Assessor (ICWCI)',
          desc:  'Verify WAH risk assessment, equipment inspection, and fall protection measures.',
          color: '#E53935',
          requirement: 'Must hold valid WAH Assessor certification',
        },
        {
          key:   'safety_officer',
          label: 'Stage 2 — Safety Officer',
          role:  'Site Safety Officer / HSE Manager',
          desc:  'Review overall safety plan, PPE compliance, and emergency procedures.',
          color: '#F57C00',
          requirement: 'Site HSE team sign-off',
        },
        {
          key:   'area_manager',
          label: 'Stage 3 — Area Manager',
          role:  'Area Manager / Site Manager',
          desc:  'Final authorisation before work commences.',
          color: '#1B8A35',
          requirement: 'Management-level sign-off required',
        },
      ],
    },

    CS: {
      name: 'Confined Space — 3-Stage Approval',
      stages: [
        {
          key:   'cs_supervisor',
          label: 'Stage 1 — CS Entry Supervisor',
          role:  'Confined Space Entry Supervisor',
          desc:  'Verify atmospheric testing results, standby personnel, and rescue plan.',
          color: '#7B1FA2',
          requirement: 'Must be a trained CS Entry Supervisor',
        },
        {
          key:   'safety_officer',
          label: 'Stage 2 — Safety Officer',
          role:  'Site Safety Officer / HSE Manager',
          desc:  'Review entry conditions, gas monitoring, ventilation, and emergency response.',
          color: '#F57C00',
          requirement: 'HSE sign-off on atmospheric conditions',
        },
        {
          key:   'area_manager',
          label: 'Stage 3 — Area / Operations Manager',
          role:  'Operations Manager',
          desc:  'Final authorisation. Entry restrictions confirmed.',
          color: '#1B8A35',
          requirement: 'Management authorisation required',
        },
      ],
    },

    LOTO: {
      name: 'LOTO — 2-Stage Approval',
      stages: [
        {
          key:   'eso',
          label: 'Stage 1 — Electrical Safety Officer',
          role:  'Electrical Safety Officer (ESO)',
          desc:  'Verify all energy sources identified, isolation procedures correct, and LOTO register complete.',
          color: '#F57C00',
          requirement: 'Must be a licensed Electrical Safety Officer',
        },
        {
          key:   'area_manager',
          label: 'Stage 2 — Area Manager',
          role:  'Area / Maintenance Manager',
          desc:  'Final authorisation for energy isolation and work commencement.',
          color: '#1B8A35',
          requirement: 'Management sign-off required',
        },
      ],
    },

    HW: {
      name: 'Hot Work — 2-Stage Approval',
      stages: [
        {
          key:   'fire_safety',
          label: 'Stage 1 — Fire Safety Manager',
          role:  'Fire Safety Manager',
          desc:  'Verify fire watch, extinguisher placement, combustible clearance, and spatter controls.',
          color: '#D84315',
          requirement: 'Must hold Fire Safety Manager qualification',
        },
        {
          key:   'area_manager',
          label: 'Stage 2 — Area Manager',
          role:  'Area / Operations Manager',
          desc:  'Final authorisation. Post-work fire watch arrangements confirmed.',
          color: '#1B8A35',
          requirement: 'Management sign-off required',
        },
      ],
    },

    ELEC: {
      name: 'Electrical Work — 3-Stage Approval',
      stages: [
        {
          key:   'lew',
          label: 'Stage 1 — Licensed Electrical Worker',
          role:  'Licensed Electrical Worker (LEW)',
          desc:  'Verify isolation method, voltage testing, live work justification (if applicable).',
          color: '#1565C0',
          requirement: 'Must hold a valid LEW licence (EMA)',
        },
        {
          key:   'safety_officer',
          label: 'Stage 2 — Safety Officer',
          role:  'Site Safety Officer / HSE Manager',
          desc:  'Review electrical hazard controls, arc flash precautions, PPE compliance.',
          color: '#F57C00',
          requirement: 'HSE review required for HV / live work',
        },
        {
          key:   'area_manager',
          label: 'Stage 3 — Area / Operations Manager',
          role:  'Area Manager',
          desc:  'Final authorisation. Adjacent team notifications confirmed.',
          color: '#1B8A35',
          requirement: 'Management sign-off required',
        },
      ],
    },
  },

  // ── TYPE-SPECIFIC FORM FIELDS ────────────────────────────────────────
  typeFields: {
    WAH: [
      { id: 'wah_height',   label: 'Max Working Height (m)', type: 'number', placeholder: 'e.g. 6.0', required: true, hint: 'WAH permit required for ≥ 1.8 m' },
      { id: 'wah_equip',    label: 'Access Equipment',       type: 'select', required: true,
        options: ['— Select —', 'Scaffolding', 'Mobile Elevated Work Platform (MEWP)', 'Ladder', 'Aerial / Boom Lift', 'Roof Access / Hatch'] },
      { id: 'wah_fp',       label: 'Fall Protection System', type: 'select',
        options: ['— Select —', 'Full-Body Harness + Lanyard', 'Safety Net', 'Guardrail System', 'Personal Fall Arrest System (PFAS)', 'Restraint System'] },
      { id: 'wah_assessor', label: 'WAH Assessor Name',      type: 'text',   placeholder: 'Name of certified WAH assessor', hint: 'Must hold ICWCI or equivalent certification' },
    ],

    CS: [
      { id: 'cs_space',     label: 'Space Description',      type: 'text',   placeholder: 'e.g. Underground vault, tank, sump' },
      { id: 'cs_atm',       label: 'Atmospheric Testing',    type: 'select',
        options: ['Yes — O₂, LEL, H₂S, CO tested', 'Yes — O₂ and LEL only', 'No — justification required'] },
      { id: 'cs_standby',   label: 'Standby Person Name',    type: 'text',   placeholder: 'Name of assigned standby person' },
      { id: 'cs_rescue',    label: 'Rescue Equipment',       type: 'select',
        options: ['Available — on site', 'To be arranged before entry', 'Not applicable'] },
    ],

    LOTO: [
      { id: 'loto_energy',  label: 'Energy Sources Identified', type: 'text', placeholder: 'e.g. Electrical 415V, Pneumatic, Hydraulic', required: true },
      { id: 'loto_voltage', label: 'Voltage Level',             type: 'select',
        options: ['Low Voltage (≤1000V AC)', 'High Voltage (>1000V AC)', 'DC System', 'Multiple sources'] },
      { id: 'loto_points',  label: 'No. of Isolation Points',   type: 'number', placeholder: 'Total number of energy isolation points' },
      { id: 'loto_zero',    label: 'Zero Energy Verified',      type: 'select',
        options: ['Yes — confirmed with approved test instrument', 'Pending — to be verified before work'] },
    ],

    HW: [
      { id: 'hw_type',      label: 'Type of Hot Work',       type: 'select', required: true,
        options: ['— Select —', 'Welding (MIG/TIG/Arc)', 'Cutting / Grinding', 'Brazing / Soldering', 'Open Flame', 'Thermal Spraying', 'Other'] },
      { id: 'hw_firewatch', label: 'Fire Watch Person',      type: 'text',   placeholder: 'Name of assigned fire watch', required: true },
      { id: 'hw_ext',       label: 'Fire Extinguisher (type & qty)', type: 'text', placeholder: 'e.g. 2× ABC 9 kg, 1× CO₂ 5 kg' },
      { id: 'hw_postwatch', label: 'Post-Work Fire Watch',   type: 'select',
        options: ['30 minutes after completion', '60 minutes after completion', 'Not applicable — justification provided'] },
    ],

    ELEC: [
      { id: 'elec_voltage', label: 'Voltage Level',          type: 'select', required: true,
        options: ['Low Voltage (≤1000V AC)', 'High Voltage (>1000V AC)', 'DC System'] },
      { id: 'elec_panel',   label: 'Panel / Circuit Reference', type: 'text', placeholder: 'e.g. MDB-1 Circuit 12, DB-L3-04' },
      { id: 'elec_iso',     label: 'Isolation Status',       type: 'select', required: true,
        options: ['Isolated — tested with approved voltage indicator', 'Live work — additional approval required', 'Partial isolation'] },
      { id: 'elec_lew',     label: 'LEW Name / Licence No.', type: 'text',   placeholder: 'Name and EMA licence number', hint: 'Singapore LEW licence required' },
    ],
  },

  // ── HAZARDS PER TYPE ─────────────────────────────────────────────────
  hazards: {
    WAH: [
      'Fall from height',
      'Falling objects striking persons below',
      'Unstable or inadequate working platform',
      'Adverse weather / high wind conditions',
      'Overhead power lines or electrical hazards',
      'Struck by moving plant or equipment',
      'Slippery or wet surfaces at height',
    ],
    CS: [
      'Oxygen deficiency (< 19.5%)',
      'Toxic gases — H₂S, CO, CO₂',
      'Flammable or explosive atmosphere (LEL > 10%)',
      'Flooding or liquid ingress',
      'Engulfment in solid material',
      'Excessive heat and poor ventilation',
      'Entrapment or restricted egress',
    ],
    LOTO: [
      'Unexpected re-energisation of isolated equipment',
      'Stored energy release (hydraulic / pneumatic)',
      'Pressurised lines or vessels',
      'Spring-loaded mechanical components',
      'Thermal energy — hot surfaces',
      'Gravity hazard — suspended loads or parts',
    ],
    HW: [
      'Fire and explosion from ignition of flammable materials',
      'Burns and scalds from flame / spatter',
      'UV radiation from welding arc (eye injury)',
      'Welding fumes and toxic gas inhalation',
      'Spark and spatter to adjacent areas',
      'Structural weakening from heat',
      'Adjacent stored flammable materials',
    ],
    ELEC: [
      'Electric shock / electrocution',
      'Arc flash and arc blast',
      'Thermal burns from fault current',
      'Electrical fire',
      'Falls while working at elevated position',
      'Contact with unidentified live conductors',
      'Inductive / capacitive stored charge',
    ],
  },

  // ── PPE PER TYPE ─────────────────────────────────────────────────────
  ppe: {
    WAH: [
      'Hard hat (EN 397 or equivalent)',
      'Full-body safety harness (inspected within 6 months)',
      'Non-slip safety boots with steel toecap',
      'High-visibility vest / clothing',
      'Safety glasses (EN 166)',
      'Anti-vibration gloves (if using power tools)',
    ],
    CS: [
      'Self-Contained Breathing Apparatus (SCBA)',
      'Continuous multi-gas monitor (personal)',
      'Safety harness with attached lifeline',
      'Chemical-resistant gloves (appropriate rating)',
      'Safety boots (steel toe)',
      'Hard hat',
    ],
    LOTO: [
      'Insulated rubber gloves (voltage-rated)',
      'Safety glasses / face shield',
      'Hard hat with non-conducting class',
      'Safety boots (steel toe / dielectric)',
      'High-visibility vest',
      'Arc-rated clothing (if electrical LOTO)',
    ],
    HW: [
      'Welding helmet / auto-darkening face shield (shade 10–13)',
      'Fire-resistant leather welding gloves',
      'Leather welding apron',
      'Safety boots with steel toecap',
      'Safety glasses underneath helmet',
      'Fire-resistant / FR clothing',
    ],
    ELEC: [
      'Insulated rubber gloves (voltage-rated, tested)',
      'Insulated / non-conductive tools',
      'Arc-flash PPE — rated for incident energy (HV work)',
      'Safety glasses or arc-rated face shield',
      'Hard hat (non-conducting class)',
      'Dielectric safety boots',
    ],
  },

  // ── PRE-WORK CHECKLIST PER TYPE ──────────────────────────────────────
  preChecklist: {
    WAH: [
      'Work zone below fully barricaded and signed',
      'All access equipment inspected and tagged in-service',
      'Safety harness and lanyards individually inspected',
      'Anchor points verified by competent person',
      'All tools and materials secured with tool lanyards',
      'Emergency rescue plan briefed to all workers',
      'Weather conditions checked and deemed acceptable',
      'Permit displayed visibly at the work site',
    ],
    CS: [
      'Atmospheric testing complete — O₂, LEL, H₂S, CO within safe limits',
      'Mechanical ventilation / air supply operational',
      'Standby person positioned at entry point with communication',
      'Rescue equipment (tripod, harness, SCBA) staged at entry',
      'All workers briefed on emergency evacuation procedure',
      'Entry log sheet prepared and in active use',
      'Gas monitor calibrated and alarm function tested',
      'Entry restricted to authorised persons only',
    ],
    LOTO: [
      'All energy sources identified on LOTO register',
      'All isolation points locked and tagged by each worker',
      'Stored energy verified dissipated (bled, blocked, restrained)',
      'Zero energy state confirmed by approved test instrument',
      'Work area secured with barriers and danger/out-of-service tags',
      'All affected parties notified of isolation',
      'LOTO log signed by Authorised Person',
      'Emergency re-energisation procedure confirmed',
    ],
    HW: [
      'Fire watch person on duty at work site',
      'Fire extinguisher inspected, charged, within 3 m of work',
      'All combustibles removed or shielded within 3 m',
      'Welding screens and spark guards in position',
      'Work area floor swept clean of debris and residue',
      'Floor drains, openings, and gaps sealed against spatter',
      'Post-work 30-minute fire watch arrangement confirmed',
      'Permit displayed visibly at work site',
    ],
    ELEC: [
      'Isolation confirmed with approved voltage indicator / tester',
      'All live conductors marked and physical barriers erected',
      'Warning notices posted on panel and adjacent switchboards',
      'Insulated tools inspected and in serviceable condition',
      'First-aid trained person present on site',
      'Residual voltage and capacitive charge verified zero',
      'Adjacent operational teams notified of isolation',
      'Permit posted on panel / switchboard',
    ],
  },

};
