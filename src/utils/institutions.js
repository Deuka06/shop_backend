const institutions = [
  {
    id: 1,
    name: 'Учреждение 12 (бывшее 99)',
    code: 'INST_12',
    address: 'Қала, ... көшесі, 12',
    phone: '+7 XXX XXX-XX-XX',
    workingHours: '09:00-18:00',
  },
  {
    id: 2,
    name: 'Учреждение 14 (бывшее 103)',
    code: 'INST_14',
    address: 'Қала, ... көшесі, 14',
    phone: '+7 XXX XXX-XX-XX',
    workingHours: '09:00-18:00',
  },
  {
    id: 3,
    name: 'Учреждение 57 (бывшее 71)',
    code: 'INST_57',
    address: 'Қала, ... көшесі, 57',
    phone: '+7 XXX XXX-XX-XX',
    workingHours: '09:00-18:00',
  },
  {
    id: 4,
    name: 'Учреждение 25',
    code: 'INST_25',
    address: 'Қала, ... көшесі, 25',
    phone: '+7 XXX XXX-XX-XX',
    workingHours: '10:00-19:00',
  },
  {
    id: 5,
    name: 'Учреждение 33',
    code: 'INST_33',
    address: 'Қала, ... көшесі, 33',
    phone: '+7 XXX XXX-XX-XX',
    workingHours: '08:00-17:00',
  },
];

// Барлық мекемелерді алу
exports.getAllInstitutions = () => institutions;

// ID бойынша мекеме табу
exports.getInstitutionById = (id) => {
  return institutions.find((inst) => inst.id === parseInt(id));
};

// Код бойынша мекеме табу
exports.getInstitutionByCode = (code) => {
  return institutions.find((inst) => inst.code === code);
};
