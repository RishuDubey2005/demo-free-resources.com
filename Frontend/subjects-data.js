/**
 * NITP - All subjects data
 * Used by: resources-upload.js, branch-page.js
 * PYQ is always last in each semester.
 */
const SUBJECTS_DATA = {
    ME: {
        1: [
            { code: 'HS011601', name: 'Professional Communication and Technical Writing' },
            { code: 'AP011601', name: 'Engineering Physics' },
            { code: 'ME011601', name: 'Engineering Graphics' },
            { code: 'ME011602', name: 'Workshop Practice - I' },
            { code: 'ME011603', name: 'Introduction to Metal Machining Processes' },
            { code: 'ME011604', name: 'Engineering Mechanics' },
            { code: 'ME011605', name: 'EAA I - Sports/Innovative Project/NCC/NSS' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 1' }
        ],
        2: [
            { code: 'CS021601', name: 'Fundamentals of Information Technology' },
            { code: 'MC021601', name: 'Engineering Mathematics' },
            { code: 'CT021601', name: 'Engineering Chemistry' },
            { code: 'ME021601', name: 'Elements of Mechanical Engineering' },
            { code: 'ME021602', name: 'Workshop Practice-II' },
            { code: 'ME021603', name: 'Advanced Metal Machining Processes' },
            { code: 'ME021604', name: 'EAA II - Swachha Bharat Mission (SBM)' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 2' }
        ],
        3: [
            { code: 'ME031601', name: 'Material Science & Engineering' },
            { code: 'ME031602', name: 'Thermodynamics' },
            { code: 'ME031603', name: 'Manufacturing Process - I' },
            { code: 'ME031604', name: 'Strength of Materials' },
            { code: 'CE031601', name: 'Environmental Engineering' },
            { code: 'MC031601', name: 'Numerical Methods for Engineers' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 3' }
        ],
        4: [
            { code: 'ME041601', name: 'Applied Thermodynamics' },
            { code: 'ME041602', name: 'Fluid Mechanics & Machinery' },
            { code: 'ME041603', name: 'Manufacturing Process II' },
            { code: 'ME041604', name: 'Kinematics of Machines' },
            { code: 'ME041605', name: 'Industrial Engineering and Management' },
            { code: 'ME041606', name: 'Introduction to Robotics (PE-I)' },
            { code: 'ME041607', name: 'Advanced Strength of Materials (PE-I)' },
            { code: 'ME041608', name: 'Measurement and Metrology (PE-I)' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 4' }
        ],
        5: [
            { code: 'ME051601', name: 'Machine Design-I' },
            { code: 'ME051602', name: 'Heat and Mass Transfer' },
            { code: 'ME051603', name: 'CAD/CAM' },
            { code: 'ME051604', name: 'Dynamics of Machinery' },
            { code: 'HS051501', name: 'Universal Human Values & Ethics' },
            { code: 'ME05000X', name: 'Open Elective - I' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 5' }
        ],
        6: [
            { code: 'ME061601', name: 'Machine Design-II' },
            { code: 'ME061602', name: 'Internal Combustion Engine' },
            { code: 'ME061603', name: 'Seminar & Technical Writing' },
            { code: 'ME061604', name: 'Finite Element Methods (PE-II)' },
            { code: 'ME061605', name: 'Metal Forming Processes (PE-II)' },
            { code: 'ME061606', name: 'Operations Research (PE-II)' },
            { code: 'ME061607', name: 'Total Productive Maintenance (PE-II)' },
            { code: 'ME061608', name: 'Renewable Energy (PE-II)' },
            { code: 'ME061609', name: 'Additive Manufacturing & 3D Printing (PE-III)' },
            { code: 'ME061610', name: 'Power Plant Engineering (PE-III)' },
            { code: 'ME061611', name: 'Mechanical Vibration (PE-III)' },
            { code: 'ME061612', name: 'Introduction to Mechatronics (PE-III)' },
            { code: 'ME061613', name: 'Artificial Intelligence for Design & Manufacturing (PE-III)' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 6' }
        ],
        7: [
            { code: 'ME071601', name: 'Research Project-1' },
            { code: 'ME071602', name: 'Industrial Training' },
            { code: 'ME071603', name: 'Refrigeration and Air Conditioning' },
            { code: 'ME071604', name: 'Automobile Engineering' },
            { code: 'ME071605', name: 'Data Analytics (PE-IV)' },
            { code: 'ME071606', name: 'Design for Additive Manufacturing (PE-IV)' },
            { code: 'ME071607', name: 'Heat Exchanger Design (PE-IV)' },
            { code: 'ME071608', name: 'Gas Turbines (PE-IV)' },
            { code: 'ME071609', name: 'Non-Conventional Machining Processes (PE-IV)' },
            { code: 'ME071610', name: 'Quality Control and Assurance (PE-IV)' },
            { code: 'ME071611', name: 'Introduction to Biomechanics (PE-IV)' },
            { code: 'ME071612', name: 'Micro-electromechanical System (PE-IV)' },
            { code: 'ME071613', name: 'Sustainable Manufacturing (PE-IV)' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 7' }
        ],
        8: [
            { code: 'ME081601', name: 'Major Project' },
            { code: 'ME081602', name: 'Comprehensive Viva-Voce' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 8' }
        ]
    },

    EE: {
        1: [
            { code: 'CS16105',  name: 'Introduction to Computing' },
            { code: 'PH16101',  name: 'Engineering Physics' },
            { code: 'HS16101',  name: 'Communicative English' },
            { code: 'EE16105',  name: 'Electrical Engineering - I' },
            { code: 'EC16102',  name: 'Electronics Engineering' },
            { code: 'EAA16101', name: 'EAA-I (NSS/NCC/Sports/Innovative Project)' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 1' }
        ],
        2: [
            { code: 'MA26101',  name: 'Engineering Mathematics - I' },
            { code: 'CH26101',  name: 'Engineering Chemistry' },
            { code: 'EE26105',  name: 'Electrical Engineering - II' },
            { code: 'EE26106',  name: 'Electrical Workshop' },
            { code: 'EC26105',  name: 'Electronics Workshop' },
            { code: 'ME26101',  name: 'Engineering Graphics' },
            { code: 'EAA26102', name: 'EAA-II Swachha Bharat Mission (SBM)' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 2' }
        ],
        3: [
            { code: 'MA36101', name: 'Engineering Mathematics - II' },
            { code: 'EE36101', name: 'Electrical Machines - I' },
            { code: 'EE36102', name: 'Network Analysis & Synthesis (NAS)' },
            { code: 'EE36103', name: 'Electrical Measurements & Instrumentation' },
            { code: 'EE36104', name: 'Electromagnetic Field Theory (EMFT)' },
            { code: 'EC36101', name: 'Analog Electronics' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 3' }
        ],
        4: [
            { code: 'EE46101', name: 'Electrical Machines - II' },
            { code: 'EE46102', name: 'Power Transmission & Distribution' },
            { code: 'EE46103', name: 'Linear Control Systems' },
            { code: 'EC46101', name: 'Digital Electronics' },
            { code: 'CS46101', name: 'Object Oriented Programming (OOPs)' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 4' }
        ],
        5: [
            { code: 'EE56101', name: 'Power System' },
            { code: 'EE56102', name: 'Power Electronics' },
            { code: 'EE56103', name: 'Microprocessor & Microcontroller (MP & MC)' },
            { code: 'EC56101', name: 'Signals & Systems' },
            { code: 'HS56101', name: 'Professional Ethics' },
            { code: 'OE0802',  name: 'Renewable Energy (Open Elective)' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 5' }
        ],
        6: [
            { code: 'EE66101', name: 'Industrial Drives and Control' },
            { code: 'EE66102', name: 'Power System Protection and Switchgear' },
            { code: 'EE66103', name: 'Minor Project' },
            { code: 'EE66113', name: 'Modern Control Theory (DE-I)' },
            { code: 'EE66136', name: 'Advanced Micro-Controllers' },
            { code: 'EE66118', name: 'Advanced Instrumentation' },
            { code: 'EE661M1', name: 'MOOC - I (NPTEL/Swayam)' },
            { code: 'EE661M2', name: 'MOOC - II (NPTEL/Swayam)' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 6' }
        ],
        7: [
            { code: 'EE76101', name: 'Electrical Vehicle and Energy Storage System' },
            { code: 'EE76PC',  name: 'Power Converters and its Applications' },
            { code: 'EE76DE2', name: 'Departmental Elective - II' },
            { code: 'EE76DE3', name: 'Departmental Elective - III' },
            { code: 'EE76DE4', name: 'Departmental Elective - IV' },
            { code: 'EE76108', name: 'Industrial Training' },
            { code: 'EE76109', name: 'Research Project - I' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 7' }
        ],
        8: [
            { code: 'EE86101', name: 'Research Project - II' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 8' }
        ]
    },

    CE: {
        1: [
            { code: 'PH13101',  name: 'Engineering Physics' },
            { code: 'CS13101',  name: 'Information Technology Fundamentals' },
            { code: 'HS13101',  name: 'Communicative English' },
            { code: 'CE13102',  name: 'Computer Aided Civil Engineering Drawing' },
            { code: 'CE13103',  name: 'Engineering Mechanics' },
            { code: 'ME13102',  name: 'Workshop Practice - I' },
            { code: 'EAA13101', name: 'EAA-I Sports/Innovative Project/NCC/NSS' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 1' }
        ],
        2: [
            { code: 'MA23101',  name: 'Engineering Mathematics' },
            { code: 'CH23101',  name: 'Engineering Chemistry' },
            { code: 'CE23100',  name: 'Building Materials and Construction Techniques' },
            { code: 'CE23103',  name: 'Surveying and Field Practice' },
            { code: 'CE23104',  name: 'Environmental Science and Building Sanitation' },
            { code: 'CE23105',  name: 'Elements of Civil Engineering' },
            { code: 'EAA23102', name: 'EAA-II Swachha Bharat Mission (SBM)' },
            { code: 'PYQ',      name: 'Previous Year Question Papers — Sem 2' }
        ],
        3: [
            { code: 'CE33107', name: 'Mechanics of Solids' },
            { code: 'CE33109', name: 'Fluid Mechanics' },
            { code: 'CE33111', name: 'Analysis of Determinate Structures' },
            { code: 'CE33113', name: 'Soil Mechanics' },
            { code: 'CE33115', name: 'Engineering Geology' },
            { code: 'CE33125', name: 'Concrete Technology' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 3' }
        ],
        4: [
            { code: 'CE43106', name: 'Highways and Airport Engineering' },
            { code: 'CE43108', name: 'RCC Design' },
            { code: 'CE43110', name: 'Water Supply Engineering and Pollution Control' },
            { code: 'CE43112', name: 'Hydrology and Irrigation Engineering' },
            { code: 'CE43114', name: 'Estimation, Costing and Valuation' },
            { code: 'CE43180', name: 'Computational Methods in Civil Engineering' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 4' }
        ],
        5: [
            { code: 'CE53117', name: 'Analysis of Indeterminate Structures' },
            { code: 'CE53119', name: 'Liquid and Solid Waste Engineering' },
            { code: 'CE53121', name: 'Open Channel Flow' },
            { code: 'CE53123', name: 'Railways, Docks and Harbour Engineering' },
            { code: 'CE53131', name: 'Geomatics Surveying (DE-I)' },
            { code: 'CE53133', name: 'Water Resources Systems (DE-I)' },
            { code: 'CE53135', name: 'Soil Dynamics (DE-I)' },
            { code: 'CE53137', name: 'Remote Sensing and GIS (DE-I)' },
            { code: 'CE53151', name: 'Soil Stabilization (DE-II)' },
            { code: 'CE53153', name: 'Hill Road Design (DE-II)' },
            { code: 'CE53155', name: 'Matrix Analysis of Framed Structures (DE-II)' },
            { code: 'CE5OE',   name: 'Open Elective - I' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 5' }
        ],
        6: [
            { code: 'CE63116', name: 'Design of Steel Structures' },
            { code: 'CE63118', name: 'Design of Advanced Concrete Structures' },
            { code: 'CE63120', name: 'Foundation Engineering' },
            { code: 'CE63130', name: 'Design of Prestressed Concrete Structures (DE-III)' },
            { code: 'CE63132', name: 'Water Resources Planning and Management (DE-III)' },
            { code: 'CE63134', name: 'Hydraulic Structures (DE-III)' },
            { code: 'CE63144', name: 'Structural Response Control for Seismic Protection (DE-IV)' },
            { code: 'CE63148', name: 'Repair and Rehabilitation of Structures (DE-IV)' },
            { code: 'CE6MOOC', name: 'NPTEL/SWAYAM/MOOC Courses' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 6' }
        ],
        7: [
            { code: 'CE73125', name: 'Industrial Training' },
            { code: 'CE73127', name: 'Seminar and Comprehensive Viva' },
            { code: 'CE73129', name: 'Construction Practices, Planning and Management' },
            { code: 'CE73133', name: 'Machine Learning in Civil Engineering (DE-V)' },
            { code: 'CE73137', name: 'Earthquake Resistant Design (DE-V)' },
            { code: 'CE73187', name: 'Advanced Bridge Engineering (PE)' },
            { code: 'CE73191', name: 'Pavement Design (PE)' },
            { code: 'CE73131', name: 'Minor Project' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 7' }
        ],
        8: [
            { code: 'CE83124', name: 'Industrial Research Project - II' },
            { code: 'PYQ',     name: 'Previous Year Question Papers — Sem 8' }
        ]
    }
};