// SafeWork PTW — Static Data & Configuration

const PTW_CONFIG = {
  // Permit type definitions
  permitTypes: {
    WAH: { label: 'Work at Height', color: '#3b82f6', minHeight: '1.8m' },
    CS:  { label: 'Confined Space', color: '#8b5cf6', oxygenMin: 19.5, oxygenMax: 23.5 },
    LOTO:{ label: 'Lockout/Tagout', color: '#f59e0b' },
    HW:  { label: 'Hot Work',       color: '#f97316', fireWatch: true },
    ELEC:{ label: 'Electrical Work', color: '#10b981', voltageThreshold: 50 }
  },

  // Routing rules: permit type → assessors
  routingRules: {
    WAH: {
      label: 'Work at Height Routing',
      description: 'WAH permits require a certified Height Safety Assessor + area supervisor',
      assessors: [
        { id: 'HSA-001', name: 'James Thornton', title: 'Senior Height Safety Assessor', badge: 'WAH Cert.' },
        { id: 'HSA-002', name: 'Sarah Ng',       title: 'Height Safety Assessor',        badge: 'WAH Cert.' },
        { id: 'HSA-003', name: 'Marcus Obi',     title: 'Height Safety Officer',          badge: 'WAH Cert.' }
      ],
      checks: [
        'Height exceeds 1.8m — mandatory WAH assessor review',
        'Fall arrest/prevention equipment inspection required',
        'Rescue plan must be documented before work begins'
      ]
    },
    CS: {
      label: 'Confined Space Routing',
      description: 'CS permits require a Confined Space Supervisor and atmospheric testing',
      assessors: [
        { id: 'CSA-001', name: 'Diana Walsh',    title: 'Confined Space Supervisor',  badge: 'CS Cert.' },
        { id: 'CSA-002', name: 'Kevin Patel',    title: 'CS & Atmospheric Assessor',  badge: 'CS Cert.' }
      ],
      checks: [
        'Atmospheric testing required before and during entry',
        'Rescue/retrieval equipment and standby person mandatory',
        'Entry log must be maintained at all times'
      ]
    },
    LOTO: {
      label: 'LOTO Routing',
      description: 'LOTO permits require an Authorised Lockout Officer',
      assessors: [
        { id: 'LO-001', name: 'Raj Subramaniam', title: 'Authorised Lockout Officer',      badge: 'LOTO Auth.' },
        { id: 'LO-002', name: 'Fiona MacLeod',   title: 'Energy Isolation Specialist',     badge: 'LOTO Auth.' }
      ],
      checks: [
        'All energy sources must be identified and listed',
        'Isolation verification (test after lock-out) required',
        'Group lockout box required for multi-worker LOTO'
      ]
    },
    HW: {
      label: 'Hot Work Routing',
      description: 'Hot work permits require Fire Watch assignment and combustibles clearance',
      assessors: [
        { id: 'HWA-001', name: 'Ben Hartley',    title: 'Hot Work Safety Supervisor', badge: 'HW Auth.' },
        { id: 'HWA-002', name: 'Amara Diallo',   title: 'Fire Safety Officer',        badge: 'FSO' }
      ],
      checks: [
        'Combustibles cleared / protected within 11m radius',
        'Fire extinguisher and fire watch on standby',
        '30-minute post-work fire watch period required'
      ]
    },
    ELEC: {
      label: 'Electrical Work Routing',
      description: 'Electrical permits require a Licensed Electrician and isolations verified',
      assessors: [
        { id: 'EA-001', name: 'Tom Prescott',   title: 'Licensed Electrical Inspector', badge: 'Lic. Elec.' },
        { id: 'EA-002', name: 'Yuki Tanaka',    title: 'Electrical Safety Engineer',    badge: 'Lic. Elec.' }
      ],
      checks: [
        'Circuit isolation and lock-out required before work',
        'Live work >50V requires additional authorisation',
        'Test & tag verification required post-completion'
      ]
    }
  },

  // Safety checklists per permit type — grouped by category
  // mandatory:true items must be checked before user can proceed
  safetyChecklists: {
    WAH: [
      {
        group: 'Fall Protection',
        icon: '🦺',
        items: [
          { id: 'wah-harness',   label: 'Full-body harness inspected and fitted correctly',         mandatory: true },
          { id: 'wah-lanyard',   label: 'Lanyard / fall arrest device attached to anchor point',    mandatory: true },
          { id: 'wah-anchor',    label: 'Anchor point inspected and rated for load',                mandatory: true },
          { id: 'wah-rescue',    label: 'Rescue/retrieval plan established and communicated',       mandatory: true }
        ]
      },
      {
        group: 'Access Equipment',
        icon: '🪜',
        items: [
          { id: 'wah-equip',     label: 'Access equipment (ladder/scaffold/EWP) inspected pre-use', mandatory: true },
          { id: 'wah-stable',    label: 'Equipment positioned on stable, level surface',            mandatory: false },
          { id: 'wah-footing',   label: 'Non-slip footwear worn',                                  mandatory: false }
        ]
      },
      {
        group: 'Site Setup',
        icon: '🚧',
        items: [
          { id: 'wah-zone',      label: 'Exclusion zone / barricade set up below work area',        mandatory: true },
          { id: 'wah-tools',     label: 'Tools and materials secured / tethered against falling',   mandatory: false },
          { id: 'wah-weather',   label: 'Weather checked — wind speed within safe limits',          mandatory: false },
          { id: 'wah-helmet',    label: 'Safety helmet worn by all workers in area',                mandatory: false }
        ]
      }
    ],

    CS: [
      {
        group: 'Atmospheric Testing',
        icon: '🌬️',
        items: [
          { id: 'cs-atm',        label: 'Atmospheric test completed before entry (O₂, LEL, toxic)', mandatory: true },
          { id: 'cs-vent',       label: 'Forced ventilation running and verified effective',         mandatory: true },
          { id: 'cs-monitor',    label: 'Continuous gas monitor in use during work',                mandatory: true }
        ]
      },
      {
        group: 'Entry Controls',
        icon: '🚪',
        items: [
          { id: 'cs-standby',    label: 'Trained standby/attendant stationed at entry point',       mandatory: true },
          { id: 'cs-log',        label: 'Entry/exit log set up and in use',                         mandatory: true },
          { id: 'cs-comms',      label: 'Communication system between entrant and standby tested',  mandatory: true },
          { id: 'cs-retrieval',  label: 'Retrieval system (harness + tripod/winch) in place',       mandatory: true }
        ]
      },
      {
        group: 'PPE',
        icon: '🥽',
        items: [
          { id: 'cs-ppe-harness','label': 'Full-body harness with retrieval line worn',             mandatory: true },
          { id: 'cs-ppe-ba',     label: 'SCBA / supplied air available if required',               mandatory: false },
          { id: 'cs-ppe-tools',  label: 'Non-sparking tools used where atmosphere hazard exists',  mandatory: false }
        ]
      }
    ],

    LOTO: [
      {
        group: 'Isolation',
        icon: '🔌',
        items: [
          { id: 'loto-list',     label: 'All energy sources identified and listed on the permit',   mandatory: true },
          { id: 'loto-isolated', label: 'All energy sources isolated at correct isolation points',  mandatory: true },
          { id: 'loto-tryout',   label: 'Try-out / verification test performed — confirmed dead',   mandatory: true }
        ]
      },
      {
        group: 'Lock & Tag',
        icon: '🔒',
        items: [
          { id: 'loto-lock',     label: 'Personal lock applied to each isolation point',            mandatory: true },
          { id: 'loto-tag',      label: 'Danger tag attached at each isolation point',              mandatory: true },
          { id: 'loto-hasp',     label: 'Group hasp used where multiple workers involved',          mandatory: false },
          { id: 'loto-keys',     label: 'Lock keys held only by the person performing the work',    mandatory: false }
        ]
      },
      {
        group: 'PPE',
        icon: '🧤',
        items: [
          { id: 'loto-gloves',   label: 'Insulated gloves (voltage-rated) worn',                   mandatory: false },
          { id: 'loto-glasses',  label: 'Safety glasses / face shield worn',                       mandatory: false }
        ]
      }
    ],

    HW: [
      {
        group: 'Fire Prevention',
        icon: '🔥',
        items: [
          { id: 'hw-clear',      label: 'Combustibles removed or protected within 11m radius',      mandatory: true },
          { id: 'hw-drains',     label: 'Floor drains / openings covered to prevent spark entry',   mandatory: true },
          { id: 'hw-screen',     label: 'Welding screen / fire blankets installed as required',     mandatory: false }
        ]
      },
      {
        group: 'Fire Watch',
        icon: '👁️',
        items: [
          { id: 'hw-watch',      label: 'Fire watch person assigned and briefed on duties',         mandatory: true },
          { id: 'hw-extinguish', label: 'Appropriate fire extinguisher available at work site',     mandatory: true },
          { id: 'hw-30min',      label: '30-minute post-work fire watch period confirmed',           mandatory: true },
          { id: 'hw-alarm',      label: 'Fire alarm system status checked (isolated if required)',  mandatory: false }
        ]
      },
      {
        group: 'PPE',
        icon: '🪖',
        items: [
          { id: 'hw-helmet',     label: 'Welding helmet / face shield worn',                        mandatory: true },
          { id: 'hw-gloves',     label: 'Leather welding gloves worn',                              mandatory: true },
          { id: 'hw-coveralls',  label: 'Flame-resistant coveralls worn',                           mandatory: false },
          { id: 'hw-boots',      label: 'Welding boots / spats worn',                              mandatory: false }
        ]
      }
    ],

    ELEC: [
      {
        group: 'Isolation & Verification',
        icon: '⚡',
        items: [
          { id: 'elec-isolated', label: 'Circuit isolated at correct breaker / isolator',           mandatory: true },
          { id: 'elec-locked',   label: 'Lock and danger tag applied to isolation point',            mandatory: true },
          { id: 'elec-tested',   label: 'Tested dead with calibrated multi-function tester',        mandatory: true },
          { id: 'elec-earthed',  label: 'Temporary earthing applied where required',                mandatory: false }
        ]
      },
      {
        group: 'Area Setup',
        icon: '🚧',
        items: [
          { id: 'elec-barrier',  label: 'Work area barricaded and warning signs posted',            mandatory: true },
          { id: 'elec-rcd',      label: 'RCD protection in use for power tools',                    mandatory: false },
          { id: 'elec-damp',     label: 'Area checked — no water / damp surfaces present',          mandatory: false }
        ]
      },
      {
        group: 'PPE',
        icon: '🥽',
        items: [
          { id: 'elec-gloves',   label: 'Insulated, voltage-rated gloves worn',                     mandatory: true },
          { id: 'elec-tools',    label: 'Insulated hand tools in use',                              mandatory: true },
          { id: 'elec-arcflash', label: 'Arc flash face shield worn (live work or >50V proximity)', mandatory: false },
          { id: 'elec-mat',      label: 'Insulating mat / blanket in place',                        mandatory: false }
        ]
      }
    ]
  },

  // Type-specific form fields
  typeFields: {
    WAH: [
      { id: 'wah-height',     label: 'Maximum Working Height (m)',  type: 'number', placeholder: 'e.g. 5.2' },
      { id: 'wah-equipment',  label: 'Access Equipment Type',        type: 'select',
        options: ['Ladder','Scaffolding','Elevated Work Platform (EWP)','Scissor Lift','Boom Lift','Cherry Picker','Other'] },
      { id: 'wah-anchor',     label: 'Anchor Point Inspection Done?', type: 'select', options: ['Yes','No','N/A'] },
      { id: 'wah-rescue',     label: 'Rescue Plan Reference',        type: 'text',   placeholder: 'Plan number or document ref' }
    ],
    CS: [
      { id: 'cs-class',       label: 'Confined Space Class',         type: 'select',
        options: ['Class A — Immediately Dangerous','Class B — Non-Immediately Dangerous','Class C — Low Risk'] },
      { id: 'cs-oxygen',      label: 'O₂ Level (%) — Pre-Entry',    type: 'number', placeholder: 'e.g. 20.9' },
      { id: 'cs-gas',         label: 'Atmospheric Hazards Present',  type: 'text',   placeholder: 'e.g. H₂S, CO, methane' },
      { id: 'cs-standby',     label: 'Standby Person Name',          type: 'text',   placeholder: 'Full name' },
      { id: 'cs-retrieval',   label: 'Retrieval System in Place?',   type: 'select', options: ['Yes','No'] }
    ],
    LOTO: [
      { id: 'loto-energy',    label: 'Energy Sources to Isolate',    type: 'text',   placeholder: 'e.g. 415V electrical, pneumatic, hydraulic' },
      { id: 'loto-isolation',  label: 'Isolation Point(s)',           type: 'text',   placeholder: 'Circuit ref / valve tag numbers' },
      { id: 'loto-verified',  label: 'Try-Out / Verification Done?', type: 'select', options: ['Yes — Verified Dead','No — Pending','N/A'] },
      { id: 'loto-workers',   label: 'No. of Lock Hasp Positions Required', type: 'number', placeholder: '1' }
    ],
    HW: [
      { id: 'hw-type',        label: 'Hot Work Type',                type: 'select',
        options: ['Welding','Grinding','Cutting','Soldering','Brazing','Use of open flame','Other'] },
      { id: 'hw-firewatch',   label: 'Fire Watch Person Name',       type: 'text',   placeholder: 'Full name' },
      { id: 'hw-equipment',   label: 'Fire Extinguisher Type Present',type: 'text',  placeholder: 'e.g. CO₂ 4.5kg' },
      { id: 'hw-clearance',   label: 'Combustibles Clearance (m)',   type: 'number', placeholder: 'e.g. 11' }
    ],
    ELEC: [
      { id: 'elec-voltage',   label: 'Maximum Voltage (V)',          type: 'number', placeholder: 'e.g. 415' },
      { id: 'elec-circuit',   label: 'Circuit / Board Reference',    type: 'text',   placeholder: 'e.g. DB-3, Circuit 14' },
      { id: 'elec-isolated',  label: 'Isolation Confirmed?',         type: 'select', options: ['Yes — Tested Dead','No — Live Work Authorised','Pending'] },
      { id: 'elec-live',      label: 'Live Work Authorisation No.',  type: 'text',   placeholder: 'If applicable' }
    ]
  }
};
